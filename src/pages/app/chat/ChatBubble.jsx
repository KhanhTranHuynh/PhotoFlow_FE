// pages/app/chat/ChatBubble.jsx
import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getOrCreateConversation } from "@/store/redux/chatSlice";
import { useChatSocket } from "@/hooks/useChatSocket";

const ChatBubble = ({ role = "staff", onClick }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { joinConv } = useChatSocket(); // ⭐ MỚI

  const conversations = useSelector((state) => state.chat.conversations ?? {});
  const convId = useSelector((state) => state.chat.convId);
  const companyId = useSelector((state) => state.auth?.user?.company_currentid);

  // Luôn đồng bộ unread ban đầu từ API cho customer.
  // Không phụ thuộc !convId vì convId có thể được socket set trước,
  // nếu bỏ qua API thì badge unread ban đầu sẽ bị thiếu.
  useEffect(() => {
    if (role === "customer" && companyId) {
      dispatch(getOrCreateConversation({ companyId }));
    }
  }, [role, companyId, dispatch]);

  // ⭐ MỚI: BẮT BUỘC join socket room ngay khi có convId, bất kể đang ở trang nào.
  // Đây là chỗ fix chính — không có dòng này thì customer không bao giờ nhận được
  // tin nhắn mới qua socket nếu họ không mở trang /chat.
  useEffect(() => {
    if (role === "customer" && convId) {
      joinConv(convId);
    }
  }, [role, convId, joinConv]);

  const totalUnread = Object.values(conversations).reduce(
    (acc, conv) => acc + (conv.unread || 0),
    0,
  );

  const [bump, setBump] = useState(false);
  const prevUnread = useRef(totalUnread);

  useEffect(() => {
    if (totalUnread > prevUnread.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 400);
      return () => clearTimeout(t);
    }
    prevUnread.current = totalUnread;
  }, [totalUnread]);

  const handleClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    if (role === "staff") {
      navigate("/chat");
    }
    if (role === "customer") {
      navigate("/chat");
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={`Chat${totalUnread > 0 ? ` — ${totalUnread} tin chưa đọc` : ""}`}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9999,
        width: "52px",
        height: "52px",
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        background: "#2563eb",
        boxShadow: "0 2px 10px rgba(37, 99, 235, 0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: bump ? "scale(1.1)" : "scale(1)",
        transition: "transform 0.2s ease",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
      }}>
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
        <path
          d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {totalUnread > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            minWidth: "18px",
            height: "18px",
            borderRadius: "9px",
            background: "#ef4444",
            color: "#fff",
            fontSize: "10px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 4px",
            border: "2px solid #fff",
            lineHeight: 1,
          }}>
          {totalUnread > 99 ? "99+" : totalUnread}
        </span>
      )}
    </button>
  );
};

export default ChatBubble;
