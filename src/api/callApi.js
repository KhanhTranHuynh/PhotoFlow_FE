// src/api/callApi.js
//
// Lớp "caller" dùng chung cho mọi API. Nhiệm vụ duy nhất: gọi
// ApiRequestManager.sendRequests() và chuẩn hoá từng kết quả về đúng
// hình dạng PhanHoiChuan của BE: { data, message, messageSystem, code,
// status, token, rToken }.
//
// callApi/callApis KHÔNG throw. Vì BE dùng "code" để phân biệt thành
// công/lỗi (code >= 1: OK, code < 0: lỗi), cách tự nhiên nhất là luôn trả
// envelope, để nơi gọi tự đọc `.code`/`.message` (giống notifyApiByCode
// đang làm) thay vì phải try/catch mọi nơi.
//
// Nếu có chỗ nào vẫn muốn hành vi throw kiểu cũ (vd để dùng chung với
// useMutation.onError), dùng callApiOrThrow ở cuối file.

import { ApiRequestManager } from "@/api/apiRequestManager";
import logger from "@/helpers/logger";

/**
 * Chuẩn hoá 1 kết quả từ ApiRequestManager thành envelope PhanHoiChuan.
 */
function toEnvelope(result) {
  if (result.status === "success") {
    // result.data đã là nguyên response.data từ BE (PhanHoiChuan)
    return result.data;
  }

  if (result.status === "skipped") {
    return {
      data: null,
      message: "Request bị bỏ qua do request trước đó lỗi (stopOnError).",
      messageSystem: null,
      code: -1,
      status: 0,
      token: null,
      rToken: null,
      __skipped: true,
    };
  }

  logger.error(`[callApi] Lỗi gọi API`, {
    apiUrl: result.apiUrl,
    key: result.key,
    error: result.error,
  });

  // Nếu http.js đã reject bằng lỗi nghiệp vụ thật (code<0 từ BE), body lỗi
  // nằm ở error.responseData và đã là PhanHoiChuan chuẩn -> dùng thẳng.
  const bodyFromServer = result?.error?.responseData;
  if (bodyFromServer && typeof bodyFromServer.code === "number") {
    return bodyFromServer;
  }

  // Lỗi hạ tầng thật (network, timeout, CORS, abort...) -> BE không kịp
  // trả envelope nào cả, tự tạo envelope giả để nơi gọi vẫn xử lý theo
  // đúng MỘT hình dạng duy nhất.
  return {
    data: null,
    message: result?.error?.message || "Gọi API thất bại.",
    messageSystem: null,
    code: -1,
    status: result?.error?.httpStatus ?? 0,
    token: null,
    rToken: null,
    __networkError: true,
    __canceled: !!result?.error?.isCanceled,
  };
}

/**
 * Gọi 1 request đơn lẻ.
 * @returns {Promise<object>} envelope PhanHoiChuan, không throw.
 */
export async function callApi(requestDef, { showOverlay = true } = {}) {
  const { results } = await ApiRequestManager.sendRequests({
    parallel: true,
    showOverlay,
    apiList: [requestDef],
  });
  return toEnvelope(results[0]);
}

/**
 * Gọi nhiều request — tự chọn song song/tuần tự qua tham số `parallel`,
 * KHÔNG cần Promise.allSettled viết tay ở component nữa.
 *
 * @param {Array<object>} requestDefs - danh sách descriptor request
 * @param {object} [options]
 * @param {boolean} [options.parallel=true] - true: song song, false: tuần tự
 * @param {boolean} [options.stopOnError=false] - chỉ áp dụng khi parallel=false
 * @param {boolean} [options.showOverlay=true]
 * @returns {Promise<object[]>} mảng envelope PhanHoiChuan theo đúng thứ tự requestDefs
 */

//parallel = true: gọi song song, trả về mảng kết quả theo đúng thứ tự requestDefs
//parallel = false: gọi tuần tự, nếu stopOnError=true thì dừng khi gặp lỗi đầu tiên
export async function callApis(
  requestDefs,
  { parallel = true, stopOnError = false, showOverlay = true } = {},
) {
  const { results } = await ApiRequestManager.sendRequests({
    parallel,
    stopOnError,
    showOverlay,
    apiList: requestDefs,
  });
  return results.map(toEnvelope);
}

/**
 * Biến thể throw khi code<0 — dùng cho những nơi vẫn muốn pattern
 * try/catch cũ (vd useMutation.onError, hoặc code hiện có chưa kịp sửa
 * sang đọc `.code` trực tiếp).
 */
export async function callApiOrThrow(requestDef, opts) {
  const envelope = await callApi(requestDef, opts);
  if (envelope.code < 0) {
    const error = new Error(envelope.message);
    error.code = envelope.code;
    error.messageSystem = envelope.messageSystem;
    error.response = { data: envelope };
    throw error;
  }
  return envelope;
}
