import React, { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";

const normalize = (s) =>
  String(s ?? "")
    .toLowerCase()
    .trim();

const Autocomplete = ({
  label,
  moTa,
  moTaClassName = "",
  required = false,
  classLabel = "form-label",
  value,
  onChange,
  options = [],
  placeholder = "Chọn...",
  className = "",
  inputClassName = "",
  disabled = false,
  emptyText = "Không có dữ liệu",
  clearable = false,
  uiVariant = "default",
  onInputChange,
  floatingLabel = false,
  error,
  msgTooltip = false,
  // ── Props mới ────────────────────────────────────────────
  loading = false, // hiển thị spinner cuối list
  onMenuScrollToBottom, // callback khi cuộn đến cuối
  scrollThreshold = 20, // px cách đáy để trigger
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const menuRef = useRef(null); // ← ref cho dropdown list

  const safeOptions = useMemo(
    () => (Array.isArray(options) ? options : []),
    [options],
  );

  const selected = useMemo(() => {
    if (value === undefined || value === "") return null;
    return safeOptions.find((o) => o.value === value);
  }, [safeOptions, value]);

  // Khi có onInputChange (server-side search) → bỏ filter client-side
  // để tránh lọc lại kết quả API đã trả về đúng rồi
  const filtered = useMemo(() => {
    if (onInputChange) return safeOptions; // server đã filter

    const q = normalize(query);
    if (!q) return safeOptions;
    return safeOptions.filter((o) => normalize(o.label).includes(q));
  }, [safeOptions, query, onInputChange]);

  // ── Đóng dropdown khi click ra ngoài ─────────────────────
  useEffect(() => {
    if (!open) {
      setIsTyping(false);
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ── Scroll đến cuối → gọi onMenuScrollToBottom ───────────
  const handleMenuScroll = (e) => {
    if (!onMenuScrollToBottom || loading) return;
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom <= scrollThreshold) {
      onMenuScrollToBottom();
    }
  };

  const handleSelect = (opt) => {
    onChange?.(opt?.value ?? null);
    setQuery("");
    setIsTyping(false);
    setOpen(false);
  };

  const isGrayVariant = uiVariant === "gray";
  const inputRightPadding = clearable
    ? isGrayVariant
      ? "pr-20"
      : "pr-16"
    : isGrayVariant
      ? "pr-12"
      : "pr-10";

  const hasValue = value !== undefined && value !== null && value !== "";
  const errorMessage = typeof error === "string" ? error : error?.message || "";
  const showFloatingLabel = floatingLabel && label;
  const isFloatingLabelActive = isTyping || hasValue || open;

  const errorIconRight = isGrayVariant
    ? clearable
      ? "right-20"
      : "right-12"
    : clearable
      ? "right-14"
      : "right-8";

  return (
    <div
      className={`fromGroup ${errorMessage ? "has-error" : ""} ${className}`}>
      {label && !floatingLabel && (
        <label
          className={`block capitalize mb-1 ${classLabel} ${required ? "label-required" : ""}`}>
          {label}
        </label>
      )}
      {moTa && !floatingLabel && (
        <p className="text-xs text-slate-500 mt-0.5 mb-1">{moTa}</p>
      )}

      <div
        ref={rootRef}
        className={`relative ${showFloatingLabel ? "pt-2" : ""}`}
        style={showFloatingLabel ? { minHeight: "2.5rem" } : {}}>
        <div
          className={`relative flex items-center ${
            isGrayVariant
              ? `overflow-hidden rounded-md border ${
                  errorMessage ? "border-danger-500" : "border-slate-300"
                } bg-[#efefef]`
              : showFloatingLabel
                ? `overflow-visible rounded-md border ${
                    errorMessage ? "border-danger-500" : "border-slate-300"
                  }`
                : ""
          }`}>
          {showFloatingLabel && (
            <label
              className={`absolute left-2 px-1 transition-all duration-150 pointer-events-none bg-white z-10 whitespace-nowrap ${
                isFloatingLabelActive
                  ? "top-0 -translate-y-1/2 text-xs font-semibold text-slate-700"
                  : "top-1/2 -translate-y-1/2 text-sm text-slate-500"
              }`}
              style={{
                fontSize: isFloatingLabelActive ? "11px" : "14px",
                lineHeight: isFloatingLabelActive ? "1" : "1.5",
              }}>
              {label}
              {required && <span className="text-danger-500 ml-0.5">*</span>}
            </label>
          )}

          <input
            ref={inputRef}
            type="text"
            className={`form-control py-2 w-full ${inputRightPadding} ${inputClassName}
              ${errorMessage ? "has-error" : ""}
              ${
                isGrayVariant
                  ? "border-0 bg-transparent shadow-none focus:border-0 focus:ring-0"
                  : showFloatingLabel
                    ? "border-0 bg-transparent shadow-none focus:border-0 focus:ring-0 pt-5 pb-2"
                    : ""
              }`}
            placeholder={showFloatingLabel ? "" : placeholder}
            value={isTyping ? query : (selected?.label ?? "")}
            onChange={(e) => {
              const val = e.target.value;
              setIsTyping(true);
              setQuery(val);
              setOpen(true);
              if (val === "") onChange?.(null);
              onInputChange?.(val);
            }}
            onFocus={() => {
              if (disabled) return;
              setIsTyping(true);
              setQuery("");
              onInputChange?.("");
              setOpen(true);
            }}
            onClick={() => {
              if (disabled) return;
              if (!open) {
                setIsTyping(true);
                setQuery("");
                setOpen(true);
              }
            }}
            disabled={disabled}
            autoComplete="off"
          />

          {errorMessage && (
            <span
              className={`pointer-events-none absolute inset-y-0 ${errorIconRight} flex items-center text-danger-500`}
              aria-hidden="true">
              <Icon icon="heroicons-outline:information-circle" />
            </span>
          )}

          {clearable && !disabled && (query !== "" || hasValue) && (
            <button
              type="button"
              className={`absolute inset-y-0 ${
                isGrayVariant ? "right-11" : "right-8"
              } flex items-center pr-1 text-slate-400 hover:text-slate-700`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={(e) => {
                e.preventDefault();
                onChange?.(null);
                setQuery("");
                setIsTyping(true);
                setOpen(false);
                inputRef.current?.focus();
              }}>
              <Icon icon="heroicons-outline:x" />
            </button>
          )}

          <button
            type="button"
            className={`absolute inset-y-0 right-0 flex items-center ${
              isGrayVariant
                ? "w-11 justify-center bg-transparent text-slate-600"
                : "pr-3"
            }`}
            onMouseDown={(e) => e.preventDefault()}
            onClick={(e) => {
              e.preventDefault();
              if (disabled) return;
              setOpen((s) => {
                const next = !s;
                if (next) {
                  setIsTyping(true);
                  setQuery("");
                  onInputChange?.("");
                }
                return next;
              });
              inputRef.current?.focus();
            }}>
            <Icon icon="heroicons:chevron-down" />
          </button>
        </div>

        {open && (
          <div
            ref={menuRef}
            onScroll={handleMenuScroll} // ← lắng nghe scroll
            className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-base ring-1 ring-slate-900/5 dark:bg-slate-800">
            {filtered.length === 0 && !loading ? (
              <div className="px-3 py-2 text-slate-500">{emptyText}</div>
            ) : (
              <>
                {filtered.map((opt, idx) => (
                  <div
                    key={String(opt.value) || idx}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      if (opt.disabled) return;
                      handleSelect(opt);
                    }}
                    className={`px-3 py-2 transition ${
                      opt.disabled
                        ? "cursor-not-allowed bg-slate-50 text-slate-600"
                        : opt.value === value
                          ? "cursor-pointer bg-slate-300 dark:bg-slate-700 font-medium"
                          : "cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}>
                    <div>{opt.label}</div>
                    {opt.moTa && (
                      <div className={`text-xs mt-0.5 ${moTaClassName}`}>
                        {opt.moTa}
                      </div>
                    )}
                  </div>
                ))}

                {/* Spinner khi đang load thêm */}
                {loading && (
                  <div className="flex items-center justify-center gap-2 px-3 py-2 text-slate-400 text-xs">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none">
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
                    Đang tải thêm...
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
      {moTa && <p className="text-xs text-slate-500 mt-0.5">{moTa}</p>}
      {errorMessage && (
        <div
          className={` mt-2 ${
            msgTooltip
              ? " inline-block bg-danger-500 text-white text-[10px] px-2 py-1 rounded"
              : " text-danger-500 block text-sm"
          }`}>
          {errorMessage}
        </div>
      )}
    </div>
  );
};

export default Autocomplete;
