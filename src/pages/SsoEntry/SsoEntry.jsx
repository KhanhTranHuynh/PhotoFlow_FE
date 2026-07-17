// src/pages/SsoEntry/SsoEntry.jsx

import { useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchProfile, handleLogin, handleLogout } from "@/store/redux/auth";
import { setToken_rToken } from "@/helpers/setToken_rToken";
import { getAuthRedirectPath } from "@/utils/getAuthRedirectPath";

export default function SsoEntry() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMsg, setErrorMsg] = useState("");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const at = searchParams.get("at");
    const rt = searchParams.get("rt");

    // Xóa token khỏi URL ngay lập tức
    window.history.replaceState({}, "", window.location.pathname);

    if (!at || !rt) {
      setErrorMsg("Link không hợp lệ hoặc đã hết hạn.");
      return;
    }

    (async () => {
      // Bước 1: Logout trước — xóa sạch cookie + state cũ
      // handleLogout(false) chạy đồng bộ, không cần gọi API
      // → đảm bảo không còn sót token cũ dù trước đó có login hay chưa
      dispatch(handleLogout(false));

      // Bước 2: Lưu token mới vào cookie
      setToken_rToken({ data: { accessToken: at, refreshToken: rt } });

      // Bước 3: Cập nhật isAuth trong Redux
      dispatch(handleLogin(true));

      // Bước 4: Lấy profile → redirect đúng trang theo role
      const profileAction = await dispatch(fetchProfile());

      if (fetchProfile.fulfilled.match(profileAction)) {
        const roles = profileAction.payload?.roles ?? [];
        const roleCodes = Array.isArray(roles) ? roles.map((r) => r.code) : [];
        navigate(getAuthRedirectPath(roleCodes), { replace: true });
      } else {
        setErrorMsg("Không thể xác thực. Vui lòng thử lại.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-4 p-8">
          <div className="text-red-500 text-4xl select-none">✕</div>
          <p className="text-red-600 font-medium">{errorMsg}</p>
          <button
            onClick={() => navigate("/login", { replace: true })}
            className="btn btn-primary mt-4">
            Quay về đăng nhập
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center space-y-3 p-8">
        <svg
          className="animate-spin h-10 w-10 text-primary mx-auto"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
          />
        </svg>
        <p className="text-slate-500 text-sm">Đang xác thực…</p>
      </div>
    </div>
  );
}
