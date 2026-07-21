import axios from "axios";
import config from "@/helpers/config";
import logger from "@/helpers/logger";
import {
  getAccessToken,
  getRefreshToken,
  setToken_rToken,
  clearTokens,
} from "@/utils/authTokens";
import {
  isTokenExpiredResponse,
  isAuthErrorResponse,
} from "@/api/isTokenExpired";

const http = axios.create({
  baseURL: config.HOST,
  timeout: 60000,
});

let refreshPromise = null;

const AUTH_PATHS_NO_REFRESH = [
  "/public/xac-thuc/dang-nhap",
  "/auth/refresh-token",
];

function isAuthEndpoint(cfg) {
  const url = String(cfg?.url || "");
  return AUTH_PATHS_NO_REFRESH.some((p) => url.includes(p));
}

function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      logger.info("[refreshAccessToken] refreshing...");

      const res = await axios.post(
        `${config.HOST}/auth/refresh-token`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      // BE mới: PhanHoiChuan -> token/rToken nằm TOP-LEVEL của body,
      // không còn lồng trong "data.data" như trước.
      setToken_rToken({
        data: {
          accessToken: res?.data?.token,
          refreshToken: res?.data?.rToken,
        },
      });

      logger.info("[refreshAccessToken] success");
      return res?.data?.token || null;
    } catch (e) {
      logger.error("[refreshAccessToken] failed", e?.response?.data || e);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Request interceptor: attach access token + refresh token
http.interceptors.request.use(
  (req) => {
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    req.headers = req.headers || {};
    req.headers["Content-Type"] =
      req.headers["Content-Type"] || "application/json";
    if (token) req.headers["Authorization"] = `Bearer ${token}`;
    if (refreshToken) req.headers["rtoken"] = refreshToken; // backend middleware đọc header "rtoken"

    return req;
  },
  (error) => Promise.reject(error),
);

/**
 * Xử lý chung case "hết hạn token / không có quyền" cho CẢ 2 nhánh
 * (success 200 lẫn error thật của axios). Vì BE luôn trả HTTP 200
 * (guiPhanHoi), case hết hạn token giờ nằm ở NHÁNH SUCCESS với code<0,
 * không còn nằm ở nhánh lỗi axios như bản cũ.
 *
 * @returns {"retry"|"redirected"|null}
 */
async function handleAuthCode(body, originalRequest) {
  if (isAuthEndpoint(originalRequest)) return null;

  const code = body?.code;

  if (isTokenExpiredResponse(code) && !originalRequest?._retry) {
    originalRequest._retry = true;
    const newAccessToken = await refreshAccessToken();

    if (!newAccessToken) {
      clearTokens();
      redirectToLogin();
      return "redirected";
    }

    originalRequest.headers = originalRequest.headers || {};
    originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
    return "retry";
  }

  if (isAuthErrorResponse(code, undefined)) {
    clearTokens();
    redirectToLogin();
    return "redirected";
  }

  return null;
}

// Response interceptor
http.interceptors.response.use(
  async (response) => {
    if (response.config?.responseType === "blob") {
      return response;
    }

    const body = response.data;

    // Token gối đầu: middleware tự cấp cặp token mới trong lúc request
    // hiện tại đang chạy -> guiPhanHoi() nhúng vào TOP-LEVEL "token"/"rToken".
    if (body?.token || body?.rToken) {
      setToken_rToken({
        data: { accessToken: body.token, refreshToken: body.rToken },
      });
    }

    // BE luôn trả HTTP 200, phân biệt lỗi bằng "code". code < 0 => lỗi.
    if (typeof body?.code === "number" && body.code < 0) {
      const action = await handleAuthCode(body, response.config);

      if (action === "retry") {
        return http.request(response.config);
      }

      if (action === "redirected") {
        return Promise.reject(
          Object.assign(
            new Error(body?.message || "Không có quyền truy cập."),
            {
              isAxiosError: true,
              isBusinessError: true,
              response,
            },
          ),
        );
      }

      // code < 0 nhưng KHÔNG phải lỗi auth (validate, not found...)
      // -> KHÔNG reject. Trả nguyên response để envelope { code, message,
      // data } chảy nguyên vẹn xuống caller (callApi/notifyApiByCode tự
      // đọc "code" để quyết định).
    }

    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    if (!error?.response) return Promise.reject(error);

    const body = error.response?.data;
    const action = await handleAuthCode(body, originalRequest);

    if (action === "retry") {
      return http.request(originalRequest);
    }

    if (
      action === null &&
      isAuthErrorResponse(body?.code, error.response.status)
    ) {
      clearTokens();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default http;
