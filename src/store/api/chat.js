import logger from "@/helpers/logger";
import http from "@/api/http";

export async function ChatConversationsGetPaging(data) {
  try {
    logger.info("[ChatConversationsGetPaging] Request:", data);
    const response = await http.post("/chat/conversations/get-paging", data);
    logger.info("[ChatConversationsGetPaging] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error(
      "[ChatConversationsGetPaging] Error:",
      err?.response?.data || err,
    );
    throw err;
  }
}

export async function ChatConversationsGetOrCreate(data) {
  try {
    logger.info("[ChatConversationsGetOrCreate] Request:", data);
    const response = await http.post("/chat/conversations/get-or-create", data);
    logger.info("[ChatConversationsGetOrCreate] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error(
      "[ChatConversationsGetOrCreate] Error:",
      err?.response?.data || err,
    );
    throw err;
  }
}

export async function ChatMessagesGetPaging(data) {
  try {
    logger.info("[ChatMessagesGetPaging] Request:", data);
    const response = await http.post(
      "/chat/conversations/messages/get-paging",
      data,
    );
    logger.info("[ChatMessagesGetPaging] Response:", response.data);
    return response.data;
  } catch (err) {
    logger.error("[ChatMessagesGetPaging] Error:", err?.response?.data || err);
    throw err;
  }
}
