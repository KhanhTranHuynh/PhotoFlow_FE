import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { login, logout, getProfile } from "@/store/api/xac-thuc";
import { getCookie, removeCookie } from "@/utils/cookies";
import { setToken_rToken } from "@/helpers/setToken_rToken";
import { resetChatState } from "./chatSlice";

const initialUsers = () => {
  if (typeof window === "undefined") return [];

  const item = window.localStorage.getItem("users");
  if (!item) return [];

  try {
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const initialIsAuth = () => {
  const accessToken = getCookie("accessToken");
  const refreshToken = getCookie("refreshToken");
  return !!accessToken && !!refreshToken;
};

const initialAuthUser = () => {
  return null;
};

export const loginWithApi = createAsyncThunk(
  "auth/loginWithApi",
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const res = await login({ username, password });
      const ok = Number(res?.errorCode) === 1;

      if (!ok) {
        return rejectWithValue({
          message: res?.message || "Đăng nhập thất bại",
          errorCode: res?.errorCode ?? null,
        });
      }

      const payload = res?.data;
      setToken_rToken(res);
      console.log("Login successful, payload:", payload, payload?.user);
      return {
        message: res?.message || "Đăng nhập thành công",
        user: payload?.user || null,
      };
    } catch (err) {
      const apiMsg = err?.response?.data?.message;
      return rejectWithValue({
        message: apiMsg || err?.message || "Đăng nhập thất bại",
        errorCode: null,
      });
    }
  },
);

export const logoutWithApi = createAsyncThunk(
  "auth/logoutWithApi",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const res = await logout();
      const ok = Number(res?.errorCode) === 1;

      if (!ok) {
        return rejectWithValue({
          message: res?.message || "Đăng xuất thất bại",
        });
      }

      // Clear client-side auth state
      dispatch(resetChatState());
      dispatch(handleLogout(false));

      return res;
    } catch (err) {
      const apiMsg = err?.response?.data?.message;
      return rejectWithValue({
        message: apiMsg || err?.message || "Đăng xuất thất bại",
      });
    }
  },
);

export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const res = await getProfile();

      const ok = Number(res?.errorCode) === 1;

      if (!ok) {
        dispatch(resetChatState());
        dispatch(handleLogout(false));

        return rejectWithValue({
          message: res?.message || "Lấy thông tin người dùng thất bại",
        });
      }

      return res?.data;
    } catch (err) {
      dispatch(resetChatState());
      dispatch(handleLogout(false));

      const apiMsg = err?.response?.data?.message;

      return rejectWithValue({
        message: apiMsg || err?.message || "Lấy thông tin người dùng thất bại",
      });
    }
  },
);

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    users: initialUsers(),
    isAuth: initialIsAuth(),
    user: initialAuthUser(),
    loading: false,
    error: null,
    errorCode: null,
    loadingProfile: false,
    authInitialized: false,
  },
  reducers: {
    setAuthInitialized: (state) => {
      state.authInitialized = true;
    },
    updateUser: (state, action) => {
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
    handleRegister: (state, action) => {
      const { name, email } = action.payload;
      const user = state.users.find((user) => user.email === email);
      if (user) {
        toast.error("User already exists", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      } else {
        state.users.push({
          id: uuidv4(),
          name,
          email,
        });
        window.localStorage.setItem("users", JSON.stringify(state.users));
        toast.success("User registered successfully", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      }
    },

    handleLogin: (state, action) => {
      state.isAuth = action.payload;
    },
    handleLogout: (state, action) => {
      state.isAuth = action.payload;
      state.user = null;
      state.error = null;
      state.loading = false;

      window.localStorage.removeItem("isAuth");
      window.localStorage.removeItem("authUser");
      removeCookie("accessToken", { path: "/" });
      removeCookie("refreshToken", { path: "/" });

      // toast.success("Đã đăng xuất", { position: "top-right" });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loadingProfile = true;
      })

      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loadingProfile = false;
        state.authInitialized = true;

        state.isAuth = true;
        state.user = action.payload;
      })

      .addCase(fetchProfile.rejected, (state) => {
        state.loadingProfile = false;
        state.authInitialized = true;

        state.isAuth = false;
        state.user = null;
      })
      .addCase(loginWithApi.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.errorCode = null;
      })
      .addCase(loginWithApi.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuth = true;
        state.user = action.payload?.user || null;
        state.error = null;
        state.errorCode = null;

        toast.success(action.payload?.message || "Đăng nhập thành công", {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      })
      .addCase(loginWithApi.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload && action.payload.message) ||
          action.payload ||
          "Đăng nhập thất bại";
        state.errorCode = (action.payload && action.payload.errorCode) ?? null;

        toast.error(state.error, {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
      });

    builder
      .addCase(logoutWithApi.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutWithApi.fulfilled, (state) => {
        state.loading = false;
        state.isAuth = false;
        state.user = null;
        // toast.success("Đã đăng xuất", { position: "top-right" });
      })
      .addCase(logoutWithApi.rejected, (state, action) => {
        state.loading = false;
        const msg =
          (action.payload && action.payload.message) ||
          action.payload ||
          "Đăng xuất thất bại";
        toast.error(msg, { position: "top-right" });
      });
  },
});
export const {
  handleRegister,
  handleLogin,
  handleLogout,
  setAuthInitialized,
  updateUser,
} = authSlice.actions;
export default authSlice.reducer;
