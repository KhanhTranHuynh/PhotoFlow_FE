import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getPersonalPaging } from "@/store/api/notification";
import { logoutWithApi } from "@/store/redux/auth";

export const fetchNotifications = createAsyncThunk(
  "notification/fetch",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await getPersonalPaging(payload);
      return res?.data || [];
    } catch (err) {
      return rejectWithValue(err?.response?.data || err.message);
    }
  },
);

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    prependItem: (state, action) => {
      const newItem = action.payload;
      const exists = state.items?.items?.some((i) => i.id === newItem.id);
      if (!exists) {
        state.items = {
          ...state.items,
          items: [newItem, ...(state.items?.items ?? [])],
          unread_count: (state.items?.unread_count ?? 0) + 1,
          total: (state.items?.total ?? 0) + 1,
        };
      }
    },
    patchItem: (state, action) => {
      const { id, changes } = action.payload;
      if (!state.items?.items) return;
      const index = state.items.items.findIndex((i) => i.id === id);
      if (index !== -1) {
        state.items.items[index] = { ...state.items.items[index], ...changes };
      }
    },
    setUnreadCount: (state, action) => {
      if (state.items) {
        state.items.unread_count = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutWithApi.fulfilled, () => initialState);
  },
});

export const { prependItem, patchItem, setUnreadCount } =
  notificationSlice.actions;
export default notificationSlice.reducer;
