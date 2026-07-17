import React from "react";
import { useDispatch } from "react-redux";
import useWidth from "@/hooks/useWidth";
import { toggleMobileChatSidebar } from "@/store/redux/chatSlice";

// import images
import blankSvgImage from "@/assets/images/svg/blank.svg";

const Blank = () => {
  const { width, breakpoints } = useWidth();
  const dispatch = useDispatch();

  return (
    <div className="h-full flex flex-col items-center justify-center xl:space-y-2 space-y-6">
      <img src={blankSvgImage} alt="Chưa có cuộc trò chuyện" />

      <h4 className="text-2xl text-slate-600 dark:text-slate-300 font-medium">
        Chưa có tin nhắn
      </h4>

      <p className="text-sm text-slate-500 lg:pt-0 pt-4">
        {width > breakpoints.lg ? (
          <span>Hãy bắt đầu cuộc trò chuyện bằng cách gửi lời chào.</span>
        ) : (
          <span
            className="btn btn-dark cursor-pointer"
            onClick={() => dispatch(toggleMobileChatSidebar(true))}>
            Bắt đầu trò chuyện
          </span>
        )}
      </p>
    </div>
  );
};

export default Blank;
