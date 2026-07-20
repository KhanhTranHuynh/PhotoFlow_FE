import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import useDarkMode from "@/hooks/useDarkMode";
// image import
import LogoWhite from "@/assets/images/logo/logo-white.svg";
import Logo from "@/assets/images/logo/logo.svg";
import bgImage1 from "@/assets/images/all-img/login-bg-1.png";
import bgImage2 from "@/assets/images/all-img/login-bg-2.png";
import { dangKyStudio } from "@/store/api/xac-thuc";
import { notifyApiByErrorCode } from "@/utils/api-toast"; // TODO: sửa lại đúng đường dẫn file chứa notifyApiByErrorCode

const AlbumIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="w-5 h-5"
    strokeWidth="1.6">
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path
      d="M21 15l-5-5-4 4-2-2-5 5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UploadIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="w-5 h-5"
    strokeWidth="1.6">
    <path
      d="M12 16V4M12 4l-4 4M12 4l4 4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ShareIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="w-5 h-5"
    strokeWidth="1.6">
    <circle cx="18" cy="5" r="2.5" />
    <circle cx="6" cy="12" r="2.5" />
    <circle cx="18" cy="19" r="2.5" />
    <path d="M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6" strokeLinecap="round" />
  </svg>
);

const EyeIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="w-5 h-5"
    strokeWidth="1.6">
    <path
      d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="w-5 h-5"
    strokeWidth="1.6">
    <path
      d="M3 3l18 18M10.6 10.6a2.5 2.5 0 003.5 3.5M6.6 6.7C4.2 8.2 2.5 10.5 1.5 12c0 0 3.5 7 10.5 7 2 0 3.7-.5 5.1-1.3M9.9 5.2A11 11 0 0112 5c7 0 10.5 7 10.5 7-.6 1.1-1.5 2.5-2.8 3.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const features = [
  { Icon: AlbumIcon, label: "Quản lý album thông minh" },
  { Icon: UploadIcon, label: "Upload hình ảnh nhanh chóng" },
  { Icon: ShareIcon, label: "Chia sẻ hình ảnh đến khách hàng dễ dàng" },
];

const initialForm = {
  ten_studio: "",
  ho_ten_chu_studio: "",
  so_dien_thoai: "",
  mat_khau: "",
};

const register2 = () => {
  const [isDark] = useDarkMode();
  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!form.ten_studio.trim()) {
      newErrors.ten_studio = "Vui lòng nhập tên studio";
    }

    if (!form.ho_ten_chu_studio.trim()) {
      newErrors.ho_ten_chu_studio = "Vui lòng nhập họ tên chủ studio";
    }

    if (!form.so_dien_thoai.trim()) {
      newErrors.so_dien_thoai = "Vui lòng nhập số điện thoại";
    } else if (!/^0\d{9}$/.test(form.so_dien_thoai.trim())) {
      newErrors.so_dien_thoai = "Số điện thoại không hợp lệ";
    }

    if (!form.mat_khau) {
      newErrors.mat_khau = "Vui lòng nhập mật khẩu";
    } else if (form.mat_khau.length < 6) {
      newErrors.mat_khau = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu";
    } else if (confirmPassword !== form.mat_khau) {
      newErrors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      ten_studio: form.ten_studio.trim(),
      ho_ten_chu_studio: form.ho_ten_chu_studio.trim(),
      so_dien_thoai: form.so_dien_thoai.trim(),
      mat_khau: form.mat_khau,
    };

    try {
      setLoading(true);

      const res = await dangKyStudio(payload);

      notifyApiByErrorCode(res, {
        successMessage: "Đăng ký thành công! Vui lòng đăng nhập.",
        errorMessage: "Đăng ký thất bại, vui lòng thử lại",
        onSuccess: () => navigate("/login"),
      });
    } catch (err) {
      notifyApiByErrorCode(err?.response?.data ?? err, {
        errorMessage: "Đã có lỗi xảy ra, vui lòng thử lại",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="loginwrapper min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-slate-800">
        {/* Left panel — photo + pitch */}
        <div
          className="relative w-full lg:w-[65%] min-h-[380px] lg:min-h-screen bg-cover bg-no-repeat bg-center flex flex-col justify-center px-10 sm:px-14 lg:px-16 py-16"
          style={{
            backgroundImage: `linear-gradient(120deg, rgba(252,248,243,0.9), rgba(178,122,46,0.25) 60%), url(${bgImage2}), url(${bgImage1})`,
            backgroundSize: "cover, cover, cover",
            backgroundPosition: "center, center top, center",
            backgroundRepeat: "no-repeat, no-repeat, no-repeat",
            backgroundBlendMode: "normal, soft-light, normal",
          }}>
          <Link to="/" className="absolute top-8 left-10 sm:left-14 lg:left-16">
            <img src={isDark ? LogoWhite : Logo} alt="logo" className="h-8" />
          </Link>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] leading-tight font-bold text-slate-900 max-w-[560px]">
            Bắt đầu quản lý studio của bạn ngay hôm nay
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-700/90 max-w-[520px] leading-relaxed">
            Tạo tài khoản miễn phí để tối ưu toàn bộ quy trình từ tải ảnh lên,
            quản lý album, duyệt ảnh đến chia sẻ và giao ảnh cho khách hàng trên
            một nền tảng duy nhất.
          </p>

          <ul className="mt-10 space-y-5">
            {features.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-4">
                <span className="flex-shrink-0 w-11 h-11 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-primary-700">
                  <Icon />
                </span>
                <span className="text-slate-900 text-base sm:text-lg">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right panel — register form */}
        <div className="relative w-full lg:w-[35%]">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800 px-6 sm:px-12 lg:px-16 py-14 justify-center overflow-y-auto">
            <div className="mobile-logo text-center mb-6 lg:hidden block">
              <Link to="/">
                <img
                  src={isDark ? LogoWhite : Logo}
                  alt=""
                  className="mx-auto"
                />
              </Link>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                Tạo tài khoản studio
              </h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
                Đăng ký để bắt đầu quản lý studio của bạn
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Tên studio */}
              <div>
                <label
                  htmlFor="ten_studio"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Tên studio
                </label>
                <input
                  id="ten_studio"
                  name="ten_studio"
                  type="text"
                  value={form.ten_studio}
                  onChange={handleChange}
                  placeholder="VD: Studio Ánh Sáng"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
                    errors.ten_studio
                      ? "border-red-400 focus:ring-red-400/30"
                      : "border-slate-200 focus:border-primary-500"
                  }`}
                />
                {errors.ten_studio && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.ten_studio}
                  </p>
                )}
              </div>

              {/* Họ tên chủ studio */}
              <div>
                <label
                  htmlFor="ho_ten_chu_studio"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Họ tên chủ studio
                </label>
                <input
                  id="ho_ten_chu_studio"
                  name="ho_ten_chu_studio"
                  type="text"
                  value={form.ho_ten_chu_studio}
                  onChange={handleChange}
                  placeholder="VD: Nguyễn Văn A"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
                    errors.ho_ten_chu_studio
                      ? "border-red-400 focus:ring-red-400/30"
                      : "border-slate-200 focus:border-primary-500"
                  }`}
                />
                {errors.ho_ten_chu_studio && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.ho_ten_chu_studio}
                  </p>
                )}
              </div>

              {/* Số điện thoại */}
              <div>
                <label
                  htmlFor="so_dien_thoai"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Số điện thoại
                </label>
                <input
                  id="so_dien_thoai"
                  name="so_dien_thoai"
                  type="tel"
                  inputMode="numeric"
                  value={form.so_dien_thoai}
                  onChange={handleChange}
                  placeholder="VD: 0868333224"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
                    errors.so_dien_thoai
                      ? "border-red-400 focus:ring-red-400/30"
                      : "border-slate-200 focus:border-primary-500"
                  }`}
                />
                {errors.so_dien_thoai && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.so_dien_thoai}
                  </p>
                )}
              </div>

              {/* Mật khẩu */}
              <div>
                <label
                  htmlFor="mat_khau"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="mat_khau"
                    name="mat_khau"
                    type={showPassword ? "text" : "password"}
                    value={form.mat_khau}
                    onChange={handleChange}
                    placeholder="Tối thiểu 6 ký tự"
                    className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
                      errors.mat_khau
                        ? "border-red-400 focus:ring-red-400/30"
                        : "border-slate-200 focus:border-primary-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.mat_khau && (
                  <p className="mt-1 text-xs text-red-500">{errors.mat_khau}</p>
                )}
              </div>

              {/* Xác nhận mật khẩu */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: undefined,
                        }));
                      }
                    }}
                    placeholder="Nhập lại mật khẩu"
                    className={`w-full rounded-lg border px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
                      errors.confirmPassword
                        ? "border-red-400 focus:ring-red-400/30"
                        : "border-slate-200 focus:border-primary-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    tabIndex={-1}>
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 rounded-lg bg-primary-700 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 transition-colors">
                {loading ? "Đang đăng ký..." : "Đăng ký"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary-700 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default register2;
