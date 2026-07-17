import logger from "@/helpers/logger";
import { setCookie, getCookie, removeCookie } from "@/utils/cookies";

export function setToken_rToken(responseData) {
  logger.info("setToken_rToken called with responseData:", responseData);

  const token = responseData?.data?.accessToken;
  const rtoken = responseData?.data?.refreshToken;

  if (token) {
    setCookie("accessToken", token, { path: "/", sameSite: "Lax" });
  }
  if (rtoken) {
    setCookie("refreshToken", rtoken, { path: "/", sameSite: "Lax" });
  }
}

export function getAccessToken() {
  return getCookie("accessToken");
}

export function getRefreshToken() {
  return getCookie("refreshToken");
}

export function clearTokens() {
  removeCookie("accessToken", { path: "/" });
  removeCookie("refreshToken", { path: "/" });
}
