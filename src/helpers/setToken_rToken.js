import logger from "@/helpers/logger";
import { setCookie } from "@/utils/cookies";

export function setToken_rToken(responseData) {
  logger.info("setToken_rToken called with responseData:", responseData);
  const token = responseData?.data?.accessToken;
  const rtoken = responseData?.data?.refreshToken;

  if (token) {
    logger.info("Setting accessToken cookie with value:", token);
    setCookie("accessToken", token, { path: "/", sameSite: "Lax" });
  }
  if (rtoken) {
    logger.info("Setting refreshToken cookie with value:", rtoken);
    setCookie("refreshToken", rtoken, { path: "/", sameSite: "Lax" });
  }
}
