import React from "react";
import { Link } from "react-router-dom";
import LoginForm from "./common/login-form";
import Social from "./common/social";
import { ToastContainer } from "react-toastify";
import useDarkMode from "@/hooks/useDarkMode";
// image import
import LogoWhite from "@/assets/images/logo/logo-white.svg";
import Logo from "@/assets/images/logo/logo.svg";
import bgImage from "@/assets/images/all-img/login-bg.png";

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

const features = [
  { Icon: AlbumIcon, label: "Quản lý album thông minh" },
  { Icon: UploadIcon, label: "Upload hình ảnh nhanh chóng" },
  { Icon: ShareIcon, label: "Chia sẻ hình ảnh đến khách hàng dễ dàng" },
];

const login2 = () => {
  const [isDark] = useDarkMode();
  return (
    <>
      <ToastContainer />
      <div className="loginwrapper min-h-screen w-full flex flex-col lg:flex-row bg-white dark:bg-slate-800">
        {/* Left panel — photo + pitch */}
        <div
          className="relative w-full lg:w-[65%] min-h-[380px] lg:min-h-screen bg-cover bg-no-repeat bg-center flex flex-col justify-center px-10 sm:px-14 lg:px-16 py-16"
          style={{
            backgroundImage: `linear-gradient(120deg, #FCF8F3, #B27A2E 70%), url(${bgImage})`,
            backgroundBlendMode: "overlay",
          }}>
          <Link to="/" className="absolute top-8 left-10 sm:left-14 lg:left-16">
            <img src={isDark ? LogoWhite : Logo} alt="logo" className="h-8" />
          </Link>

          <h1 className="text-3xl sm:text-4xl lg:text-[42px] leading-tight font-bold text-slate-900 max-w-[560px]">
            Quản lý ảnh chuyên nghiệp, giao ảnh dễ dàng
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-700/90 max-w-[520px] leading-relaxed">
            Tối ưu toàn bộ quy trình từ tải ảnh lên, quản lý album, duyệt ảnh
            đến chia sẻ và giao ảnh cho khách hàng trên một nền tảng duy nhất.
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

        {/* Right panel — login form */}
        <div className="relative w-full lg:w-[35%]">
          <div className="inner-content h-full flex flex-col bg-white dark:bg-slate-800 px-6 sm:px-12 lg:px-16 py-14 justify-center">
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
                Đăng nhập
              </h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
                Chào mừng bạn quay trở lại!
              </p>
            </div>

            <LoginForm />

            {/* <div className="relative flex items-center my-7">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
              <span className="px-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                Hoặc tiếp tục với
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" />
            </div>

            <div className="w-full">
              <Social />
            </div> */}

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="font-semibold text-primary-700 hover:underline">
                Đăng ký ngay
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default login2;
