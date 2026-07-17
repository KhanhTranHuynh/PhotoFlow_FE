import logger from "@/helpers/logger";
import http from "@/api/http";

export async function getPersonalPaging(data) {
  try {
    logger.info("[getPersonalPaging] Request:", data);
    const response = await http.post("/notification/get-personal-paging", data);
    logger.info("[getPersonalPaging] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[getPersonalPaging] Error:", err?.response?.data || err);
    throw err;
  }
}

export async function getPersonalDetail(data) {
  try {
    logger.info("[getPersonalDetail] Request:", data);
    const response = await http.post("/notification/get-personal-detail", data);
    logger.info("[getPersonalDetail] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[getPersonalDetail] Error:", err?.response?.data || err);
    throw err;
  }
}
