// components/chat/Chat.jsx
import React, { useEffect, useRef, useCallback, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import axios from "axios";
import LinkPreviewCard from "./LinkPreviewCard";
import {
  toggleMobileChatSidebar,
  infoToggle,
  fetchMessages,
  setActiveConv,
} from "@/store/redux/chatSlice";
import { useChatSocket } from "@/hooks/useChatSocket";
import useWidth from "@/hooks/useWidth";
import Icon from "@/components/ui/Icon";
import Dropdown from "@/components/ui/Dropdown";
import { DonHangGetById } from "@/store/api/don-hang";
import { blobToBase64 } from "@/utils/audioUtils";

import {
  DonHangChangeStatusOrder,
  DonHangDoneOrder,
  DonHangCancelOrder,
  DonHangDeleteDraft,
  DonHangDeleteOrder,
  DonHangExportPdf,
  DonHangExportPdfSmall,
} from "@/store/api/don-hang";
import { notifyApiByErrorCode } from "@/utils/api-toast";
import { getTodayStr } from "@/helpers/dateHelper";
import convert from "@/helpers/convert";
import ThaoTac from "./ThaoTac";
import ModalNhapNote from "@/views/don-hang/chi-tiet-don-hang/ModalNote";
import ModalXemPdf from "@/views/component/ModalXemPdf";
import usePermission from "@/hooks/usePermission";
import { useNavigate } from "react-router-dom";
// ✅ Voice recording
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import VoiceMicButton from "./VoiceMicButton";
import AudioMessage from "./AudioMessage";
import {
  encodeAudioMessage,
  isAudioMessage,
  decodeAudioMessage,
} from "@/utils/audioMessageUtils";

const chatAction = [
  { label: "Remove", link: "#" },
  { label: "Forward", link: "#" },
];

const ORDER_DETAIL_PATTERN = /\/don-hang\/chi-tiet-don-hang\/([a-f0-9-]{36})/;

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const extractUrl = (text = "") => {
  const regex = /(https?:\/\/[^\s]+)/g;
  const urls = text.match(regex);
  return urls?.[0] || null;
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
  so_dien_thoai = "Khách hàng",
  userAvatar,
  userStatus = "active",
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { width, breakpoints } = useWidth();
  const [preview, setPreview] = useState(null);
  const isSanXuat = usePermission("thaoTacChuyenDoiTrangThaiDonHangSanXuat");

  const previewTimerRef = useRef(null);
  const token = useSelector((state) => state.auth?.token);

  // Order state
  const [orderInfo, setOrderInfo] = useState({
    orderId: null,
    orderStatusCode: null,
    orderCode: null,
    totalPrice: null,
    customer_current_debt: null,
  });

  const resetOrderInfo = () =>
    setOrderInfo({
      orderId: null,
      orderStatusCode: null,
      orderCode: null,
      totalPrice: null,
      customer_current_debt: null,
    });

  const {
    orderId,
    orderStatusCode,
    orderCode,
    totalPrice,
    customer_current_debt,
  } = orderInfo;

  const [noteModal, setNoteModal] = useState({
    open: false,
    title: "",
    message: "",
    onConfirm: null,
  });

  const [pdfModal, setPdfModal] = useState({
    open: false,
    url: null,
    fileName: "",
  });

  const openNoteModal = ({ title, message = "", onConfirm }) => {
    setNoteModal({ open: true, title, message, onConfirm });
  };

  const closeNoteModal = () => {
    setNoteModal({ open: false, title: "", message: "", onConfirm: null });
  };

  const openPdfModal = (blob, fileName) => {
    setPdfModal((prev) => {
      if (prev.url) URL.revokeObjectURL(prev.url);
      return { open: true, url: URL.createObjectURL(blob), fileName };
    });
  };

  const closePdfModal = () => {
    setPdfModal((prev) => {
      if (prev.url) URL.revokeObjectURL(prev.url);
      return { open: false, url: null, fileName: "" };
    });
  };

  const handleSubmitDonHangChangeStatusOrder = async ({
    statusCode,
    note = "",
  } = {}) => {
    if (!orderId)
      return notifyApiByErrorCode({
        errorCode: -1,
        message: "Thiếu id đơn hàng",
      });
    if (!statusCode)
      return notifyApiByErrorCode({
        errorCode: -1,
        message: "Thiếu trạng thái",
      });
    try {
      const res = await DonHangChangeStatusOrder({
        id: String(orderId),
        status_code: statusCode,
        note,
      });
      notifyApiByErrorCode(res, {
        successMessage: "Đổi trạng thái thành công",
        errorMessage: "Đổi trạng thái thất bại",
      });
    } catch (err) {
      console.error("DonHangChangeStatusOrder error:", err);
    }
  };

  const handleSubmitDonHangDoneOrder = async ({ note = "" }) => {
    if (!orderId)
      return notifyApiByErrorCode({
        errorCode: -1,
        message: "Thiếu id đơn hàng",
      });
    try {
      const res = await DonHangDoneOrder({
        id: String(orderId),
        note: note || "Hoàn thành đơn hàng",
      });
      notifyApiByErrorCode(res, {
        successMessage: "Hoàn thành đơn hàng",
        errorMessage: "Hoàn thành thất bại",
      });
    } catch (err) {
      console.error("DonHangDoneOrder error:", err);
    }
  };

  const handleSubmitDonHangDeleteOrder = async ({ note = "" }) => {
    if (!orderId)
      return notifyApiByErrorCode({
        errorCode: -1,
        message: "Thiếu id đơn hàng",
      });
    try {
      const res = await DonHangDeleteOrder({
        id: String(orderId),
        note: note || "Xóa đơn hàng",
      });
      notifyApiByErrorCode(res, {
        successMessage: "Xóa đơn hàng thành công",
        errorMessage: "Xoa don hang that bai",
      });
      if (res?.errorCode > 0) navigate("/don-hang/danh-sach");
    } catch (err) {
      console.error("DonHangDeleteOrder error:", err);
    }
  };

  const handleSubmitDonHangDeleteDraft = async () => {
    if (!orderId)
      return notifyApiByErrorCode({
        errorCode: -1,
        message: "Thiếu id đơn hàng",
      });
    try {
      const res = await DonHangDeleteDraft({ id: String(orderId) });
      notifyApiByErrorCode(res, {
        successMessage: "Xóa bản nháp thành công",
        errorMessage: "Xóa bản nháp thất bại",
      });
      if (res?.errorCode > 0) navigate("/don-hang/danh-sach");
    } catch (err) {
      console.error("DonHangDeleteDraft error:", err);
    }
  };

  const handleSubmitDonHangExportPdf = async () => {
    if (!orderId)
      return notifyApiByErrorCode({
        errorCode: -1,
        message: "Thiếu id đơn hàng",
      });
    try {
      const res = await DonHangExportPdf({ id: String(orderId) });
      if (res.errorCode < 1 || !res.data) {
        return notifyApiByErrorCode(res, {
          successMessage: "Xuất PDF thành công",
          errorMessage: "Xuất PDF thất bại",
        });
      }
      openPdfModal(res.data, `HDKH_${orderCode}_${getTodayStr()}.pdf`);
    } catch (err) {
      console.error("DonHangExportPdf error:", err);
      notifyApiByErrorCode({ errorCode: -1, message: "Xuất PDF thất bại" });
    }
  };

  const handleSubmitDonHangExportPdfSmall = async () => {
    if (!orderId)
      return notifyApiByErrorCode({
        errorCode: -1,
        message: "Thiếu id đơn hàng",
      });
    try {
      const res = await DonHangExportPdfSmall({ id: String(orderId) });
      if (res.errorCode < 1 || !res.data) {
        return notifyApiByErrorCode(res, {
          successMessage: "Xuất PDF thành công",
          errorMessage: "Xuất PDF thất bại",
        });
      }
      openPdfModal(res.data, `HDSX_${orderCode}_${getTodayStr()}.pdf`);
    } catch (err) {
      console.error("DonHangExportPdfSmall error:", err);
      notifyApiByErrorCode({ errorCode: -1, message: "Xuất PDF thất bại" });
    }
  };

  const getDebtWarningNote = () => {
    const newDebt =
      Number(customer_current_debt || 0) + (0 - Number(totalPrice || 0));
    if (newDebt < 0) {
      return (
        "⚠️ CẢNH BÁO CÔNG NỢ\n\n" +
        "Đơn hàng này có thể làm công nợ khách vượt mức.\n\n" +
        "• Công nợ hiện tại: " +
        convert.formatMoneyPhay(customer_current_debt) +
        "\n" +
        "• Giá trị đơn hàng trước khi hủy: " +
        convert.formatMoneyPhay(totalPrice) +
        "\n" +
        "• Giá trị đơn hàng sau khi hủy: 0đ\n" +
        "• Công nợ sau khi hủy: " +
        convert.formatMoneyPhay(newDebt) +
        "\n\n" +
        "Vui lòng kiểm tra trước khi xác nhận cập nhật đơn hàng."
      );
    }
    return "Bạn có chắc muốn hủy đơn hàng này?";
  };

  const handleCancelOrderWithDebtWarning = () => {
    openNoteModal({
      title: "Hủy đơn hàng",
      message: getDebtWarningNote(),
      onConfirm: () => handleSubmitDonHangCancelOrder(),
    });
  };

  const handleSubmitDonHangCancelOrder = async () => {
    if (!orderId)
      return notifyApiByErrorCode({
        errorCode: -1,
        message: "Thiếu id đơn hàng",
      });
    try {
      const res = await DonHangCancelOrder({ id: String(orderId) });
      notifyApiByErrorCode(res, {
        successMessage: "Hủy đơn hàng thành công",
        errorMessage: "Huy don hang that bai",
      });
    } catch (err) {
      console.error("DonHangCancelOrder error:", err);
    }
  };

  const shouldHideThaoTac =
    (isSanXuat && orderStatusCode === "DRAFT") ||
    (isSanXuat && orderStatusCode === "AWAIT") ||
    (isSanXuat && orderStatusCode === "REJECTED");

  // fetchLinkPreview
  const fetchLinkPreview = useCallback(
    async (content) => {
      const url = extractUrl(content);

      if (!url) {
        setPreview(null);
        resetOrderInfo();
        return;
      }

      const orderMatch = url.match(ORDER_DETAIL_PATTERN);
      if (orderMatch) {
        const id = orderMatch[1];
        try {
          const res = await DonHangGetById({ id });
          const order = res.data;
          if (!order) {
            setPreview(null);
            resetOrderInfo();
            return;
          }

          setPreview({
            url,
            title: `Đơn hàng ${order.code}`,
            description:
              "Khách hàng: " +
              order.customer_fullname +
              " - Trang thai: " +
              order.orderstatus_name,
            image: order.thumbnail || "",
            siteName: order.customer_studioname || "Đơn hàng",
            favicon: "/favicon.ico",
            orderStatusCode: order.orderstatus_code,
          });

          setOrderInfo({
            orderId: id,
            orderStatusCode: order.orderstatus_code,
            orderCode: order.code,
            totalPrice: order.total_price,
            customer_current_debt: order.customer_current_debt,
          });
        } catch (error) {
          console.log("Order preview error:", error);
          setPreview(null);
          resetOrderInfo();
        }
        return;
      }

      resetOrderInfo();
      try {
        const res = await axios.post(
          "http://localhost:3000/chat/link-preview",
          { url },
        );
        if (res.data?.success) setPreview(res.data.data);
        else setPreview(null);
      } catch (error) {
        console.log("Preview Error:", error);
        setPreview(null);
      }
    },
    [token],
  );

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

  // Reset when conversation changes
  useEffect(() => {
    setPreview(null);
    resetOrderInfo();
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

  const handleTyping = useCallback(
    (e) => {
      if (!convId) return;
      if (!isTypingSentRef.current) {
        sendTyping(convId, true);
        isTypingSentRef.current = true;
      }
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(stopTyping, 2000);
      clearTimeout(previewTimerRef.current);
      const value = e.target.value;
      previewTimerRef.current = setTimeout(() => {
        fetchLinkPreview(value);
      }, 500);
    },
    [convId, sendTyping, stopTyping, fetchLinkPreview],
  );

  const handleSend = useCallback(() => {
    const content = inputRef.current?.value?.trim();
    if (!content || !convId) return;
    sendMessage(content, convId);
    inputRef.current.value = "";
    setPreview(null);
    resetOrderInfo();
    clearTimeout(previewTimerRef.current);
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
                  {/* <span
                    className={`status ring-1 ring-white inline-block h-[10px] w-[10px] rounded-full absolute right-0 top-0
                      ${userStatus === "active" ? "bg-success-500" : "bg-secondary-500"}`}
                  /> */}
                  {userAvatar ? (
                    <img
                      src={userAvatar}
                      alt={so_dien_thoai}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-primary-200 dark:bg-primary-900 flex items-center justify-center font-bold text-primary-600 dark:text-primary-300 text-sm">
                      {(so_dien_thoai || "?")[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-1 text-start">
                <span className="block text-slate-800 dark:text-slate-300 text-sm font-medium mb-[2px] truncate">
                  {so_dien_thoai}
                </span>
                {/* <span className="block text-slate-500 dark:text-slate-300 text-xs font-normal flex items-center gap-1">
                  {connected ? (
                    <>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-success-500" />
                      Online
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-secondary-400" />
                      Offline
                    </>
                  )}
                </span> */}
              </div>
            </div>
          </div>
          {/* <div className="flex-none flex md:space-x-3 space-x-1 items-center rtl:space-x-reverse">
            <div className="msg-action-btn">
              <Icon icon="heroicons-outline:phone" />
            </div>
            <div className="msg-action-btn">
              <Icon icon="heroicons-outline:video-camera" />
            </div>
            <div
              onClick={() => dispatch(infoToggle(!openinfo))}
              className="msg-action-btn">
              <Icon icon="heroicons-outline:dots-horizontal" />
            </div>
          </div> */}
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
                      {(item.sender_name || "?")[0].toUpperCase()}
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
                    {/* <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible">
                      <Dropdown
                        classMenuItems="w-[100px] top-0"
                        items={chatAction}
                        label={
                          <div className="h-8 w-8 bg-slate-100 dark:bg-slate-600 dark:text-slate-300 text-slate-900 flex flex-col justify-center items-center text-xl rounded-full">
                            <Icon icon="heroicons-outline:dots-horizontal" />
                          </div>
                        }
                      />
                    </div> */}
                  </div>
                </div>
              ) : (
                <div className="flex space-x-2 items-start justify-end group w-full rtl:space-x-reverse">
                  <div className="flex space-x-4 rtl:space-x-reverse">
                    {/* <div className="opacity-0 invisible group-hover:opacity-100 group-hover:visible">
                      <Dropdown
                        classMenuItems="w-[100px] left-0 top-0"
                        items={chatAction}
                        label={
                          <div className="h-8 w-8 bg-slate-300 dark:bg-slate-900 dark:text-slate-400 flex flex-col justify-center items-center text-xl rounded-full text-slate-900">
                            <Icon icon="heroicons-outline:dots-horizontal" />
                          </div>
                        }
                      />
                    </div> */}
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
                        Me
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
        {/* LinkPreviewCard */}
        {/* {preview && (
          <div className="mb-3">
            <LinkPreviewCard preview={preview} />
          </div>
        )} */}

        {/* ThaoTac */}
        {orderId && !shouldHideThaoTac && orderStatusCode !== "CANCELED" && (
          <div className="mb-3">
            <ThaoTac
              onSubmitDonHangChangeStatusOrder={
                handleSubmitDonHangChangeStatusOrder
              }
              onSubmitDonHangDoneOrder={handleSubmitDonHangDoneOrder}
              onSubmitDonHangCancelOrder={handleCancelOrderWithDebtWarning}
              onSubmitDonHangDeleteDraft={handleSubmitDonHangDeleteDraft}
              onSubmitDonHangDeleteOrder={handleSubmitDonHangDeleteOrder}
              onSubmitDonHangExportPdf={handleSubmitDonHangExportPdf}
              onSubmitDonHangExportPdfSmall={handleSubmitDonHangExportPdfSmall}
              orderstatus_code={orderStatusCode}
              openNoteModal={openNoteModal}
              orderId={orderId}
            />
          </div>
        )}

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
          {/* <div className="hidden sm:flex gap-2">
            <div className="h-8 w-8 cursor-pointer bg-slate-100 dark:bg-slate-900 dark:text-slate-400 flex items-center justify-center text-xl rounded-full">
              <Icon icon="heroicons-outline:link" />
            </div>
            <div className="h-8 w-8 cursor-pointer bg-slate-100 dark:bg-slate-900 dark:text-slate-400 flex items-center justify-center text-xl rounded-full">
              <Icon icon="heroicons-outline:emoji-happy" />
            </div>
            <VoiceMicButton status={voiceStatus} onClick={toggleRecording} />
          </div> */}

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

      <ModalNhapNote
        open={noteModal.open}
        title={noteModal.title}
        message={noteModal.message}
        onClose={closeNoteModal}
        onConfirm={(note) => noteModal.onConfirm?.(note)}
      />

      <ModalXemPdf
        open={pdfModal.open}
        pdfUrl={pdfModal.url}
        fileName={pdfModal.fileName}
        onClose={closePdfModal}
      />
    </div>
  );
};

export default Chat;
