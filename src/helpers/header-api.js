import { getCookie } from "@/utils/cookies";

export function getApiHeaders() {
  return {
    "Content-Type": "application/json",
    refreshToken: getCookie("refreshToken") || "",
    Authorization: `Bearer ${getCookie("accessToken") || ""}`,
    lang: "",
  };
}
