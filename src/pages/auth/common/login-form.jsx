// src/pages/Login/LoginForm.jsx

import React, { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchProfile,
  loginWithApi,
  handleLogin,
} from "../../../store/redux/auth";
import { setToken_rToken } from "@/helpers/setToken_rToken";
import { getAuthRedirectPath } from "@/utils/getAuthRedirectPath";
import { getUserRoleCodes } from "@/utils/getUserRoleCodes";

const schema = yup
  .object({
    so_dien_thoai: yup.string().required("Số điện thoại không được để trống"),
    mat_khau: yup.string().required("mat_khau không được để trống"),
  })
  .required();

const EyeIcon = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
    />
  </svg>
);

const EyeOffIcon = ({ className = "w-5 h-5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M3 3l18 18"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M10.94 10.94A3 3 0 0113.06 13.06"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c1.08 0 2.11.16 3.06.46"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      d="M20.542 12c-1.274 4.057-5.065 7-9.542 7-1.77 0-3.444-.4-4.94-1.12"
    />
  </svg>
);

const LoginForm = () => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [alert, setAlert] = useState({ visible: false, message: "" });
  const [showmat_khau, setShowmat_khau] = useState(false);
  const [ssoProcessing, setSsoProcessing] = useState(false);

  const formRef = useRef(null);
  const composing = useRef(false);
  const mat_khauRef = useRef(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    mode: "all",
    defaultValues: { so_dien_thoai: "", mat_khau: "" },
  });

  // ── SSO query string fallback ──────────────────────────────────────────────
  // Dùng khi Trang A redirect thẳng thay vì dùng popup + postMessage.
  // Chỉ nên dùng trong môi trường nội bộ / dev.
  // Production nên dùng route /sso-callback + postMessage.
  useEffect(() => {
    const ssoParam = searchParams.get("sso");
    if (!ssoParam) return;

    // Xóa token khỏi URL ngay lập tức — không để lại trong browser history
    window.history.replaceState({}, "", window.location.pathname);

    let parsed;
    try {
      parsed = JSON.parse(decodeURIComponent(ssoParam));
    } catch {
      setAlert({ visible: true, message: "Dữ liệu SSO không hợp lệ." });
      return;
    }

    const { accessToken, refreshToken } = parsed ?? {};
    if (!accessToken || !refreshToken) {
      setAlert({ visible: true, message: "Token SSO không đầy đủ." });
      return;
    }

    (async () => {
      setSsoProcessing(true);

      // Lưu token vào cookie — dùng đúng helper của dự án
      setToken_rToken({ data: { accessToken, refreshToken } });

      // Cập nhật isAuth trong Redux
      dispatch(handleLogin(true));

      // Lấy profile để có roles → redirect đúng trang
      const profileAction = await dispatch(fetchProfile());
      if (fetchProfile.fulfilled.match(profileAction)) {
        const user = profileAction.payload;
        const roleCodes = getUserRoleCodes(user); // ✅ gộp role
        navigate(getAuthRedirectPath(roleCodes), { replace: true });
      } else {
        setSsoProcessing(false);
        setAlert({
          visible: true,
          message: "Xác thực SSO thất bại. Vui lòng đăng nhập lại.",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ──────────────────────────────────────────────────────────────────────────

  const onSubmit = async (data) => {
    const action = await dispatch(
      loginWithApi({
        so_dien_thoai: data.so_dien_thoai,
        mat_khau: data.mat_khau,
      }),
    );

    if (loginWithApi.rejected.match(action)) {
      setAlert({
        visible: true,
        message: action.payload?.message || "Đăng nhập thất bại",
      });
      return;
    }

    if (loginWithApi.fulfilled.match(action)) {
      setAlert({ visible: false, message: "" });
      const profileAction = await dispatch(fetchProfile());
      if (fetchProfile.fulfilled.match(profileAction)) {
        const user = profileAction.payload;
        const roleCodes = getUserRoleCodes(user); // ✅ gộp role
        navigate(getAuthRedirectPath(roleCodes), { replace: true });
      }
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !composing.current) {
      e.preventDefault();
      if (formRef.current?.requestSubmit) {
        formRef.current.requestSubmit();
      } else {
        handleSubmit(onSubmit)();
      }
    }
  };

  const setCaretToEnd = (el) => {
    try {
      if (!el) return;
      const len = el.value?.length ?? 0;
      el.setSelectionRange(len, len);
    } catch {
      /* ignore */
    }
  };

  const toggleShowmat_khau = () => {
    setShowmat_khau((prev) => {
      setTimeout(() => {
        if (mat_khauRef.current) {
          mat_khauRef.current.focus();
          setCaretToEnd(mat_khauRef.current);
        }
      }, 0);
      return !prev;
    });
  };

  // SSO đang xử lý → hiển thị spinner thay vì form
  if (ssoProcessing) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 p-8 pt-4">
        <svg
          className="animate-spin h-8 w-8 text-primary"
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
        <p className="text-slate-600 text-sm">Đang xác thực…</p>
      </div>
    );
  }

  return (
    <>
      {alert.visible && (
        <div className="text-center text-black-800 border-t border-b border-red-500 bg-red-50 w-full py-1">
          {alert.message}
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4 p-8 pt-4"
        noValidate>
        <div>
          <Controller
            name="so_dien_thoai"
            control={control}
            render={({ field }) => (
              <div>
                <input
                  {...field}
                  type="text"
                  placeholder="Số điện thoại"
                  className={`w-full h-[48px] px-3 rounded border ${
                    errors.so_dien_thoai ? "border-red-500" : "border-slate-200"
                  }`}
                  onFocus={() => setAlert({ visible: false, message: "" })}
                  onKeyDown={onKeyDown}
                  onCompositionStart={() => (composing.current = true)}
                  onCompositionEnd={() => (composing.current = false)}
                  autoComplete="so_dien_thoai"
                />
                <p
                  className={`mt-1 text-sm text-red-600 ${errors.so_dien_thoai ? "" : "invisible"}`}>
                  {errors.so_dien_thoai?.message || "\u00A0"}
                </p>
              </div>
            )}
          />
        </div>

        <div>
          <Controller
            name="mat_khau"
            control={control}
            render={({ field }) => (
              <div className="relative">
                <input
                  {...field}
                  ref={(el) => {
                    field.ref(el);
                    mat_khauRef.current = el;
                  }}
                  type={showmat_khau ? "text" : "mat_khau"}
                  placeholder="mat_khau"
                  className={`mat_khau-toggle-input w-full h-[48px] pr-10 pl-3 rounded border ${
                    errors.mat_khau ? "border-red-500" : "border-slate-200"
                  }`}
                  onFocus={() => setAlert({ visible: false, message: "" })}
                  onKeyDown={onKeyDown}
                  onCompositionStart={() => (composing.current = true)}
                  onCompositionEnd={() => (composing.current = false)}
                  autoComplete="current-mat_khau"
                />
                <button
                  type="button"
                  onClick={toggleShowmat_khau}
                  className="absolute right-2 top-1/3 -translate-y-1/2 inline-flex items-center justify-center p-1 leading-none text-slate-600 hover:text-slate-900"
                  aria-label={showmat_khau ? "Hide mat_khau" : "Show mat_khau"}>
                  {showmat_khau ? <EyeOffIcon /> : <EyeIcon />}
                </button>
                <p
                  className={`mt-1 text-sm text-red-600 ${errors.mat_khau ? "" : "invisible"}`}>
                  {errors.mat_khau?.message || "\u00A0"}
                </p>
              </div>
            )}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary block w-full text-center"
          disabled={loading}>
          Đăng nhập
        </button>
      </form>
    </>
  );
};

export default LoginForm;
