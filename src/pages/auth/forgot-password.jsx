import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import useDarkMode from "@/hooks/useDarkMode";
// image import
import LogoWhite from "@/assets/images/logo/logo-white.svg";
import Logo from "@/assets/images/logo/logo.svg";
import bgImage1 from "@/assets/images/all-img/login-bg-1.png";
import bgImage2 from "@/assets/images/all-img/login-bg-2.png";
import {
  quenMatKhauGuiEmail,
  OTPMatKhau, // TODO: sửa lại đúng tên hàm gọi API xác nhận OTP nếu khác
} from "@/store/api/xac-thuc";
import { notifyApiByCode } from "@/utils/api-toast"; // TODO: sửa lại đúng đường dẫn file chứa notifyApiByCode

const MailIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="w-5 h-5"
    strokeWidth="1.6">
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ShieldIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="w-5 h-5"
    strokeWidth="1.6">
    <path
      d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    className="w-5 h-5"
    strokeWidth="1.6">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const features = [
  { Icon: MailIcon, label: "Nhận liên kết đặt lại mật khẩu qua email" },
  { Icon: ShieldIcon, label: "Bảo mật tài khoản studio của bạn" },
  { Icon: ClockIcon, label: "Khôi phục truy cập chỉ trong vài phút" },
];

const ForgotPassword = () => {
  const [isDark] = useDarkMode();
  const navigate = useNavigate();

  // step: "email" -> nhập email | "otp" -> nhập mã OTP 6 số
  const [step, setStep] = useState("email");

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const OTP_LENGTH = 6;
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const otpRefs = React.useRef([]);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError("");
  };

  const validate = () => {
    if (!email.trim()) {
      setError("Vui lòng nhập email");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Email không hợp lệ");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = { email: email.trim() };

    try {
      setLoading(true);

      const res = await quenMatKhauGuiEmail(payload);

      notifyApiByCode(res, {
        successMessage: "Mã OTP đã được gửi đến email của bạn.",
        errorMessage: "Gửi yêu cầu thất bại, vui lòng thử lại",
        onSuccess: () => {
          setOtp(Array(OTP_LENGTH).fill(""));
          setOtpError("");
          setStep("otp");
        },
      });
    } catch (err) {
      notifyApiByCode(err?.response?.data ?? err, {
        errorMessage: "Đã có lỗi xảy ra, vui lòng thử lại",
      });
    } finally {
      setLoading(false);
    }
  };

  // --- Xử lý nhập OTP (6 ô số) ---
  const handleOtpChange = (index, rawValue) => {
    const value = rawValue.replace(/\D/g, "");

    if (!value) {
      const next = [...otp];
      next[index] = "";
      setOtp(next);
      return;
    }

    // Hỗ trợ paste cả chuỗi 6 số vào 1 ô
    if (value.length > 1) {
      const digits = value.slice(0, OTP_LENGTH - index).split("");
      const next = [...otp];
      digits.forEach((d, i) => {
        next[index + i] = d;
      });
      setOtp(next);
      const lastIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      otpRefs.current[lastIndex]?.focus();
      return;
    }

    const next = [...otp];
    next[index] = value;
    setOtp(next);

    if (index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    if (otpError) setOtpError("");
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    const code = otp.join("");
    if (code.length !== OTP_LENGTH) {
      setOtpError("Vui lòng nhập đủ 6 số");
      return;
    }

    try {
      setOtpLoading(true);

      const res = await OTPMatKhau({
        email: email.trim(),
        otp: code,
      });

      notifyApiByCode(res, {
        successMessage: "Xác thực OTP thành công.",
        errorMessage: "Mã OTP không đúng hoặc đã hết hạn",
        onSuccess: () => {
          // TODO: điều hướng sang trang đặt mật khẩu mới, có thể kèm token trả về từ res
          navigate("/reset-password", { state: { email: email.trim() } });
        },
      });
    } catch (err) {
      notifyApiByCode(err?.response?.data ?? err, {
        errorMessage: "Đã có lỗi xảy ra, vui lòng thử lại",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      const res = await quenMatKhauGuiEmail({ email: email.trim() });
      notifyApiByCode(res, {
        successMessage: "Đã gửi lại mã OTP.",
        errorMessage: "Gửi lại mã thất bại, vui lòng thử lại",
      });
    } catch (err) {
      notifyApiByCode(err?.response?.data ?? err, {
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
            Khôi phục quyền truy cập vào studio của bạn
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-700/90 max-w-[520px] leading-relaxed">
            Nhập email đã đăng ký, chúng tôi sẽ gửi cho bạn liên kết để đặt lại
            mật khẩu và tiếp tục quản lý album, ảnh và khách hàng của bạn.
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

        {/* Right panel — forgot password form */}
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
                {step === "email" ? "Quên mật khẩu" : "Xác nhận mã OTP"}
              </h2>
              <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
                {step === "email" ? (
                  "Nhập email của bạn, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu"
                ) : (
                  <>
                    Nhập mã 6 số vừa được gửi tới{" "}
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {email.trim()}
                    </span>
                  </>
                )}
              </p>
            </div>

            {step === "email" ? (
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="VD: example@example.com"
                    className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
                      error
                        ? "border-red-400 focus:ring-red-400/30"
                        : "border-slate-200 focus:border-primary-500"
                    }`}
                  />
                  {error && (
                    <p className="mt-1 text-xs text-red-500">{error}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-lg bg-primary-700 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 transition-colors">
                  {loading ? "Đang gửi..." : "Gửi mã OTP"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} noValidate className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Mã OTP
                  </label>
                  <div className="flex items-center justify-between gap-2">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={OTP_LENGTH}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className={`w-11 h-12 sm:w-12 sm:h-14 text-center text-lg font-semibold rounded-lg border text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/40 dark:bg-slate-700 dark:text-white dark:border-slate-600 ${
                          otpError
                            ? "border-red-400 focus:ring-red-400/30"
                            : "border-slate-200 focus:border-primary-500"
                        }`}
                      />
                    ))}
                  </div>
                  {otpError && (
                    <p className="mt-2 text-xs text-red-500">{otpError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full rounded-lg bg-primary-700 hover:bg-primary-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 transition-colors">
                  {otpLoading ? "Đang xác nhận..." : "Xác nhận"}
                </button>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400">
                  Chưa nhận được mã?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-semibold text-primary-700 hover:underline disabled:opacity-60">
                    Gửi lại
                  </button>
                </p>

                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="w-full text-center text-sm text-slate-500 dark:text-slate-400 hover:underline">
                  ← Đổi email khác
                </button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Đã nhớ mật khẩu?{" "}
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

export default ForgotPassword;
