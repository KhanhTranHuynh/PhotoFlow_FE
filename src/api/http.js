import axios from "axios";
import config from "@/helpers/config";
import logger from "@/helpers/logger";
import {
  getAccessToken,
  getRefreshToken,
  setToken_rToken,
  clearTokens,
} from "@/utils/authTokens";
import { isTokenExpiredResponse } from "@/api/isTokenExpired";

const http = axios.create({
  baseURL: config.HOST,
  timeout: 60000,
});

let refreshPromise = null;

const AUTH_PATHS_NO_REFRESH = [
  "/public/xac-thuc/dang-nhap",
  "/auth/refresh-token",
];

function isAuthEndpoint(config) {
  const url = String(config?.url || "");
  return AUTH_PATHS_NO_REFRESH.some((p) => url.includes(p));
}

function isAuthErrorResponse(err) {
  const r = err?.response;
  const httpStatus = r?.status;
  const statusCodeInBody = r?.data?.statusCode;

  return (
    httpStatus === 401 ||
    httpStatus === 403 ||
    statusCodeInBody === 401 ||
    statusCodeInBody === 403
  );
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

      // Dùng axios "thô" để tránh loop interceptor
      const res = await axios.post(
        `${config.HOST}/auth/refresh-token`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

      // set cookie access/refresh mới
      setToken_rToken(res.data);

      const newAccessToken = res?.data?.data?.accessToken || null;
      logger.info("[refreshAccessToken] success");

      return newAccessToken;
    } catch (e) {
      logger.error("[refreshAccessToken] failed", e?.response?.data || e);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// Request interceptor: attach token
http.interceptors.request.use(
  (req) => {
    const token = getAccessToken();

    req.headers = req.headers || {};
    req.headers["Content-Type"] =
      req.headers["Content-Type"] || "application/json";
    if (token) req.headers["Authorization"] = `Bearer ${token}`;

    return req;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
http.interceptors.response.use(
  (response) => {
    // Bỏ qua blob/file response
    if (response.config?.responseType === "blob") {
      return response;
    }

    // Nếu backend trả token mới thì auto set
    if (
      response?.data?.data?.accessToken ||
      response?.data?.data?.refreshToken
    ) {
      setToken_rToken(response.data);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    // Lỗi mạng/timeout không có response
    if (!error?.response) return Promise.reject(error);

    // Không refresh cho các endpoint auth (tránh loop / hành vi sai khi login fail)
    if (isAuthEndpoint(originalRequest)) {
      return Promise.reject(error);
    }

    // Token hết hạn/401 => refresh + retry (chỉ 1 lần)
    if (isTokenExpiredResponse(error) && !originalRequest?._retry) {
      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();

      if (!newAccessToken) {
        clearTokens();
        redirectToLogin();
        return Promise.reject(error);
      }

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;

      return http.request(originalRequest);
    }

    // Vẫn 401/403 sau khi đã retry (hoặc 403 ngay từ đầu) => logout + về login
    if (isAuthErrorResponse(error)) {
      clearTokens();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default http;
