// src/api/ApiRequestManager.js
import http from "@/api/http"; // 👈 dùng lại axios instance đã có interceptor auth/refresh
import logger from "@/helpers/logger";

const LOG_TAG = "[ApiRequestManager]";

/**
 * Tạo tag log dạng "[METHOD apiUrl]" để biết ngay log đang nói về API nào,
 * không cần mở object data ra xem.
 * VD: buildApiTag("POST", "/users/login") -> "[POST /users/login]"
 */
function buildApiTag(method, apiUrl) {
  return `[${String(method ?? "POST").toUpperCase()} ${apiUrl ?? "unknown"}]`;
}

/**
 * ApiRequestManager
 *
 * Chức năng:
 *  - Quản lý hàng đợi batch request.
 *  - Giới hạn số batch chạy đồng thời (maxConcurrentBatches).
 *  - Chạy request song song hoặc tuần tự trong từng batch.
 *  - Quản lý overlay loading toàn app bằng reference counter.
 *  - Callback success/error độc lập từng request.
 *  - Hỗ trợ AbortController (signal).
 *  - Ghi log toàn bộ vòng đời batch/request qua `logger` (helpers/logger).
 *
 * Không tự tạo axios instance riêng. Toàn bộ request đi qua `http` (http.js)
 * để không mất cơ chế gắn token / refresh token / redirect login khi lỗi
 * xác thực (dựa trên "code" của PhanHoiChuan, xem http.js). Nhờ vậy
 * interceptor chỉ đăng ký một lần duy nhất ở http.js, tránh tích lũy
 * interceptor theo thời gian.
 *
 * Lưu ý về hình dạng dữ liệu: `data` trả về trong mỗi kết quả (results[i].data)
 * là NGUYÊN response.data từ BE, tức nguyên envelope PhanHoiChuan
 * { data, message, messageSystem, code, status, token, rToken }.
 * ApiRequestManager KHÔNG unwrap xuống .data.data — việc đọc field nào
 * trong envelope là trách nhiệm của tầng gọi (callApi/callApis).
 */
export class ApiRequestManager {
  static config = {
    maxConcurrentBatches: 10,
    defaultShowOverlay: true,
    defaultHeaders: {},
    onOverlayChange: undefined,
    onCallbackError: undefined,
    // Bật/tắt log chi tiết từng request (payload, response...). Mặc định false
    // để tránh log rò rỉ dữ liệu nhạy cảm ở production.
    verboseRequestLogging: false,
  };

  static batchQueue = [];
  static activeBatchCount = 0;
  static overlayRefCount = 0;
  static batchSequence = 0;

  constructor() {
    // Static manager, không cần khởi tạo instance.
  }

  /**
   * Cấu hình scheduler dùng chung cho toàn app.
   * Không cấu hình baseURL/timeout/withCredentials ở đây nữa vì các giá trị
   * này đã được `http.js` quản lý (config.HOST, timeout: 60000...).
   *
   * Có thể cấu hình lại bất kỳ lúc nào; các batch chưa chạy sẽ dùng giá trị
   * mới nhất.
   */
  static configure(config = {}) {
    this.config = {
      ...this.config,
      ...config,
      defaultHeaders:
        config.defaultHeaders !== undefined
          ? { ...config.defaultHeaders }
          : this.config.defaultHeaders,
    };

    if (
      !Number.isInteger(this.config.maxConcurrentBatches) ||
      this.config.maxConcurrentBatches < 1
    ) {
      const err = new Error(
        "ApiRequestManager.maxConcurrentBatches must be an integer >= 1.",
      );
      logger.error?.(`${LOG_TAG} configure() invalid config`, {
        maxConcurrentBatches: this.config.maxConcurrentBatches,
        error: err.message,
      });
      throw err;
    }

    logger.info?.(`${LOG_TAG} configure()`, {
      maxConcurrentBatches: this.config.maxConcurrentBatches,
      defaultShowOverlay: this.config.defaultShowOverlay,
      verboseRequestLogging: this.config.verboseRequestLogging,
    });

    // Nếu tăng concurrency lúc queue đang có dữ liệu, lấy thêm batch chạy ngay.
    this.schedule();
  }

  /**
   * Gắn handler overlay cho React root (vd: dispatch redux hoặc setState context).
   * Trả về hàm cleanup để tránh giữ reference setState khi component unmount.
   */
  static setOverlayHandler(handler) {
    this.config.onOverlayChange = handler;
    logger.debug?.(`${LOG_TAG} setOverlayHandler() attached`);

    return () => {
      if (this.config.onOverlayChange === handler) {
        this.config.onOverlayChange = undefined;
        logger.debug?.(`${LOG_TAG} setOverlayHandler() cleanup`);
      }
    };
  }

  /**
   * Thêm một batch vào queue.
   *
   * Promise luôn resolve nếu HTTP request lỗi bình thường (401, 500...).
   * Chi tiết lỗi nằm trong batchResult.results[i].error.
   * Promise chỉ reject khi có lỗi nội bộ ngoài dự kiến của manager.
   *
   * @param {object} options
   * @param {Array} options.apiList - danh sách request
   * @param {boolean} options.parallel - true: chạy song song, false: tuần tự
   * @param {boolean} [options.showOverlay] - bật overlay cho cả batch
   * @param {boolean} [options.stopOnError] - chỉ áp dụng khi parallel=false
   * @param {string} [options.batchId]
   */
  static sendRequests(options) {
    this.validateSendOptions(options);

    const batchId = options.batchId?.trim() || this.createBatchId();

    // Copy mảng để caller thay đổi apiList bên ngoài không ảnh hưởng batch đã enqueue.
    const apiList = [...options.apiList];

    logger.info?.(`${LOG_TAG} sendRequests() enqueue`, {
      batchId,
      parallel: options.parallel,
      requestCount: apiList.length,
      showOverlay: options.showOverlay,
      stopOnError: options.stopOnError ?? false,
      queueSizeBefore: this.batchQueue.length,
    });

    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        options: {
          apiList,
          parallel: options.parallel,
          showOverlay: options.showOverlay,
          stopOnError: options.stopOnError ?? false,
          batchId,
        },
        resolve: (result) => {
          logger.info?.(`${LOG_TAG} sendRequests() batch resolved`, {
            batchId,
            successCount: result.successCount,
            errorCount: result.errorCount,
            skippedCount: result.skippedCount,
          });
          resolve(result);
        },
        reject: (error) => {
          logger.error?.(`${LOG_TAG} sendRequests() batch rejected`, {
            batchId,
            error: error?.message ?? error,
          });
          reject(error);
        },
      });

      this.schedule();
    });
  }

  static getQueueSize() {
    return this.batchQueue.length;
  }

  static getActiveBatchCount() {
    return this.activeBatchCount;
  }

  static validateSendOptions(options) {
    if (!options) {
      const err = new Error(
        "ApiRequestManager.sendRequests options is required.",
      );
      logger.error?.(`${LOG_TAG} validateSendOptions() failed`, {
        error: err.message,
      });
      throw err;
    }

    if (!Array.isArray(options.apiList)) {
      const err = new Error(
        "ApiRequestManager.sendRequests apiList must be an array.",
      );
      logger.error?.(`${LOG_TAG} validateSendOptions() failed`, {
        error: err.message,
      });
      throw err;
    }

    options.apiList.forEach((request, index) => {
      if (!request?.apiUrl?.trim()) {
        const err = new Error(`apiList[${index}].apiUrl is required.`);
        logger.error?.(`${LOG_TAG} validateSendOptions() failed`, {
          index,
          error: err.message,
        });
        throw err;
      }
    });
  }

  /**
   * Chạy batch trong queue theo maxConcurrentBatches.
   */
  static schedule() {
    const maxConcurrent = this.config.maxConcurrentBatches ?? 10;

    while (
      this.activeBatchCount < maxConcurrent &&
      this.batchQueue.length > 0
    ) {
      const task = this.batchQueue.shift();
      if (!task) return;

      this.activeBatchCount++;

      logger.debug?.(`${LOG_TAG} schedule() start batch`, {
        batchId: task.options.batchId,
        activeBatchCount: this.activeBatchCount,
        remainingQueueSize: this.batchQueue.length,
      });

      this.executeBatch(task.options)
        .then(task.resolve)
        .catch(task.reject)
        .finally(() => {
          task.options.apiList.length = 0;
          this.activeBatchCount--;
          logger.debug?.(`${LOG_TAG} schedule() finished batch`, {
            batchId: task.options.batchId,
            activeBatchCount: this.activeBatchCount,
            remainingQueueSize: this.batchQueue.length,
          });
          this.schedule();
        });
    }
  }

  static async executeBatch(options) {
    const batchShowOverlay =
      options.showOverlay ?? this.config.defaultShowOverlay ?? false;

    const startedAt = Date.now();

    if (batchShowOverlay) {
      this.acquireOverlay();
    }

    try {
      const results = options.parallel
        ? await this.executeParallel(options.apiList, batchShowOverlay)
        : await this.executeSequential(
            options.apiList,
            batchShowOverlay,
            options.stopOnError,
          );

      let successCount = 0;
      let errorCount = 0;
      let skippedCount = 0;

      for (const result of results) {
        if (result.status === "success") successCount++;
        else if (result.status === "error") errorCount++;
        else if (result.status === "skipped") skippedCount++;
      }

      const durationMs = Date.now() - startedAt;

      logger.info?.(`${LOG_TAG} executeBatch() done`, {
        batchId: options.batchId,
        parallel: options.parallel,
        successCount,
        errorCount,
        skippedCount,
        durationMs,
      });

      if (errorCount > 0) {
        logger.warn?.(`${LOG_TAG} executeBatch() completed with errors`, {
          batchId: options.batchId,
          errorCount,
          failedRequests: results
            .filter((r) => r.status === "error")
            .map((r) => ({ key: r.key, statusCode: r.statusCode })),
        });
      }

      return {
        batchId: options.batchId,
        parallel: options.parallel,
        successCount,
        errorCount,
        skippedCount,
        results,
      };
    } catch (error) {
      logger.error?.(`${LOG_TAG} executeBatch() unexpected failure`, {
        batchId: options.batchId,
        error: error?.message ?? error,
      });
      throw error;
    } finally {
      if (batchShowOverlay) {
        this.releaseOverlay();
      }
    }
  }

  static async executeParallel(apiList, batchShowOverlay) {
    const settled = await Promise.allSettled(
      apiList.map((request) => this.executeRequest(request, batchShowOverlay)),
    );

    return settled.map((item, index) => {
      if (item.status === "fulfilled") return item.value;
      logger.error?.(
        `${LOG_TAG} executeParallel() request threw unexpectedly`,
        {
          apiUrl: apiList[index]?.apiUrl,
          error: item.reason?.message ?? item.reason,
        },
      );
      return this.createUnexpectedErrorResult(apiList[index], item.reason);
    });
  }

  static async executeSequential(apiList, batchShowOverlay, stopOnError) {
    const results = [];

    for (let index = 0; index < apiList.length; index++) {
      const request = apiList[index];
      const result = await this.executeRequest(request, batchShowOverlay);
      results.push(result);

      if (stopOnError && result.status === "error") {
        logger.warn?.(`${LOG_TAG} executeSequential() stopOnError triggered`, {
          apiUrl: request.apiUrl,
          skippedCount: apiList.length - index - 1,
        });

        for (
          let skipIndex = index + 1;
          skipIndex < apiList.length;
          skipIndex++
        ) {
          results.push(this.createSkippedResult(apiList[skipIndex]));
        }
        break;
      }
    }

    return results;
  }

  /**
   * Thực thi một request độc lập qua `http` (http.js).
   * Không tự gắn Authorization/rtoken ở đây nữa — interceptor của http.js
   * đã tự lấy token mới nhất ngay trước khi request chạy.
   */
  static async executeRequest(request, batchShowOverlay) {
    const method = request.method ?? "POST";
    const key = this.getRequestKey(request, method);
    const apiTag = buildApiTag(method, request.apiUrl);
    const startedAt = Date.now();

    // Nếu batch đã bật overlay thì request không tăng ref count nữa.
    const requestShowOverlay =
      !batchShowOverlay && request.showOverlay === true;

    if (requestShowOverlay) {
      this.acquireOverlay();
    }

    logger.debug?.(`${LOG_TAG} ${apiTag} executeRequest() start`, {
      key,
      ...(this.config.verboseRequestLogging ? { params: request.params } : {}),
    });

    try {
      const requestData = request.dataFactory
        ? await request.dataFactory()
        : request.data;

      const headers = {
        ...(this.config.defaultHeaders ?? {}),
        ...(request.headers ?? {}),
      };

      const response = await http.request({
        url: request.apiUrl,
        method,
        data: requestData,
        params: request.params,
        headers,
        timeout: request.timeout, // undefined -> dùng timeout mặc định của http.js
        signal: request.signal,
      });

      const durationMs = Date.now() - startedAt;

      logger.info?.(`${LOG_TAG} ${apiTag} executeRequest() success`, {
        key,
        code: response.data?.code,
        durationMs,
      });

      if (this.config.verboseRequestLogging) {
        logger.debug?.(`${LOG_TAG} ${apiTag} executeRequest() response data`, {
          key,
          data: response.data,
        });
      }

      await this.safeSuccessCallback(request, response);

      return {
        key,
        apiUrl: request.apiUrl,
        method,
        status: "success",
        // statusCode ở đây là "code" nghiệp vụ của BE (PhanHoiChuan.code),
        // không phải HTTP status (BE luôn trả 200).
        statusCode: response.data?.code,
        // Trả NGUYÊN envelope PhanHoiChuan { data, message, code, ... },
        // không unwrap xuống .data.data. Tầng callApi/callApis chịu trách
        // nhiệm đọc field cụ thể.
        data: response.data,
      };
    } catch (error) {
      const errorInfo = this.normalizeError(error);
      const durationMs = Date.now() - startedAt;

      if (errorInfo.isCanceled) {
        logger.warn?.(`${LOG_TAG} ${apiTag} executeRequest() canceled`, {
          key,
          durationMs,
        });
      } else {
        logger.error?.(`${LOG_TAG} ${apiTag} executeRequest() failed`, {
          key,
          statusCode: errorInfo.statusCode,
          message: errorInfo.message,
          durationMs,
        });
      }

      await this.safeErrorCallback(request, errorInfo);

      return {
        key,
        apiUrl: request.apiUrl,
        method,
        status: "error",
        statusCode: errorInfo.statusCode,
        error: errorInfo,
      };
    } finally {
      if (requestShowOverlay) {
        this.releaseOverlay();
      }
    }
  }

  static async safeSuccessCallback(request, response) {
    if (!request.successCallBack) return;
    try {
      await request.successCallBack(response.data, response, request);
    } catch (error) {
      logger.error?.(`${LOG_TAG} successCallBack threw`, {
        apiUrl: request.apiUrl,
        error: error?.message ?? error,
      });
      this.handleCallbackError(error, request);
    }
  }

  static async safeErrorCallback(request, errorInfo) {
    if (!request.errorCallBack) return;
    try {
      await request.errorCallBack(errorInfo, request);
    } catch (error) {
      logger.error?.(`${LOG_TAG} errorCallBack threw`, {
        apiUrl: request.apiUrl,
        error: error?.message ?? error,
      });
      this.handleCallbackError(error, request);
    }
  }

  static handleCallbackError(error, request) {
    try {
      this.config.onCallbackError?.(error, request);
    } catch (handlerError) {
      // Không để lỗi của error handler làm hỏng scheduler.
      logger.error?.(`${LOG_TAG} onCallbackError handler threw`, {
        apiUrl: request?.apiUrl,
        error: handlerError?.message ?? handlerError,
      });
    }
  }

  /**
   * Chuẩn hoá lỗi từ axios.
   * - Nếu error là lỗi nghiệp vụ do http.js tự tạo (isBusinessError: true,
   *   xem makeBusinessError trong http.js/handleAuthCode) thì error.response.data
   *   ĐÃ LÀ envelope PhanHoiChuan chuẩn { code, message, data... }.
   * - Nếu là lỗi HTTP thật (500, network, timeout) thì error.response.data
   *   có thể không tồn tại hoặc không đúng hình dạng PhanHoiChuan.
   */
  static normalizeError(error) {
    if (error?.isAxiosError) {
      const body = error.response?.data;
      return {
        message: body?.message || error.message || "Yêu cầu thất bại.",
        messageSystem: body?.messageSystem ?? null,
        statusCode:
          typeof body?.code === "number" ? body.code : error.response?.status,
        httpStatus: error.response?.status,
        responseData: body,
        isCanceled: error.code === "ERR_CANCELED",
      };
    }

    if (error instanceof Error) {
      return { message: error.message, isCanceled: false };
    }

    return {
      message: "Unknown API request error.",
      responseData: error,
      isCanceled: false,
    };
  }

  static createUnexpectedErrorResult(request, error) {
    const method = request.method ?? "POST";
    const errorInfo = this.normalizeError(error);

    return {
      key: this.getRequestKey(request, method),
      apiUrl: request.apiUrl,
      method,
      status: "error",
      statusCode: errorInfo.statusCode,
      error: errorInfo,
    };
  }

  static createSkippedResult(request) {
    const method = request.method ?? "POST";
    return {
      key: this.getRequestKey(request, method),
      apiUrl: request.apiUrl,
      method,
      status: "skipped",
    };
  }

  static getRequestKey(request, method) {
    return (
      request.key?.trim() || `${String(method).toUpperCase()} ${request.apiUrl}`
    );
  }

  static createBatchId() {
    this.batchSequence++;
    return ["batch", Date.now(), this.batchSequence].join("-");
  }

  static acquireOverlay() {
    this.overlayRefCount++;
    logger.debug?.(`${LOG_TAG} acquireOverlay()`, {
      overlayRefCount: this.overlayRefCount,
    });
    if (this.overlayRefCount !== 1) return;

    try {
      this.config.onOverlayChange?.(true);
    } catch (error) {
      // Overlay UI lỗi không được làm hỏng scheduler.
      logger.error?.(`${LOG_TAG} onOverlayChange(true) threw`, {
        error: error?.message ?? error,
      });
    }
  }

  static releaseOverlay() {
    if (this.overlayRefCount <= 0) {
      this.overlayRefCount = 0;
      return;
    }

    this.overlayRefCount--;
    logger.debug?.(`${LOG_TAG} releaseOverlay()`, {
      overlayRefCount: this.overlayRefCount,
    });
    if (this.overlayRefCount !== 0) return;

    try {
      this.config.onOverlayChange?.(false);
    } catch (error) {
      // Overlay UI lỗi không được làm hỏng scheduler.
      logger.error?.(`${LOG_TAG} onOverlayChange(false) threw`, {
        error: error?.message ?? error,
      });
    }
  }
}
