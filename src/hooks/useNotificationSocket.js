import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { getAccessToken, getRefreshToken } from "@/utils/authTokens";
import {
  fetchNotifications,
  patchItem,
  setUnreadCount,
  prependItem,
} from "@/store/redux/notificationSlice";
import { getPersonalPaging } from "@/store/api/notification";
import config from "@/helpers/config";
import { playNotificationSound } from "@/helpers/notificationSound";
import { toast } from "react-toastify";
import logger from "@/helpers/logger";

export function useNotificationSocket() {
  const socketRef = useRef(null);
  const dispatch = useDispatch();
  const isLoggedIn = useSelector((state) => !!state.auth.user);

  useEffect(() => {
    if (!isLoggedIn) return;

    dispatch(fetchNotifications({ page: 1, pagesize: 20 }));

    const socket = io(config.SOCKET_URL, {
      auth: {
        accessToken: getAccessToken(),
        refreshToken: getRefreshToken(),
      },
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      logger.info("[socket] connected:", socket.id);
      logger.info("[socket] SOCKET_URL:", config.SOCKET_URL);
    });

    socket.on("notification:web", (data) => {
      logger.info("[notification:web]", data);
      playNotificationSound();
      toast.info(data.payload?.title || "Bạn có thông báo mới", {
        description: data.payload?.message,
        position: "bottom-right",
      });

      // ✅ Thêm dòng này: prepend item mới vào store ngay lập tức
      if (data.payload) {
        dispatch(prependItem(data.payload));
      }

      dispatch(fetchNotifications({ page: 1, pagesize: 20 }));
    });

    socket.on("notification:web_read", async (data) => {
      logger.info("[notification:web_read]", data);

      const rawNotificationId =
        data?.notification_id ?? data?.payload?.notification_id;

      if (!rawNotificationId) {
        console.warn("[notification:web_read] missing notification_id", data);
        return;
      }

      // 1. Update store
      dispatch(patchItem({ id: rawNotificationId, changes: { is_read: 1 } }));

      // 2. Lấy count mới từ server
      const countRes = await getPersonalPaging({ page: 1, pagesize: 1 });
      if (countRes?.data?.unread_count !== undefined) {
        dispatch(setUnreadCount(countRes.data.unread_count));
      }

      // 3. Notify UI
      window.dispatchEvent(
        new CustomEvent("notification:read", {
          detail: {
            ...(data?.payload ?? {}),
            id: rawNotificationId,
            notification_id: rawNotificationId,
          },
        }),
      );
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect_error:", err?.message);
    });

    socket.on("chat:access_token_refreshed", (data) => {
      if (data?.accessToken) {
        socket.auth.accessToken = data.accessToken;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [dispatch, isLoggedIn]);
}
