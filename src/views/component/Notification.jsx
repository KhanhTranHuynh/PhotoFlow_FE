import React from "react";
import Icon from "@/components/ui/Icon";

const DEFAULT_TITLE = "Quy tắc quản lý";
const DEFAULT_DESCRIPTION =
  "Mỗi tài khoản cần có số điện thoại và email là duy nhất.";

const Notification = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  message,
  children,
  icon = "heroicons-outline:information-circle",

  // CUSTOM COLOR
  bgColor = "bg-[#eaf4ff]",
  iconColor = "text-blue-600",
  titleColor = "text-gray-900",
  textColor = "text-gray-700",
  leftBarColor = "bg-blue-500",

  className = "",
}) => {
  const content = children ?? message ?? description;

  return (
    <div
      className={`relative flex w-[70%] items-center gap-3 overflow-hidden rounded-[10px] px-3 py-[6px] ${bgColor} ${className}`}>
      {/* Thanh màu bên trái (fix luôn lỗi hở) */}
      <div className={`absolute inset-y-0 left-0 w-[6px] ${leftBarColor}`} />

      {/* Icon */}
      <div className="relative z-10 ml-2 flex h-7 w-7 flex-none items-center justify-center rounded-full">
        <Icon icon={icon} className={`text-[18px] ${iconColor}`} />
      </div>

      {/* Content */}
      <div
        className={`relative z-10 min-w-0 text-[13px] leading-5 md:text-sm ${textColor}`}>
        <span className={`font-semibold ${titleColor}`}>{title}:</span>{" "}
        <span className="font-medium">{content}</span>
      </div>
    </div>
  );
};

export default Notification;
