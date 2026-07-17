import React from "react";
import { Link, Navigate } from "react-router-dom";
import Social from "./common/social";
import LoginForm from "./common/login-form";
import { ToastContainer } from "react-toastify";
import useDarkMode from "@/hooks/useDarkMode";
import { getCookie } from "@/utils/cookies";
// image import
import bgImage from "@/assets/images/khanh-tran/login-background.png";
import LogoWhite from "@/assets/images/logo/logo-ht.svg";
import Logo from "@/assets/images/logo/logo-ht.svg";
const login = () => {
  const [isDark] = useDarkMode();

  const accessToken = getCookie("accessToken");
  const refreshToken = getCookie("refreshToken");
  const hasTokens = !!accessToken && !!refreshToken;

  if (hasTokens) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <ToastContainer />
      <div
        className="loginwrapper bg-cover bg-no-repeat bg-center"
        style={{
          backgroundImage: `url(${bgImage})`,
        }}>
        <div className="lg-inner-column min-h-screen flex items-center justify-center">
          <div className="w-full flex flex-col items-center justify-center">
            <div className="auth-box3 bg-white dark:bg-slate-800 dark:text-slate-400 shadow-lg rounded-lg w-full max-w-[480px]">
              {/* <div className="mobile-logo text-center mb-6 lg:hidden block">
                <Link to="/">
                  <img
                    src={isDark ? LogoWhite : Logo}
                    alt=""
                    className="mx-auto h-10 w-auto"
                  />
                </Link>
              </div> */}
              <div className="text-left mb-3 px-8 pt-8">
                <h4 className="font-medium">Đăng nhập</h4>
                <div>để bắt đầu</div>
              </div>
              <LoginForm />
              {/* <div className=" relative border-b-[#9AA2AF] border-opacity-[16%] border-b pt-6">
                <div className=" absolute inline-block  bg-white dark:bg-slate-800 dark:text-slate-400 left-1/2 top-1/2 transform -translate-x-1/2 px-4 min-w-max text-sm  text-slate-500  dark:text-slate-400font-normal ">
                  Or continue with
                </div>
              </div>
              <div className="max-w-[242px] mx-auto mt-8 w-full">
                <Social />
              </div>
              <div className="mx-auto font-normal text-slate-500 dark:text-slate-400 2xl:mt-12 mt-6 uppercase text-sm text-center">
                Already registered?
                <Link
                  to="/"
                  className="text-slate-900 dark:text-white font-medium hover:underline"
                >
                  Sign In
                </Link>
              </div> */}
            </div>
          </div>
          {/* <div className="auth-footer3 text-white py-5 px-5 text-xl w-full">
            Unlock your Project performance
          </div> */}
        </div>
      </div>
    </>
  );
};

export default login;
