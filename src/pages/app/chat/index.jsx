// pages/chat/ChatPage.jsx
import React, { useEffect, useCallback } from "react";
import SimpleBar from "simplebar-react";
import useWidth from "@/hooks/useWidth";
import { useSelector, useDispatch } from "react-redux";
import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import MyProfile from "./MyProfile";
import Info from "./Info";
import Blank from "./Blank";
import Chat from "./Chat";
import {
  toggleMobileChatSidebar,
  setContactSearch,
  setActiveConv,
  fetchMessages,
  fetchConversations,
  getOrCreateConversation,
} from "@/store/redux/chatSlice";
import { useChatSocket } from "@/hooks/useChatSocket";

// ─── Utils ────────────────────────────────────────────────────────────────
const getAvatarInitials = (fullName) => {
  return (
    fullName
      ?.trim()
      ?.split(" ")
      ?.filter(Boolean)
      ?.slice(-2)
      ?.map((w) => w.charAt(0).toUpperCase())
      ?.join("") || "?"
  );
};

const pickFirstText = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) {
      const joined = value.filter(Boolean).join(", ");
      if (joined) return joined;
      continue;
    }
    if (value === 0) return "0";
    if (value === null || value === undefined) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
};

const resolveChatRoleLabel = (conv, viewerRole) => {
  if (!conv) return "";

  const fallbackLabel =
    viewerRole === "customer" ? "Nhân viên hỗ trợ" : "Khách hàng";
  const rawRole =
    viewerRole === "customer"
      ? pickFirstText(
          conv.staff_role_name,
          conv.staff_role,
          conv.staff_position,
          conv.assigned_staff_role,
          conv.role_name,
          conv.role,
        )
      : pickFirstText(
          conv.customer_role_name,
          conv.customer_role,
          conv.customer_position,
          conv.sender_role_name,
          conv.sender_role,
          conv.role_name,
          conv.role,
        );

  if (!rawRole) return fallbackLabel;
  return rawRole.toLowerCase().includes("vai trò")
    ? rawRole
    : `Vai trò: ${rawRole}`;
};

const resolveChatDisplayName = (conv, viewerRole) => {
  if (!conv) {
    return viewerRole === "customer" ? "Nhân viên hỗ trợ" : "Khách hàng";
  }

  const latestIncomingSender = Array.isArray(conv.messages)
    ? [...conv.messages]
        .reverse()
        .find((item) =>
          viewerRole === "customer"
            ? Number(item?.sendertype) === 1
            : Number(item?.sendertype) === 2,
        )?.sender_name
    : "";

  const fallbackLabel =
    viewerRole === "customer" ? "Nhân viên hỗ trợ" : "Khách hàng";

  const rawName =
    viewerRole === "customer"
      ? pickFirstText(
          conv.staff_name,
          conv.staff_full_name,
          conv.agent_name,
          conv.assigned_staff_name,
          latestIncomingSender,
        )
      : pickFirstText(
          conv.customer_name,
          conv.customer_full_name,
          conv.customer_display_name,
          latestIncomingSender,
          conv.name,
        );

  return rawName || fallbackLabel;
};

// ─── Conversation Item ────────────────────────────────────────────────────────
const ConvItem = ({ cid, conv, isActive, onClick }) => (
  <div
    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-slate-100 dark:border-slate-700 transition-colors
      ${
        isActive
          ? "bg-primary-50 dark:bg-primary-900/20"
          : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
      }`}
    onClick={() => onClick(cid)}>
    <div className="flex-none w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold text-sm uppercase">
      {getAvatarInitials(conv.name)}
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
        {conv.name || cid}
      </div>
      <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
        {conv.lastMsg || "Chưa có tin nhắn"}
      </div>
    </div>
    {!!conv.unread && (
      <span className="flex-none w-5 h-5 rounded-full bg-danger-500 text-white text-[10px] flex items-center justify-center font-bold">
        {conv.unread > 9 ? "9+" : conv.unread}
      </span>
    )}
  </div>
);

// ─── ChatPage ─────────────────────────────────────────────────────────────────
const ChatPage = ({ convId: customerConvId }) => {
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();
  const isMobile = width < breakpoints.lg;

  // ── Redux ─────────────────────────────────────────────────────────────────
  const companyId = useSelector((state) => state.auth?.user?.company_currentid);
  const isCustomer = useSelector(
    (state) =>
      state.auth?.user?.roles?.some((r) => r.code === "CUSTOMER") ?? false,
  );
  const role = isCustomer ? "customer" : "staff";

  const {
    activeConvId,
    conversations = {},
    convId: storeConvId,
    openinfo,
    mobileChatSidebar,
    connected,
    loading,
    contacts = [],
    searchContact = "",
  } = useSelector((state) => state.chat);

  // ── Socket ────────────────────────────────────────────────────────────────
  const { joinConv } = useChatSocket();

  // ── Fetch / init khi mount ────────────────────────────────────────────────
  useEffect(() => {
    if (!companyId) return;

    if (role === "staff") {
      dispatch(fetchConversations({ companyId }));
    } else {
      dispatch(getOrCreateConversation({ companyId })).then((action) => {
        const cid = action?.payload?.id; // ⭐ payload giờ là object {id, unread, lastMsg}
        if (cid) {
          joinConv(cid);
        }
      });
    }
  }, [role, companyId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Chọn conversation (staff) ─────────────────────────────────────────────
  const handleSelectConv = useCallback(
    (cid) => {
      dispatch(setActiveConv(cid));
      joinConv(cid);
      if (isMobile) {
        dispatch(toggleMobileChatSidebar(false));
      }
      if (!conversations[cid]?.loaded) {
        dispatch(fetchMessages({ convId: cid, page: 1, pagesize: 20 }));
      }
    },
    [dispatch, joinConv, conversations, isMobile],
  );

  // ── Thêm conversation thủ công (staff) ───────────────────────────────────
  const handleAddConv = useCallback(
    (cid, custId) => {
      joinConv(cid, custId);
      if (cid) handleSelectConv(cid);
    },
    [joinConv, handleSelectConv],
  );

  // ── Derived values ────────────────────────────────────────────────────────
  const currentConvId =
    role === "staff" ? activeConvId : customerConvId || storeConvId;
  const currentConv = currentConvId ? conversations[currentConvId] : null;

  // ⭐ FIX: sort theo lastMsgAt (thời gian tin nhắn cuối), KHÔNG sort theo unread.
  // -> Conv có tin nhắn mới sẽ lên đầu ngay lập tức.
  // -> Click vào để đọc chỉ reset unread, không đổi lastMsgAt -> vị trí giữ nguyên, không nhảy xuống.
  const sortedConvEntries = Object.entries(conversations).sort(
    ([, a], [, b]) => {
      const diff = (b.lastMsgAt || 0) - (a.lastMsgAt || 0);
      if (diff !== 0) return diff;
      return (a.name || "").localeCompare(b.name || "");
    },
  );

  const searchContacts = contacts.filter((item) =>
    item.fullName?.toLowerCase().includes((searchContact || "").toLowerCase()),
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex lg:space-x-5 chat-height overflow-hidden relative rtl:space-x-reverse">
      {/* Sidebar */}
      <div
        className={`transition-transform duration-200 flex-none min-w-[260px]
          ${isMobile ? "fixed inset-y-0 left-0 z-[199] w-[min(85vw,320px)]" : "relative"}
          ${isMobile ? (mobileChatSidebar ? "translate-x-0" : "-translate-x-full pointer-events-none") : "translate-x-0"}`}>
        <Card
          bodyClass="relative p-0 h-full overflow-hidden"
          className="h-full bg-white dark:bg-slate-800">
          <div className="border-b border-slate-100 dark:border-slate-700 pb-4">
            <MyProfile />
          </div>

          {role === "staff" ? (
            <>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Cuộc hội thoại</span>
              </div>
              <SimpleBar className="contact-height">
                {loading ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-sm">
                    Đang tải...
                  </div>
                ) : sortedConvEntries.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-sm">
                    Chưa có cuộc hội thoại nào
                  </div>
                ) : (
                  sortedConvEntries.map(([cid, conv]) => (
                    <ConvItem
                      key={cid}
                      cid={cid}
                      conv={conv}
                      isActive={cid === activeConvId}
                      onClick={handleSelectConv}
                    />
                  ))
                )}
              </SimpleBar>
            </>
          ) : (
            <div className="px-4 py-6 flex flex-col items-center gap-3 text-center">
              <div
                className={`w-3 h-3 rounded-full ${connected ? "" : "bg-secondary-400"}`}
              />
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {connected ? "" : "Đang kết nối..."}
              </span>
              {!currentConvId && !loading && (
                <span className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                  Đang khởi tạo cuộc hội thoại...
                </span>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Mobile overlay */}
      {isMobile && mobileChatSidebar && (
        <div
          className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm"
          onClick={() => dispatch(toggleMobileChatSidebar(false))}
        />
      )}

      {/* Main chat area */}
      <div className="flex-1 min-w-0">
        <div className="parent flex space-x-5 h-full min-w-0 rtl:space-x-reverse">
          <div className="flex-1 min-w-0">
            <Card bodyClass="p-0 h-full" className="h-full">
              {currentConvId ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-700 h-full">
                  <Chat
                    convId={currentConvId}
                    userName={
                      role === "customer"
                        ? "Nhân Viên"
                        : resolveChatDisplayName(currentConv, role)
                    }
                    userAvatar={role === "customer" ? null : undefined}
                    userRoleLabel={
                      role === "customer"
                        ? ""
                        : resolveChatRoleLabel(currentConv, role)
                    }
                    userStatus="active"
                  />
                </div>
              ) : (
                <Blank />
              )}
            </Card>
          </div>

          {!isMobile && openinfo && currentConvId && (
            <div className="flex-none w-[285px]">
              <Card bodyClass="p-0 h-full" className="h-full">
                <Info />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
