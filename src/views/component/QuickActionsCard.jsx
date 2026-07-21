import React from "react";
import Icon from "@/components/ui/Icon";

const QuickActionsCard = ({
  title = "",
  icon = "",
  iconBg = "",
  iconColor = "",
  children,
  rightButton = null,
}) => {
  return (
    <div
      className="
        w-full overflow-hidden
        rounded-2xl border border-slate-200
        bg-white shadow-sm
        dark:border-slate-700
        dark:bg-slate-900
      ">
      {/* Header */}
      <div
        className="
          flex items-center justify-between
          border-b border-slate-100
          px-4 py-2
          dark:border-slate-700
        ">
        {/* Left */}
        <div className="flex items-center gap-2.5">
          {/* Icon */}
          {/* 
          <div
            className="
              flex h-9 w-9 shrink-0
              items-center justify-center
              rounded-xl
            "
          >
            <Icon
              icon={icon}
              className={`text-3xl ${iconColor}`}
            />
          </div> 
          */}

          {/* Title */}
          <h2
            className="
              text-lg font-semibold
              text-slate-700
              dark:text-slate-200
            ">
            {title}
          </h2>
        </div>

        {/* Right button */}
        {rightButton && <div className="shrink-0">{rightButton}</div>}
      </div>

      {/* Content */}
      <div className="p-4">{children}</div>
    </div>
  );
};

export default QuickActionsCard;
