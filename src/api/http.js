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

      const res = await axios.post(
        `${config.HOST}/auth/refresh-token`,
        { refreshToken },
        { headers: { "Content-Type": "application/json" } },
      );

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

// Request interceptor: attach access token + refresh token
http.interceptors.request.use(
  (req) => {
    const token = getAccessToken();
    const refreshToken = getRefreshToken(); // ✅ lấy refresh token

    req.headers = req.headers || {};
    req.headers["Content-Type"] =
      req.headers["Content-Type"] || "application/json";
    if (token) req.headers["Authorization"] = `Bearer ${token}`;
    if (refreshToken) req.headers["rtoken"] = refreshToken; // ✅ FIX: backend middleware đọc header "rtoken"

    return req;
  },
  (error) => Promise.reject(error),
);

// Response interceptor
http.interceptors.response.use(
  (response) => {
    if (response.config?.responseType === "blob") {
      return response;
    }

    // Case cũ: token nằm trong response.data.data.{accessToken,refreshToken}
    if (
      response?.data?.data?.accessToken ||
      response?.data?.data?.refreshToken
    ) {
      setToken_rToken(response.data);
    }

    // ✅ FIX: case mới — xacThucJWT middleware tự refresh khi access token
    // hết hạn (nhánh 2), trả cặp token mới qua res.locals.tokenMoi ->
    // guiPhanHoi() nhúng vào TOP-LEVEL "token" / "rToken" của response
    // body (không lồng trong "data"). Phải bắt case này để lưu lại,
    // nếu không lần request sau vẫn dùng access token cũ đã hết hạn.
    if (response?.data?.token || response?.data?.rToken) {
      setToken_rToken({
        data: {
          accessToken: response.data.token,
          refreshToken: response.data.rToken,
        },
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error?.config;

    if (!error?.response) return Promise.reject(error);

    if (isAuthEndpoint(originalRequest)) {
      return Promise.reject(error);
    }

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

    if (isAuthErrorResponse(error)) {
      clearTokens();
      redirectToLogin();
    }

    return Promise.reject(error);
  },
);

export default http;
