// src/hooks/useDocumentTitleNotification.js
import { useEffect, useRef } from "react";

export function useDocumentTitleNotification({ unreadCount, appTitle }) {
  const intervalRef = useRef(null);
  const blinkStateRef = useRef(false); // true = đang hiện "(n) Tin nhắn mới"

  const clearBlink = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    blinkStateRef.current = false;
    document.title = appTitle;
  };

  const startBlink = (count) => {
    if (intervalRef.current) return;

    const blinkTitle = `HT - (${count}) Thông báo chưa đọc`;

    intervalRef.current = setInterval(() => {
      blinkStateRef.current = !blinkStateRef.current;
      document.title = blinkStateRef.current ? blinkTitle : appTitle;
    }, 1000);
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (unreadCount > 0) startBlink(unreadCount);
      } else {
        clearBlink();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    if (unreadCount > 0 && document.hidden) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startBlink(unreadCount);
    } else if (unreadCount === 0 || !document.hidden) {
      clearBlink();
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      clearBlink();
    };
  }, [unreadCount, appTitle]);
}
