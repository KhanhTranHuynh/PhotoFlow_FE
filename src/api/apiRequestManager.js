// src/api/ApiRequestManager.js
import http from "@/api/http"; // 👈 dùng lại axios instance đã có interceptor auth/refresh

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
 *
 * Không tự tạo axios instance riêng. Toàn bộ request đi qua `http` (http.js)
 * để không mất cơ chế gắn token / refresh token / redirect login khi 401-403.
 * Nhờ vậy interceptor chỉ đăng ký một lần duy nhất ở http.js, tránh tích lũy
 * interceptor theo thời gian.
 */
export class ApiRequestManager {
  static config = {
    maxConcurrentBatches: 10,
    defaultShowOverlay: false,
    defaultHeaders: {},
    onOverlayChange: undefined,
    onCallbackError: undefined,
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
      throw new Error(
        "ApiRequestManager.maxConcurrentBatches must be an integer >= 1.",
      );
    }

    // Nếu tăng concurrency lúc queue đang có dữ liệu, lấy thêm batch chạy ngay.
    this.schedule();
  }

  /**
   * Gắn handler overlay cho React root (vd: dispatch redux hoặc setState context).
   * Trả về hàm cleanup để tránh giữ reference setState khi component unmount.
   */
  static setOverlayHandler(handler) {
    this.config.onOverlayChange = handler;

    return () => {
      if (this.config.onOverlayChange === handler) {
        this.config.onOverlayChange = undefined;
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

    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        options: {
          apiList,
          parallel: options.parallel,
          showOverlay: options.showOverlay,
          stopOnError: options.stopOnError ?? false,
          batchId,
        },
        resolve,
        reject,
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
      throw new Error("ApiRequestManager.sendRequests options is required.");
    }

    if (!Array.isArray(options.apiList)) {
      throw new Error(
        "ApiRequestManager.sendRequests apiList must be an array.",
      );
    }

    options.apiList.forEach((request, index) => {
      if (!request?.apiUrl?.trim()) {
        throw new Error(`apiList[${index}].apiUrl is required.`);
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

      this.executeBatch(task.options)
        .then(task.resolve)
        .catch(task.reject)
        .finally(() => {
          task.options.apiList.length = 0;
          this.activeBatchCount--;
          this.schedule();
        });
    }
  }

  static async executeBatch(options) {
    const batchShowOverlay =
      options.showOverlay ?? this.config.defaultShowOverlay ?? false;

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

      return {
        batchId: options.batchId,
        parallel: options.parallel,
        successCount,
        errorCount,
        skippedCount,
        results,
      };
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

    // Nếu batch đã bật overlay thì request không tăng ref count nữa.
    const requestShowOverlay =
      !batchShowOverlay && request.showOverlay === true;

    if (requestShowOverlay) {
      this.acquireOverlay();
    }

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

      await this.safeSuccessCallback(request, response);

      return {
        key,
        apiUrl: request.apiUrl,
        method,
        status: "success",
        statusCode: response.status,
        data: response.data,
      };
    } catch (error) {
      const errorInfo = this.normalizeError(error);
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
      this.handleCallbackError(error, request);
    }
  }

  static async safeErrorCallback(request, errorInfo) {
    if (!request.errorCallBack) return;
    try {
      await request.errorCallBack(errorInfo, request);
    } catch (error) {
      this.handleCallbackError(error, request);
    }
  }

  static handleCallbackError(error, request) {
    try {
      this.config.onCallbackError?.(error, request);
    } catch {
      // Không để lỗi của error handler làm hỏng scheduler.
    }
  }

  static normalizeError(error) {
    if (error?.isAxiosError) {
      return {
        message: error.message || "Axios request failed.",
        statusCode: error.response?.status,
        code: error.code,
        responseData: error.response?.data,
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
    if (this.overlayRefCount !== 1) return;

    try {
      this.config.onOverlayChange?.(true);
    } catch {
      // Overlay UI lỗi không được làm hỏng scheduler.
    }
  }

  static releaseOverlay() {
    if (this.overlayRefCount <= 0) {
      this.overlayRefCount = 0;
      return;
    }

    this.overlayRefCount--;
    if (this.overlayRefCount !== 0) return;

    try {
      this.config.onOverlayChange?.(false);
    } catch {
      // Overlay UI lỗi không được làm hỏng scheduler.
    }
  }
}
