// components/chat/Chat.jsx
import React, { useEffect, useRef, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  toggleMobileChatSidebar,
  infoToggle,
  fetchMessages,
  setActiveConv,
} from "@/store/redux/chatSlice";
import { useChatSocket } from "@/hooks/useChatSocket";
import useWidth from "@/hooks/useWidth";
import Icon from "@/components/ui/Icon";
// ✅ Voice recording
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import VoiceMicButton from "./VoiceMicButton";
import AudioMessage from "./AudioMessage";
import {
  encodeAudioMessage,
  isAudioMessage,
  decodeAudioMessage,
} from "@/utils/audioMessageUtils";
// ⭐ MỚI: dùng chung logic lấy chữ cái đầu avatar với ChatPage.jsx, MyProfile.jsx
import { getAvatarInitials } from "@/utils/getAvatarInitials";

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Typing Indicator
const TypingIndicator = ({ text }) => {
  if (!text) return null;
  return (
    <div className="px-4 md:px-6 pb-1 text-xs text-slate-400 dark:text-slate-500 italic flex items-center gap-1">
      <span className="flex gap-0.5">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="animate-bounce w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-500"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </span>
      {text} đang nhập...
    </div>
  );
};

// Chat
const Chat = ({
  convId,
  userName = "Khách hàng",
  userAvatar,
  userStatus = "active",
  userRoleLabel = "",
}) => {
  const dispatch = useDispatch();
  const { width, breakpoints } = useWidth();

  const { openinfo, conversations, typingMap, connected } = useSelector(
    (state) => state.chat,
  );
  const isCustomer = useSelector(
    (state) =>
      state.auth?.user?.roles?.some((r) => r.code === "CUSTOMER") ?? false,
  );
  const role = isCustomer ? "customer" : "staff";

  const conv = convId ? conversations[convId] : null;
  const messages = conv?.messages ?? [];
  const hasMore = conv?.hasMore ?? false;
  const isLoadingMore = conv?.isLoadingMore ?? false;
  const typingText = typingMap[convId] ?? null;

  const { sendMessage, sendTyping, markRead } = useChatSocket();

  const chatBodyRef = useRef(null);
  const typingTimerRef = useRef(null);
  const isTypingSentRef = useRef(false);
  const inputRef = useRef(null);

  // ✅ Voice recorder hook — ghi âm → blob → base64 DataURL → gửi như message
  const {
    status: voiceStatus,
    errorMsg: voiceError,
    durationMs: voiceDurationMs,
    toggleRecording,
  } = useVoiceRecorder({
    onRecorded: (dataUrl) => {
      if (!dataUrl || !convId) return;
      // Encode thành message content rồi gửi luôn
      const audioContent = encodeAudioMessage(dataUrl);
      sendMessage(audioContent, convId);
    },
    onError: (err) => {
      console.error("Voice error:", err);
    },
  });

  useEffect(() => {
    if (!convId) return;
    if (!conv?.loaded) {
      dispatch(fetchMessages({ convId, page: 1, pagesize: 20 }));
    }
    markRead(convId);
    dispatch(setActiveConv(convId));
  }, [convId]);

  useEffect(() => {
    return () => {
      dispatch(setActiveConv(null));
    };
  }, [dispatch]);

  // Reset when conversation changes
  useEffect(() => {
    if (inputRef.current) inputRef.current.value = "";
  }, [convId]);

  useEffect(() => {
    if (!isLoadingMore && chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages.length, isLoadingMore]);

  const handleScroll = useCallback(() => {
    const el = chatBodyRef.current;
    if (!el || isLoadingMore || !hasMore) return;
    if (el.scrollTop <= 80) {
      const nextPage = (conv?.currentPage ?? 1) + 1;
      const prevHeight = el.scrollHeight;
      dispatch(fetchMessages({ convId, page: nextPage, pagesize: 20 })).then(
        () => {
          requestAnimationFrame(() => {
            if (chatBodyRef.current) {
              chatBodyRef.current.scrollTop =
                chatBodyRef.current.scrollHeight - prevHeight;
            }
          });
        },
      );
    }
  }, [convId, conv?.currentPage, hasMore, isLoadingMore, dispatch]);

  const stopTyping = useCallback(() => {
    clearTimeout(typingTimerRef.current);
    if (isTypingSentRef.current && convId) {
      sendTyping(convId, false);
      isTypingSentRef.current = false;
    }
  }, [convId, sendTyping]);

  const handleTyping = useCallback(() => {
    if (!convId) return;
    if (!isTypingSentRef.current) {
      sendTyping(convId, true);
      isTypingSentRef.current = true;
    }
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(stopTyping, 2000);
  }, [convId, sendTyping, stopTyping]);

  const handleSend = useCallback(() => {
    const content = inputRef.current?.value?.trim();
    if (!content || !convId) return;
    sendMessage(content, convId);
    inputRef.current.value = "";
    stopTyping();
  }, [convId, sendMessage, stopTyping]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  useEffect(() => {
    return () => {
      clearTimeout(typingTimerRef.current);
      if (isTypingSentRef.current && convId) {
        sendTyping(convId, false);
        isTypingSentRef.current = false;
      }
    };
  }, [convId, sendTyping]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-100 dark:border-slate-700">
        <div className="flex py-6 md:px-6 px-3 items-center">
          <div className="flex-1">
            <div className="flex space-x-3 rtl:space-x-reverse items-center">
              {width <= breakpoints.lg && (
                <span
                  onClick={() => dispatch(toggleMobileChatSidebar(true))}
                  className="text-slate-900 dark:text-white cursor-pointer text-xl self-center ltr:mr-3 rtl:ml-3">
                  <Icon icon="heroicons-outline:menu-alt-1" />
                </span>
              )}
              <div className="flex-none">
                <div className="h-10 w-10 rounded-full relative">
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={userName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center font-bold text-primary-600 dark:text-primary-300 text-sm">
                      {/* ⭐ FIX: dùng getAvatarInitials thay vì chỉ lấy 1 ký tự đầu */}
                      {getAvatarInitials(userName)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 text-start">
                <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px] truncate">
                  {userName}
                </span>
                {userRoleLabel && (
                  <span className="block text-xs text-slate-500 dark:text-slate-400 truncate">
                    {userRoleLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto py-6 space-y-4"
        ref={chatBodyRef}
        onScroll={handleScroll}>
        {isLoadingMore && (
          <div className="flex justify-center py-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Đang tải tin nhắn cũ...
            </span>
          </div>
        )}

        {messages.map((item, i) => {
          const isMine =
            role === "staff" ? item.sendertype === 1 : item.sendertype === 2;

          return (
            <div className="block md:px-6 px-4" key={item.id || i}>
              {!isMine ? (
                <div className="flex space-x-2 items-start group rtl:space-x-reverse">
                  <div className="flex-none">
                    <div className="h-8 w-8 rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-300">
                      {getAvatarInitials(
                        role === "customer" ? "Nhân Viên" : item.sender_name,
                      )}
                    </div>
                  </div>
                  <div className="flex-1 flex space-x-4 rtl:space-x-reverse">
                    <div>
                      <div className="mb-1">
                        {isAudioMessage(item.content) ? (
                          <AudioMessage
                            dataUrl={decodeAudioMessage(item.content)}
                            isMine={false}
                          />
                        ) : (
                          <div className="text-contrent p-3 bg-slate-100 dark:bg-slate-600 dark:text-slate-300 text-slate-600 text-sm font-normal rounded-md flex-1 whitespace-pre-wrap break-all">
                            {item.content}
                          </div>
                        )}
                      </div>
                      <span className="font-normal text-xs text-slate-400 dark:text-slate-400">
                        {formatTime(item.createdate)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2 items-start justify-end group w-full rtl:space-x-reverse">
                  <div className="flex space-x-4 rtl:space-x-reverse">
                    <div className="whitespace-pre-wrap break-all">
                      <div className="mb-1">
                        {isAudioMessage(item.content) ? (
                          <AudioMessage
                            dataUrl={decodeAudioMessage(item.content)}
                            isMine={true}
                          />
                        ) : (
                          <div className="text-contrent p-3 bg-slate-300 dark:bg-slate-900 dark:text-slate-300 text-slate-800 text-sm font-normal rounded-md flex-1">
                            {item.content}
                          </div>
                        )}
                      </div>
                      <span className="font-normal text-xs text-slate-400 text-right block">
                        {formatTime(item.createdate)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-none">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt=""
                        className="h-8 w-8 rounded-full block object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {/* ⭐ FIX: trước đây hard-code "Me", giờ dùng chữ cái đầu tên mình nếu có,
                            fallback "Me" nếu chưa xác định được tên người gửi */}
                        {getAvatarInitials(item.sender_name, "Me")}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <TypingIndicator text={typingText} />

      {/* Footer */}
      <footer className="md:px-6 px-4 border-t md:pt-4 pt-3 border-slate-100 dark:border-slate-700">
        {/* ✅ Voice recording status bar */}
        {(voiceStatus === "recording" ||
          voiceStatus === "processing" ||
          voiceStatus === "error") && (
          <div
            className={[
              "mb-2 px-3 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all",
              voiceStatus === "recording"
                ? "bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400"
                : voiceStatus === "processing"
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                  : "bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400",
            ].join(" ")}>
            {voiceStatus === "recording" && (
              <>
                <span className="w-2 h-2 rounded-full bg-danger-500 animate-pulse flex-shrink-0" />
                <span>
                  Đang ghi âm...{" "}
                  <span className="tabular-nums opacity-70">
                    {Math.floor(voiceDurationMs / 1000)}s
                  </span>{" "}
                  — Nhấn micro để dừng
                </span>
              </>
            )}
            {voiceStatus === "processing" && (
              <>
                <svg
                  className="w-3 h-3 animate-spin flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Đang xử lý âm thanh...
              </>
            )}
            {voiceStatus === "error" && (
              <>
                <Icon
                  icon="heroicons-outline:exclamation"
                  className="text-sm flex-shrink-0"
                />
                {voiceError || "Lỗi ghi âm"}
              </>
            )}
          </div>
        )}

        {/* Input box */}
        <div className="flex items-center pb-3 pt-0 bg-white dark:bg-slate-800">
          <div className="flex-1 flex items-center gap-3">
            <textarea
              ref={inputRef}
              placeholder="Nhập tin nhắn..."
              className="
                focus:ring-0
                focus:outline-none
                block
                w-full
                bg-transparent
                dark:text-white
                resize-none
                border
                border-slate-200
                dark:border-slate-700
                rounded-xl
                px-4
                py-3
              "
              rows={1}
              onInput={handleTyping}
              onKeyDown={handleKeyDown}
            />

            <button
              type="button"
              onClick={handleSend}
              className="
                h-10
                w-10
                shrink-0
                bg-slate-900
                text-white
                flex
                items-center
                justify-center
                rounded-full
              ">
              <Icon
                icon="heroicons-outline:paper-airplane"
                className="rotate-[60deg]"
              />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Chat;
