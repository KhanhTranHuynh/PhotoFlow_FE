// hooks/useChatSocket.js
import { useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { getAccessToken, getRefreshToken } from "@/utils/authTokens";
import config from "@/helpers/config";
import {
  setConnected,
  receiveMessage,
  receiveNewMessageNotify,
  setTyping,
  upsertConversation,
  setConvId,
} from "@/store/redux/chatSlice";

// ─── Singleton ────────────────────────────────────────────────────────────────
const _singleton = {
  socket: null,
  companyId: null,
  role: null,
  userId: null,
  dispatch: null,
  pendingJoinPayload: null,
};

function destroySocket() {
  if (!_singleton.socket) return;
  try {
    _singleton.socket.removeAllListeners();
    _singleton.socket.disconnect();
  } catch (err) {
    console.error("[chat-socket] destroy error:", err?.message || err);
  }

  _singleton.socket = null;
  _singleton.companyId = null;
  _singleton.role = null;
  _singleton.userId = null;
  _singleton.pendingJoinPayload = null;
}

function initSocket({ companyId, role, userId, dispatch }) {
  if (_singleton.socket) return;

  _singleton.companyId = companyId;
  _singleton.role = role;
  _singleton.userId = userId;
  _singleton.dispatch = dispatch;

  const socket = io(config.SOCKET_URL, {
    auth: {
      accessToken: getAccessToken(),
      refreshToken: getRefreshToken(),
    },
    path: "/socket.io",
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  _singleton.socket = socket;

  socket.on("connect", () => {
    console.log("[chat-socket] connected:", socket.id);
    _singleton.dispatch?.(setConnected(true));
    if (_singleton.role === "staff") {
      socket.emit("chat:join_company", { company_id: _singleton.companyId });
    }
    if (_singleton.pendingJoinPayload) {
      socket.emit("chat:join", _singleton.pendingJoinPayload);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("[chat-socket] disconnected:", reason);
    _singleton.dispatch?.(setConnected(false));
  });

  socket.on("connect_error", (err) => {
    console.error("[chat-socket] connect_error:", err?.message);
    _singleton.dispatch?.(setConnected(false));
  });

  socket.on("chat:access_token_refreshed", (data) => {
    if (data?.accessToken) socket.auth.accessToken = data.accessToken;
  });

  socket.on("chat:message", (data) => {
    // Staff: chỉ dùng event này để hiển thị message trong conv đang mở
    // KHÔNG tăng unread ở đây — để chat:new_message lo
    if (_singleton.role === "staff") {
      _singleton.dispatch?.(receiveMessage(data));
    } else {
      // Customer: đây là event duy nhất nhận được
      _singleton.dispatch?.(receiveMessage(data));
    }
  });

  socket.on("chat:new_message", (data) => {
    if (_singleton.role === "staff") {
      // Chỉ staff mới nhận event này từ server
      _singleton.dispatch?.(receiveNewMessageNotify(data));
    }
    // Customer không nhận event này → không xử lý
  });

  socket.on("chat:typing", ({ chatconversation_id, sender_name, isTyping }) => {
    if (chatconversation_id) {
      _singleton.dispatch?.(
        setTyping({
          convId: chatconversation_id,
          senderName: sender_name,
          isTyping,
        }),
      );
    }
  });

  socket.on("chat:conversation_created", (data) => {
    _singleton.dispatch?.(upsertConversation(data));
    if (_singleton.role === "customer" && data?.chatconversation_id) {
      _singleton.dispatch?.(setConvId(data.chatconversation_id));
      socket.emit("chat:join", {
        chatconversation_id: data.chatconversation_id,
        company_id: _singleton.companyId,
      });
    }
  });

  socket.on("chat:error", (data) => {
    console.error("[chat-socket] chat:error", data?.message);
  });

  socket.on("chat:read", () => {});
}

export function useChatSocket() {
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => !!state.auth?.user);
  const userId = useSelector(
    (state) =>
      state.auth?.user?.id ||
      state.auth?.user?.user_id ||
      state.auth?.user?.userid ||
      null,
  );
  const companyId = useSelector((state) => state.auth?.user?.company_currentid);
  const isCustomer = useSelector(
    (state) =>
      state.auth?.user?.roles?.some((r) => r.code === "CUSTOMER") ?? false,
  );
  const role = isCustomer ? "customer" : "staff";

  // Luôn giữ dispatch mới nhất cho event handlers
  _singleton.dispatch = dispatch;

  useEffect(() => {
    if (!isLoggedIn || !companyId) {
      destroySocket();
      dispatch(setConnected(false));
      return;
    }

    const contextChanged =
      !!_singleton.socket &&
      (_singleton.companyId !== companyId ||
        _singleton.role !== role ||
        _singleton.userId !== userId);

    if (contextChanged) {
      destroySocket();
      dispatch(setConnected(false));
    }

    initSocket({ companyId, role, userId, dispatch });
  }, [isLoggedIn, companyId, role, userId, dispatch]);

  // ── Emit helpers ──────────────────────────────────────────────────────────

  const sendMessage = useCallback((content, chatconversation_id) => {
    if (!_singleton.socket?.connected) {
      console.warn("[chat-socket] sendMessage: socket not connected");
      return;
    }
    _singleton.socket.emit("chat:send", {
      chatconversation_id,
      company_id: _singleton.companyId,
      content,
    });
  }, []);

  const sendTyping = useCallback((chatconversation_id, isTyping) => {
    _singleton.socket?.emit("chat:typing", { chatconversation_id, isTyping });
  }, []);

  const joinConv = useCallback((chatconversation_id, customerId) => {
    const payload = { company_id: _singleton.companyId };
    if (chatconversation_id) payload.chatconversation_id = chatconversation_id;
    if (customerId) payload.customer_id = customerId;
    _singleton.pendingJoinPayload = payload;
    if (!_singleton.socket?.connected) {
      console.warn(
        "[chat-socket] joinConv: socket not connected, will retry on connect",
      );
      return;
    }
    _singleton.socket.emit("chat:join", payload);
  }, []);

  const markRead = useCallback((chatconversation_id) => {
    _singleton.socket?.emit("chat:read", { chatconversation_id });
  }, []);

  return { sendMessage, sendTyping, joinConv, markRead };
}
