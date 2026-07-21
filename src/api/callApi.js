// src/api/callApi.js
import { ApiRequestManager } from "@/api/apiRequestManager";
import logger from "@/helpers/logger";

/**
 * Chuẩn hoá 1 kết quả từ ApiRequestManager thành envelope PhanHoiChuan.
 * - Lỗi tầng HTTP thật (mất mạng, 500, timeout...) -> tạo envelope giả
 *   dạng { code: -1, message, data: null } để nơi gọi luôn xử lý theo
 *   MỘT hình dạng duy nhất, không cần if/else phân biệt "lỗi mạng" vs
 *   "lỗi nghiệp vụ".
 * - Skipped (do stopOnError ở batch tuần tự) -> cũng trả envelope lỗi.
 * - Success -> trả nguyên response.data (đã là PhanHoiChuan từ BE).
 */
function toEnvelope(result) {
  if (result.status === "success") {
    return result.data; // { data, message, messageSystem, code, status, token, rToken }
  }

  if (result.status === "skipped") {
    return {
      data: null,
      message: "Request bị bỏ qua do request trước đó lỗi.",
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

  // Nếu http.js đã reject bằng lỗi nghiệp vụ thật (isBusinessError), body lỗi
  // nằm ở error.responseData và đã là PhanHoiChuan chuẩn -> ưu tiên dùng luôn.
  const bodyFromServer = result?.error?.responseData;
  if (bodyFromServer && typeof bodyFromServer.code === "number") {
    return bodyFromServer;
  }

  // Lỗi hạ tầng thật (network, timeout, CORS...) -> tự tạo envelope giả
  return {
    data: null,
    message: result?.error?.message || "Gọi API thất bại.",
    messageSystem: null,
    code: -1,
    status: result?.error?.statusCode ?? 0,
    token: null,
    rToken: null,
    __networkError: true,
  };
}

/** Gọi 1 request đơn lẻ. Trả nguyên envelope PhanHoiChuan, KHÔNG throw. */
export async function callApi(requestDef, { showOverlay = true } = {}) {
  const { results } = await ApiRequestManager.sendRequests({
    parallel: true,
    showOverlay,
    apiList: [requestDef],
  });
  return toEnvelope(results[0]);
}

/**
 * Gọi nhiều request — tự chọn song song/tuần tự qua tham số `parallel`.
 * Trả về mảng envelope theo đúng thứ tự requestDefs. Không throw — nơi
 * gọi tự đọc `.code` từng cái để quyết định.
 */
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
