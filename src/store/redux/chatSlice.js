// store/redux/chatSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  ChatConversationsGetPaging,
  ChatConversationsGetOrCreate,
  ChatMessagesGetPaging,
} from "@/store/api/chat";

const toSafeNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const normalized =
    typeof value === "string" ? value.replace(/,/g, "").trim() : value;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
};

const pickCustomerUnread = (data = {}) => {
  const candidates = [
    data.unreadcount_customer,
    data.unread_count_customer,
    data.unreadCountCustomer,
    data.unreadcountCustomer,
    data.unread_count,
    data.unreadcount,
    data.unread,
    data.unread_customer,
    data.unReadCount,
    data.unreadCount,
    data.total_unread,
    data.totalUnread,
    data.unreadcount_staff,
    data.unread_count_staff,
  ];

  for (const val of candidates) {
    if (val !== undefined && val !== null && val !== "") {
      return toSafeNumber(val, 0);
    }
  }

  return 0;
};

const pickConversationData = (res = {}) => {
  const candidates = [
    res?.data,
    res?.data?.data,
    res?.data?.conversation,
    res?.data?.item,
    res?.conversation,
    res?.item,
    res,
  ];

  for (const item of candidates) {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      const maybeId =
        item.id ||
        item.chatconversation_id ||
        item.chatConversationId ||
        item.conversation_id ||
        item.conversationId;

      if (maybeId) return item;
    }
  }

  return {};
};

// ─── Async Thunks ──────────────────────────────────────────────────────────────

/** Lấy danh sách cuộc hội thoại (staff) */
export const fetchConversations = createAsyncThunk(
  "chat/fetchConversations",
  async ({ companyId, page = 1, pagesize = 100 }, { rejectWithValue }) => {
    try {
      const res = await ChatConversationsGetPaging({
        company_id: companyId,
        page,
        pagesize,
      });
      const rows = res?.data?.rows ?? res?.rows ?? [];
      return rows;
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  },
);

/** Tạo hoặc lấy conversation hiện tại (customer) */
export const getOrCreateConversation = createAsyncThunk(
  "chat/getOrCreateConversation",
  async ({ companyId }, { rejectWithValue }) => {
    try {
      const res = await ChatConversationsGetOrCreate({
        company_id: companyId,
      });
      const data = pickConversationData(res);
      const convId =
        data.id ||
        data.chatconversation_id ||
        data.chatConversationId ||
        data.conversation_id ||
        data.conversationId ||
        null;
      let unread = pickCustomerUnread(data);

      // Fallback: một số backend không trả unread ở get-or-create nhưng có ở get-paging.
      if (convId && unread <= 0) {
        try {
          const pagingRes = await ChatConversationsGetPaging({
            company_id: companyId,
            page: 1,
            pagesize: 100,
          });
          const rows = pagingRes?.data?.rows ?? pagingRes?.rows ?? [];
          const found = rows.find((row) => {
            const rowId =
              row?.id ||
              row?.chatconversation_id ||
              row?.chatConversationId ||
              row?.conversation_id ||
              row?.conversationId;
            return String(rowId) === String(convId);
          });
          if (found) {
            unread = pickCustomerUnread(found);
          }
        } catch (fallbackErr) {
          // silent fallback failure, keep unread hiện có
          console.warn(
            "[chat/getOrCreateConversation] fallback unread sync failed",
            fallbackErr?.message,
          );
        }
      }

      return {
        ...data,
        id: convId,
        unread,
        lastMsg: data.lastmessage || data.last_message || data.lastMsg || "",
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  },
);

/** Load lịch sử tin nhắn theo phân trang */
export const fetchMessages = createAsyncThunk(
  "chat/fetchMessages",
  async ({ convId, page = 1, pagesize = 20 }, { rejectWithValue }) => {
    try {
      const res = await ChatMessagesGetPaging({
        id: convId,
        page,
        pagesize,
      });
      const rows = res?.data?.rows || res?.rows || [];
      const total = res?.data?.total || res?.total || 0;
      return {
        convId,
        messages: rows.slice().reverse(), // đảo ngược: cũ → mới
        total,
        page,
        pagesize,
      };
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  },
);

// ─── Helpers ───────────────────────────────────────────────────────────────────

const makeConvEntry = (override = {}) => ({
  messages: [],
  unread: 0,
  lastMsg: "",
  lastMsgAt: 0, // dùng để sort ổn định (tin mới nhất lên đầu)
  name: "...",
  phone: "",
  loaded: false,
  currentPage: 0,
  hasMore: false,
  isLoadingMore: false,
  ...override,
});

// ─── Slice ─────────────────────────────────────────────────────────────────────

const chatSlice = createSlice({
  name: "chat",
  initialState: {
    connected: false,
    convId: null,
    conversations: {},
    activeConvId: null,
    typingMap: {},
    contacts: [],
    activechat: null,
    openinfo: false,
    mobileChatSidebar: false,
    searchContact: "",
    messFeed: [],
    user: {},
    loading: false,
    error: null,
  },

  reducers: {
    setConnected(state, { payload }) {
      state.connected = payload;
    },

    resetChatState(state) {
      state.connected = false;
      state.convId = null;
      state.conversations = {};
      state.activeConvId = null;
      state.typingMap = {};
      state.contacts = [];
      state.activechat = null;
      state.openinfo = false;
      state.mobileChatSidebar = false;
      state.searchContact = "";
      state.messFeed = [];
      state.user = {};
      state.loading = false;
      state.error = null;
    },

    setConvId(state, { payload }) {
      state.convId = payload;
    },

    // Chỉ reset unread. KHÔNG đụng vào lastMsgAt.
    // -> Click vào conversation không làm nó nhảy vị trí trong danh sách.
    setActiveConv(state, { payload: convId }) {
      state.activeConvId = convId;
      if (state.conversations[convId]) {
        state.conversations[convId].unread = 0;
      }
    },

    upsertConversation(state, { payload }) {
      const { chatconversation_id: cid, customer_name, customer_id } = payload;
      if (!cid) return;
      if (!state.conversations[cid]) {
        state.conversations[cid] = makeConvEntry({
          ...payload,
          name: customer_name || `KH ${(customer_id || cid).slice(0, 8)}`,
          lastMsgAt: Date.now(),
        });
      } else if (customer_name) {
        state.conversations[cid].name = customer_name;
      }
    },

    receiveMessage(state, { payload: data }) {
      const cid = data.chatconversation_id;
      if (!cid) return;
      const isStaffMessage = Number(data.sendertype) === 1;

      if (!state.conversations[cid]) {
        state.conversations[cid] = makeConvEntry({
          ...data,
          name:
            data.customer_name || data.sender_name || `KH ${cid.slice(0, 8)}`,
        });
      }

      const conv = state.conversations[cid];
      if (data.customer_name) conv.name = data.customer_name;
      else if (data.sendertype === 2 && data.sender_name)
        conv.name = data.sender_name;

      const alreadyExists = conv.messages.some((m) => m.id && m.id === data.id);
      if (!alreadyExists) {
        conv.messages = [...conv.messages, data];
      }
      conv.lastMsg = data.content;
      conv.lastMsgAt = Date.now();

      // Chỉ tính là "đang xem" khi conversation đang active trên màn chat.
      // Không dùng state.convId vì với customer convId luôn tồn tại, sẽ làm unread
      // không bao giờ tăng khi user đang ở trang khác.
      const isViewing = state.activeConvId === cid;

      // Customer: tăng unread ngay khi nhận tin nhắn từ staff.
      // Staff đã có luồng chat:new_message riêng để đếm unread.
      if (isStaffMessage && !isViewing) {
        conv.unread = (conv.unread || 0) + 1;
      }

      if (cid === state.convId) {
        state.messFeed = conv.messages;
      }
    },

    receiveNewMessageNotify(state, { payload: data }) {
      const cid = data.chatconversation_id;
      if (!cid) return;

      if (!state.conversations[cid]) {
        state.conversations[cid] = makeConvEntry({
          name: cid.slice(0, 8) + "...",
          lastMsg: data.content || "Tin nhắn mới",
          unread: 1,
          lastMsgAt: Date.now(),
        });
      } else {
        state.conversations[cid].unread =
          (state.conversations[cid].unread || 0) + 1;
        state.conversations[cid].lastMsg =
          data.content || state.conversations[cid].lastMsg;
        state.conversations[cid].lastMsgAt = Date.now();
      }
    },

    setTyping(state, { payload: { convId, senderName, isTyping } }) {
      state.typingMap[convId] = isTyping ? senderName || "..." : null;
    },

    toggleMobileChatSidebar(state, { payload }) {
      state.mobileChatSidebar = payload;
    },
    infoToggle(state, { payload }) {
      state.openinfo = payload;
    },
    setContactSearch(state, { payload }) {
      state.searchContact = payload;
    },
    setActivechat(state, { payload }) {
      state.activechat = payload;
    },
    sendMessage(state, { payload }) {
      state.messFeed = [...state.messFeed, payload];
    },
    refreshAccessToken() {},
  },

  extraReducers: (builder) => {
    // fetchConversations
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, { payload }) => {
        state.loading = false;
        const list = Array.isArray(payload) ? payload : [];
        const incoming = {};
        list.forEach((item, index) => {
          if (!item?.id) return;
          const existing = state.conversations[item.id];
          const fallbackOrder = list.length - index;

          incoming[item.id] = {
            ...(existing || makeConvEntry()),
            ...item,
            name:
              item.customer_name ||
              item.title ||
              `KH ${(item.customer_id || "").slice(0, 8)}`,
            phone: item.customer_phone || "",
            unread: Number(item.unreadcount_staff || 0),
            lastMsg: item.lastmessage || "",
            lastMsgAt: existing?.lastMsgAt || fallbackOrder,
          };
        });
        state.conversations = incoming;
      })
      .addCase(fetchConversations.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload;
      });

    // getOrCreateConversation
    builder
      .addCase(getOrCreateConversation.fulfilled, (state, { payload }) => {
        if (!payload?.id) return;
        state.convId = payload.id;

        // ⭐ Tạo/cập nhật entry trong conversations{} để ChatBubble
        // (và mọi nơi khác đọc tổng unread) thấy được ngay từ đầu,
        // không cần đợi tin nhắn realtime đầu tiên mới có dữ liệu.
        const existing = state.conversations[payload.id];
        state.conversations[payload.id] = {
          ...(existing || makeConvEntry()),
          ...payload,
          unread: payload.unread,
          lastMsg: payload.lastMsg || existing?.lastMsg || "",
          lastMsgAt: existing?.lastMsgAt || Date.now(),
        };
      })
      .addCase(getOrCreateConversation.rejected, (state, { payload }) => {
        state.error = payload;
      });

    // fetchMessages
    builder
      .addCase(fetchMessages.pending, (state, { meta }) => {
        const cid = meta.arg.convId;
        if (!state.conversations[cid]) {
          state.conversations[cid] = makeConvEntry();
        }
        state.conversations[cid].isLoadingMore = true;
      })
      .addCase(fetchMessages.fulfilled, (state, { payload }) => {
        const { convId: cid, messages, total, page, pagesize } = payload;
        if (!state.conversations[cid]) {
          state.conversations[cid] = makeConvEntry();
        }
        const conv = state.conversations[cid];

        if (page > 1) {
          const existingIds = new Set(conv.messages.map((m) => m.id));
          const newMsgs = messages.filter((m) => !existingIds.has(m.id));
          conv.messages = [...newMsgs, ...conv.messages];
        } else {
          conv.messages = messages;
          if (cid === state.convId) state.messFeed = messages;
        }

        conv.loaded = true;
        conv.currentPage = page;
        conv.hasMore = total > page * pagesize;
        conv.isLoadingMore = false;
      })
      .addCase(fetchMessages.rejected, (state, { meta }) => {
        const cid = meta.arg.convId;
        if (state.conversations[cid])
          state.conversations[cid].isLoadingMore = false;
      });
  },
});

export const {
  setConnected,
  resetChatState,
  setConvId,
  setActiveConv,
  upsertConversation,
  receiveMessage,
  receiveNewMessageNotify,
  setTyping,
  toggleMobileChatSidebar,
  infoToggle,
  setContactSearch,
  setActivechat,
  sendMessage,
  refreshAccessToken,
} = chatSlice.actions;

export default chatSlice.reducer;
