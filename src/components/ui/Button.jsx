import React from "react";
import Icon from "@/components/ui/Icon";
import { Link } from "react-router-dom";

function Button({
  text,
  type = "button",
  isLoading,
  disabled,
  className = "",
  children,
  icon,
  loadingClass = "unset-classname",
  iconPosition = "left",
  iconClass = "text-[20px]",
  link,
  onClick,
  div,

  // ✅ NEW
  buttonSave = false,
  buttonClose = false,
  buttonLock = false,
  buttonCancelLock = false,
  buttonAdd = false,
  buttonAction = false,
  xacNhanDon = false,
  tuChoi = false,
  chinhSuaDon = false,
  inHoaDonKhachHang = false,
  inHoaDonSanXuat = false,
  huyDonHang = false,
  xoaDonHang = false,
}) {
  let finalClass = "";

  switch (true) {
    case buttonSave:
      finalClass = `
      px-8 py-[10px]
      rounded-[12px]
      gap-2
      text-white
      font-medium
      bg-[linear-gradient(90deg,rgba(0,112,234,1)_0%,rgba(0,89,187,1)_100%)]
      hover:brightness-110
      transition
    `;
      break;

    case xacNhanDon:
      finalClass = `
      px-8 py-[10px]
      rounded-[12px]
      gap-2
      text-white
      font-medium
      bg-[linear-gradient(90deg,rgba(0,101,30,1)_0%,rgba(0,149,52,1)_100%)]
      hover:brightness-110
      transition
    `;
      break;

    case tuChoi:
      finalClass = `
      px-8 py-[10px]
      rounded-[12px]
      gap-2
      text-white
      font-medium
      bg-[rgba(220,53,69,1)]
      hover:bg-[rgba(220,53,69,1)]
      transition
    `;
      break;

    case chinhSuaDon:
      finalClass = `
      px-8 py-[10px]
      rounded-[12px]
      gap-2
      text-white
      font-medium
      bg-[linear-gradient(90deg,rgba(0,112,234,1)_0%,rgba(0,89,187,1)_100%)]
      hover:brightness-110
      transition
    `;
      break;

    case inHoaDonKhachHang:
      finalClass = `
      px-8 py-[10px]
      rounded-[12px]
      gap-2
      text-white
      font-medium
      bg-[rgba(64,94,150,1)]
      hover:bg-[rgba(64,94,150,1)]
      transition
    `;
      break;

    case huyDonHang:
      finalClass = `
      px-8 py-[10px]
      rounded-[12px]
      gap-2
      text-white
      font-medium
      bg-[rgba(108,117,125,1)]
      hover:bg-[rgba(108,117,125,1)]
      transition
    `;
      break;

    case xoaDonHang:
      finalClass = `
      px-8 py-[10px]
      rounded-[12px]
      gap-2
      text-white
      font-medium
      bg-[rgba(0,0,0,1)]
      hover:bg-[rgba(0,0,0,1)]
      transition
    `;
      break;

    case inHoaDonSanXuat:
      finalClass = `
      px-8 py-[10px]
      rounded-[12px]
      gap-2
      text-white
      font-medium
      bg-[rgb(79,106,129)]
      hover:bg-[rgba(108,117,125,1)]
      transition
    `;
      break;

    case buttonAdd:
      finalClass = `
      btn-sm
      rounded-[4px]
      gap-2
      text-white
      bg-[rgba(13,110,253,1)]
      hover:bg-[rgba(220,221,222,1)]
    `;
      break;

    case buttonAction:
      finalClass = `
      px-4 py-[6px]
      rounded-[3px]
      text-xs
      text-slate-600
      bg-[rgba(240,240,240,1)]
      hover:bg-[rgba(220,220,220,1)]
      transition
    `;
      break;

    case buttonClose:
      finalClass = `
      px-6 py-[10px]
      rounded-[12px]
      gap-2
      text-slate-700
      bg-[rgba(231,232,233,1)]
      hover:bg-[rgba(220,221,222,1)]
      transition
    `;
      break;

    case buttonLock:
      finalClass = `
      px-6 py-[10px]
      rounded-[16px]
      gap-2
      text-slate-700
      bg-[rgba(133, 83, 0, 1)]
      hover:bg-[rgb(119, 73, 0)]
      transition
    `;
      break;

    case buttonCancelLock:
      finalClass = `
      px-6 py-[10px]
      rounded-[16px]
      gap-2
      text-slate-700
      bg-[rgba(231,232,233,1)]
      hover:bg-[rgba(220,221,222,1)]
      transition
    `;
      break;

    default:
      finalClass = className;
  }

  if (className && finalClass !== className) {
    finalClass = `${finalClass} ${className}`;
  }

  return (
    <>
      {/* ================= BUTTON ================= */}
      {!link && !div && (
        <button
          type={type}
          onClick={onClick}
          className={`btn btn inline-flex justify-center items-center ${
            isLoading ? "pointer-events-none" : ""
          }
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}
          ${finalClass}`}>
          {children && !isLoading && children}

          {!children && !isLoading && (
            <span className="flex items-center gap-2">
              {icon && (
                <span
                  className={`
                  ${iconPosition === "right" ? "order-1" : ""}
                  ${iconClass}
                `}>
                  <Icon icon={icon} />
                </span>
              )}
              <span>{text}</span>
            </span>
          )}

          {isLoading && (
            <>
              <svg
                className={`animate-spin h-5 w-5 ${loadingClass}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading ...
            </>
          )}
        </button>
      )}

      {/* ================= DIV ================= */}
      {!link && div && (
        <div
          onClick={onClick}
          className={`btn btn inline-flex justify-center items-center ${
            isLoading ? "pointer-events-none" : ""
          }
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}
          ${finalClass}`}>
          {children && !isLoading && children}

          {!children && !isLoading && (
            <span className="flex items-center gap-2">
              {icon && (
                <span
                  className={`
                  ${iconPosition === "right" ? "order-1" : ""}
                  ${iconClass}
                `}>
                  <Icon icon={icon} />
                </span>
              )}
              <span>{text}</span>
            </span>
          )}

          {isLoading && (
            <>
              <svg
                className={`animate-spin h-5 w-5 ${loadingClass}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading ...
            </>
          )}
        </div>
      )}

      {/* ================= LINK ================= */}
      {link && !div && (
        <Link
          to={link}
          className={`btn btn inline-flex justify-center items-center ${
            isLoading ? "pointer-events-none" : ""
          }
          ${disabled ? "opacity-40 cursor-not-allowed" : ""}
          ${finalClass}`}>
          {children && !isLoading && children}

          {!children && !isLoading && (
            <span className="flex items-center gap-2">
              {icon && (
                <span
                  className={`
                  ${iconPosition === "right" ? "order-1" : ""}
                  ${iconClass}
                `}>
                  <Icon icon={icon} />
                </span>
              )}
              <span>{text}</span>
            </span>
          )}

          {isLoading && (
            <>
              <svg
                className={`animate-spin h-5 w-5 ${loadingClass}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
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
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Loading ...
            </>
          )}
        </Link>
      )}
    </>
  );
}

export default Button;
