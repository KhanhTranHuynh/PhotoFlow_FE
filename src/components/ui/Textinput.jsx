import React, { useState, useRef } from "react";
import Icon from "@/components/ui/Icon";
import DatePicker from "@/components/ui/DatePicker";
import Cleave from "cleave.js/react";
import "cleave.js/dist/addons/cleave-phone.us";

const Textinput = ({
  type,
  label,
  placeholder = "Add placeholder",
  classLabel = "form-label",
  required,
  className = "",
  classGroup = "",
  register,
  name,
  readonly,
  value,
  error,
  icon,
  disabled,
  id,
  horizontal,
  validate,
  isMask,
  msgTooltip,
  description,
  hasicon,
  onChange,
  onBlur,
  options,
  onFocus,
  defaultValue,
  hideErrorIcon,
  style,
  number,
  soLuong,
  money,
  phone,
  email,
  datePicker,
  ...rest
}) => {
  const [open, setOpen] = useState(false);

  // --- touched state (for required validation) ---
  const [touched, setTouched] = useState(false);

  // --- Money state ---
  const [moneyRaw, setMoneyRaw] = useState(() => {
    const initial = value !== undefined ? value : defaultValue;
    if (initial == null || initial === "") return "";
    return String(initial).replace(/[.,]/g, "");
  });
  const [isMoneyFocused, setIsMoneyFocused] = useState(false);
  const moneyInputRef = useRef(null);
  const cursorPosRef = useRef(null);
  const moneyRawRef = useRef(moneyRaw);

  const [emailValue, setEmailValue] = useState(() => {
    const initial =
      value !== undefined
        ? value
        : defaultValue !== undefined
          ? defaultValue
          : "";
    return String(initial || "");
  });

  const [emailError, setEmailError] = useState("");

  const validateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmailValue(val);

    if (!val) {
      setEmailError("Email không được để trống.");
    } else if (!validateEmail(val)) {
      setEmailError("Email không hợp lệ.");
    } else {
      setEmailError("");
    }

    if (onChange) {
      onChange({
        ...e,
        target: { ...e.target, value: val },
      });
    }
  };

  const handleEmailBlur = (e) => {
    setTouched(true);
    if (!emailValue) {
      setEmailError("Email không được để trống.");
    } else if (!validateEmail(emailValue)) {
      setEmailError("Email không hợp lệ.");
    } else {
      setEmailError("");
    }

    onBlur && onBlur(e);
  };

  React.useEffect(() => {
    if (email && value !== undefined) {
      setEmailValue(String(value));
    }
  }, [value, email]);

  // --- Phone state ---
  const [phoneRaw, setPhoneRaw] = useState(() => {
    const initial =
      value !== undefined
        ? value
        : defaultValue !== undefined
          ? defaultValue
          : "";
    return String(initial || "")
      .replace(/\D/g, "")
      .slice(0, 10);
  });
  const [phoneError, setPhoneError] = useState("");

  // --- soLuong state ---
  const [soLuongError, setSoLuongError] = useState("");

  const inputStyle = readonly
    ? { backgroundColor: "#D1D5DB", color: "#000000", ...style }
    : style;

  const handleOpen = () => setOpen(!open);

  // ─── Required helper ───────────────────────────────────────────
  const requiredMsg = "Không được bỏ trống.";

  const checkRequired = (val) => {
    if (
      required &&
      (val === undefined || val === null || String(val).trim() === "")
    ) {
      return requiredMsg;
    }
    return "";
  };

  // ─── Phone handler ─────────────────────────────────────────────
  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 10) val = val.slice(0, 10);
    setPhoneRaw(val);

    if (val.length < 10) {
      setPhoneError("Số điện thoại phải đủ 10 số.");
    } else if (val.length > 10) {
      setPhoneError("Số điện thoại tối đa 10 số.");
    } else {
      setPhoneError("");
    }

    if (onChange) {
      onChange({
        ...e,
        target: { ...e.target, value: val },
      });
    }
  };

  const handlePhoneBlur = (e) => {
    setTouched(true);
    if (phoneRaw.length < 10) {
      setPhoneError("Số điện thoại phải đủ 10 số.");
    } else if (phoneRaw.length > 10) {
      setPhoneError("Số điện thoại tối đa 10 số.");
    } else {
      setPhoneError("");
    }
    if (onBlur) onBlur(e);
  };

  React.useEffect(() => {
    if (phone && value !== undefined) {
      setPhoneRaw(String(value).replace(/\D/g, "").slice(0, 10));
    }
  }, [value, phone]);

  // ─── soLuong handlers ──────────────────────────────────────────
  const handleSoLuongKeyDown = (e) => {
    const allowed = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (allowed.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();

    if (e.key === "0") {
      const cur = e.target.value.replace(/\D/g, "");
      if (cur === "" || cur === "0") e.preventDefault();
    }
  };

  const handleSoLuongChange = (e) => {
    let cleaned = e.target.value.replace(/\D/g, "");
    cleaned = cleaned.replace(/^0+/, "");

    if (e.target.value !== cleaned) e.target.value = cleaned;

    setSoLuongError("");
    onChange && onChange({ ...e, target: { ...e.target, value: cleaned } });
  };

  const handleSoLuongBlur = (e) => {
    setTouched(true);
    const numVal = parseInt(e.target.value, 10);
    if (!e.target.value || isNaN(numVal) || numVal <= 0) {
      onChange && onChange({ ...e, target: { ...e.target, value: "1" } });
    }
    onBlur && onBlur(e);
  };

  // ─── Combined error resolution ─────────────────────────────────
  let combinedError = error;
  if (phone) {
    combinedError = phoneError ? { ...error, message: phoneError } : error;
  }
  if (email) {
    combinedError = emailError ? { ...error, message: emailError } : error;
  }
  if (soLuong) {
    combinedError = soLuongError ? { ...error, message: soLuongError } : error;
  }

  // Required blur validation
  if (!combinedError && touched) {
    const currentVal = money
      ? moneyRaw
      : phone
        ? phoneRaw
        : email
          ? emailValue
          : value !== undefined
            ? value
            : defaultValue;
    const reqErr = checkRequired(currentVal);
    if (reqErr) combinedError = { message: reqErr };
  }

  // ─── Number: block any non-digit key ───────────────────────────
  const handleNumberKeyDown = (e) => {
    const allowed = [
      "Backspace",
      "Delete",
      "Tab",
      "Escape",
      "Enter",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      "Home",
      "End",
    ];
    if (allowed.includes(e.key)) return;
    if (e.ctrlKey || e.metaKey) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  const handleNumberChange = (e) => {
    const cleaned = e.target.value.replace(/\D/g, "");
    if (e.target.value !== cleaned) e.target.value = cleaned;
    onChange && onChange(e);
  };

  // ─── Money helpers ─────────────────────────────────────────────
  const formatMoney = (raw) => {
    if (!raw) return "";
    return raw
      .split("")
      .reverse()
      .join("")
      .replace(/(\d{3})(?=\d)/g, "$1,")
      .split("")
      .reverse()
      .join("");
  };

  const handleMoneyFocus = (e) => {
    if (readonly || disabled) return;
    setIsMoneyFocused(true);
    onFocus && onFocus(e);
  };

  const handleMoneyBlur = (e) => {
    setTouched(true);
    if (readonly || disabled) return;
    setIsMoneyFocused(false);
    const stripped =
      moneyRaw.replace(/^0+/, "") || (moneyRaw.length ? "0" : "");
    if (stripped !== moneyRaw) setMoneyRaw(stripped);
    if (onChange) onChange({ ...e, target: { ...e.target, value: stripped } });
    onBlur && onBlur(e);
  };

  // ─── onInput thay onChange để tránh vấn đề IME Vietnamese ──────
  // onInput luôn fires SAU khi IME commit xong, nhận value thực từ DOM
  const handleMoneyInput = (e) => {
    if (readonly || disabled) return;

    const input = e.target;
    const oldFormatted = input.value;
    const cursorInOld = input.selectionStart ?? 0;

    // Strip mọi ký tự không phải số (kể cả ký tự IME chèn vào)
    const newRaw = oldFormatted.replace(/\D/g, "").slice(0, 18);
    const newFormatted = formatMoney(newRaw);

    // Tính lại vị trí cursor
    const digitsBeforeCursor = oldFormatted
      .slice(0, cursorInOld)
      .replace(/,/g, "").length;
    let newCursor = newFormatted.length;
    if (digitsBeforeCursor > 0) {
      let digitsSeen = 0;
      for (let i = 0; i < newFormatted.length; i++) {
        if (newFormatted[i] !== ",") {
          digitsSeen++;
          if (digitsSeen === digitsBeforeCursor) {
            newCursor = i + 1;
            break;
          }
        }
      }
    } else {
      newCursor = 0;
    }

    moneyRawRef.current = newRaw;
    setMoneyRaw(newRaw);

    // Ghi thẳng vào DOM để tránh flicker, đặt cursor ngay lập tức
    input.value = newFormatted;
    input.setSelectionRange(newCursor, newCursor);
    cursorPosRef.current = null; // đã set xong, không cần layoutEffect

    if (onChange) onChange({ ...e, target: { ...e.target, value: newRaw } });
  };

  const handleMoneyRef = (el) => {
    moneyInputRef.current = el;
  };

  React.useLayoutEffect(() => {
    if (moneyInputRef.current && cursorPosRef.current !== null) {
      moneyInputRef.current.setSelectionRange(
        cursorPosRef.current,
        cursorPosRef.current,
      );
      cursorPosRef.current = null;
    }
  });

  React.useEffect(() => {
    if (value !== undefined && money && !isMoneyFocused) {
      const cleaned = String(value).replace(/[.,]/g, "");
      setMoneyRaw(cleaned);
    }
  }, [value, money, isMoneyFocused]);

  const moneyDisplayValue = formatMoney(moneyRaw);

  // ─── Resolve final input type ───────────────────────────────────
  const resolvedType =
    phone || money || number || soLuong
      ? "text"
      : type === "mat_khau" && open
        ? "text"
        : type;

  // ─── Build extra props per mode ────────────────────────────────
  const numberExtraProps = number
    ? {
        inputMode: "numeric",
        onKeyDown: handleNumberKeyDown,
        onChange: handleNumberChange,
      }
    : {};

  const soLuongExtraProps = soLuong
    ? {
        inputMode: "numeric",
        onKeyDown: handleSoLuongKeyDown,
        onChange: handleSoLuongChange,
        onBlur: handleSoLuongBlur,
      }
    : {};

  const moneyExtraProps = money
    ? {
        inputMode: "numeric",
        onInput: handleMoneyInput, // ← dùng onInput thay onChange
        onChange: () => {}, // ← giữ để React không warning uncontrolled
        onFocus: handleMoneyFocus,
        onBlur: handleMoneyBlur,
        value: moneyDisplayValue,
        ref: handleMoneyRef,
      }
    : {};

  // ─── Shared blur handler for plain inputs ──────────────────────
  const handlePlainBlur = (e) => {
    setTouched(true);
    onBlur && onBlur(e);
  };

  // ─── Base rounded class dùng chung cho MỌI input ───────────────
  const roundedClass = "rounded-xl";

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div
      className={`fromGroup  ${combinedError ? "has-error" : ""}  ${
        horizontal ? "flex" : ""
      }  ${validate ? "is-valid" : ""} `}>
      {label && (
        <label
          htmlFor={id}
          className={`block capitalize mb-1 ${classLabel} ${
            required ? "label-required" : ""
          }  ${
            horizontal ? "flex-0 mr-6 md:w-[100px] w-[60px] break-words" : ""
          }`}>
          {label}
        </label>
      )}
      <div className={`relative ${horizontal ? "flex-1" : ""}`}>
        {datePicker && (
          <DatePicker
            selectOnly={true}
            clearable={true}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            error={combinedError?.message || ""}
            className="w-full"
            inputClassName={`${roundedClass} ${className}`}
            {...rest}
          />
        )}

        {/* PHONE input */}
        {!datePicker && phone && (
          <input
            autoComplete="new-mat_khau"
            type="text"
            inputMode="numeric"
            pattern="\d*"
            value={phoneRaw}
            onChange={handlePhoneChange}
            onBlur={handlePhoneBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            id={id}
            maxLength={10}
            className={`form-control ${roundedClass} py-2 ${className} ${
              combinedError ? "has-error" : ""
            }`}
            style={inputStyle}
            {...rest}
            {...(name && register ? register(name) : {})}
          />
        )}

        {/* EMAIL input */}
        {!datePicker && !phone && email && (
          <input
            autoComplete="new-mat_khau"
            type="text"
            value={emailValue}
            onChange={handleEmailChange}
            onBlur={handleEmailBlur}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readonly}
            id={id}
            className={`form-control ${roundedClass} py-2 ${className} ${
              combinedError ? "has-error" : ""
            }`}
            style={inputStyle}
            {...rest}
            {...(name && register ? register(name) : {})}
          />
        )}

        {/* MONEY input */}
        {!datePicker && !phone && !email && money && (
          <input
            maxLength={23}
            autoComplete="off"
            type="text"
            {...(name && register ? register(name) : {})}
            {...rest}
            {...moneyExtraProps}
            className={`${
              error ? "has-error" : " "
            } form-control ${roundedClass} py-2 text-right ${className}`}
            placeholder={placeholder}
            readOnly={readonly}
            disabled={disabled}
            id={id}
            style={inputStyle}
          />
        )}

        {/* SO LUONG input */}
        {!datePicker && !phone && !email && !money && soLuong && (
          <input
            autoComplete="off"
            type="text"
            {...(name && register ? register(name) : {})}
            {...rest}
            {...soLuongExtraProps}
            {...(value !== undefined ? { value } : { defaultValue })}
            className={`${
              combinedError ? "has-error" : " "
            } form-control ${roundedClass} py-2 ${className}`}
            placeholder={placeholder}
            readOnly={readonly}
            disabled={disabled}
            id={id}
            style={inputStyle}
          />
        )}

        {/* NUMBER input */}
        {!datePicker && !phone && !email && number && !money && !soLuong && (
          <input
            autoComplete="off"
            type="text"
            {...(name && register ? register(name) : {})}
            {...rest}
            {...numberExtraProps}
            {...(value !== undefined ? { value } : { defaultValue })}
            onBlur={handlePlainBlur}
            className={`${
              error ? " has-error" : " "
            } form-control ${roundedClass} py-2 ${className}`}
            placeholder={placeholder}
            readOnly={readonly}
            disabled={disabled}
            id={id}
            style={inputStyle}
          />
        )}

        {/* ORIGINAL logic — with name, no mask */}
        {!datePicker &&
          !phone &&
          !money &&
          !email &&
          !number &&
          !soLuong &&
          name &&
          !isMask && (
            <input
              autoComplete="off"
              type={resolvedType}
              {...register(name)}
              {...rest}
              {...(value !== undefined ? { value } : { defaultValue })}
              className={`${
                error ? " has-error" : " "
              } form-control ${roundedClass} py-2 ${className}  `}
              placeholder={placeholder}
              readOnly={readonly}
              disabled={disabled}
              id={id}
              onChange={onChange}
              onBlur={handlePlainBlur}
              style={inputStyle}
            />
          )}

        {/* ORIGINAL logic — no name, no mask */}
        {!datePicker &&
          !phone &&
          !money &&
          !email &&
          !number &&
          !soLuong &&
          !name &&
          !isMask && (
            <input
              autoComplete="off"
              type={resolvedType}
              {...rest}
              {...(value !== undefined ? { value } : { defaultValue })}
              className={`form-control ${roundedClass} py-2 ${className}`}
              placeholder={placeholder}
              readOnly={readonly}
              disabled={disabled}
              id={id}
              onChange={onChange}
              onBlur={handlePlainBlur}
              style={inputStyle}
            />
          )}

        {/* MASK — with name */}
        {!datePicker &&
          !phone &&
          !money &&
          !email &&
          !number &&
          !soLuong &&
          name &&
          isMask && (
            <Cleave
              {...register(name)}
              {...rest}
              {...(value !== undefined ? { value } : { defaultValue })}
              placeholder={placeholder}
              options={options}
              className={`${
                error ? " has-error" : " "
              } form-control ${roundedClass} py-2 ${className}  `}
              onFocus={onFocus}
              id={id}
              readOnly={readonly}
              disabled={disabled}
              onChange={onChange}
              onBlur={handlePlainBlur}
              style={inputStyle}
            />
          )}

        {/* MASK — no name */}
        {!datePicker &&
          !phone &&
          !money &&
          !email &&
          !number &&
          !soLuong &&
          !name &&
          isMask && (
            <Cleave
              {...rest}
              {...(value !== undefined ? { value } : { defaultValue })}
              placeholder={placeholder}
              options={options}
              className={`${
                error ? " has-error" : " "
              } form-control ${roundedClass} py-2 ${className}  `}
              onFocus={onFocus}
              id={id}
              readOnly={readonly}
              disabled={disabled}
              onChange={onChange}
              onBlur={handlePlainBlur}
              style={inputStyle}
            />
          )}

        {/* ── Icons ────────────────────────────────────────────────── */}
        {!datePicker && (
          <div className="flex text-xl absolute ltr:right-[14px] rtl:left-[14px] top-1/2 -translate-y-1/2  space-x-1 rtl:space-x-reverse">
            {hasicon && (
              <span
                className="cursor-pointer text-secondary-500"
                onClick={handleOpen}>
                {open && type === "mat_khau" && (
                  <Icon icon="heroicons-outline:eye" />
                )}
                {!open && type === "mat_khau" && (
                  <Icon icon="heroicons-outline:eye-off" />
                )}
              </span>
            )}
            {combinedError && !hideErrorIcon && !money && (
              <span className="text-danger-500">
                <Icon icon="heroicons-outline:information-circle" />
              </span>
            )}
            {validate && (
              <span className="text-success-500">
                <Icon icon="bi:check-lg" />
              </span>
            )}
          </div>
        )}
      </div>

      {/* error message */}
      {!datePicker && combinedError && (
        <div
          className={` mt-2 ${
            msgTooltip
              ? " inline-block bg-danger-500 text-white text-[10px] px-2 py-1 rounded"
              : " text-danger-500 block text-sm"
          }`}>
          {combinedError.message}
        </div>
      )}
      {/* success message */}
      {!datePicker && validate && (
        <div
          className={` mt-2 ${
            msgTooltip
              ? " inline-block bg-success-500 text-white text-[10px] px-2 py-1 rounded"
              : " text-success-500 block text-sm"
          }`}>
          {validate}
        </div>
      )}
      {/* description */}
      {description && <span className="input-description">{description}</span>}
    </div>
  );
};

export default Textinput;
