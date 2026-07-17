import Icon from "@/components/ui/Icon";
import React, { useEffect, useMemo, useRef, useState } from "react";

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function toDateLocal(iso) {
  const m = ISO_RE.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d)
    return null;
  return dt;
}

function toISODateLocal(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clampTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

function addMonths(d, n) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function isSameDate(a, b) {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDigitsFromModel(iso) {
  if (!iso) return "";
  const parsed = toDateLocal(iso);
  if (!parsed) return "";
  const day = String(parsed.getDate()).padStart(2, "0");
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const year = String(parsed.getFullYear()).padStart(4, "0");
  return `${day}${month}${year}`;
}

function toMaskedText(digits) {
  if (Array.isArray(digits)) {
    const get = (idx, fallback) => {
      const v = digits[idx];
      return /^\d$/.test(String(v ?? "")) ? String(v) : fallback;
    };
    return `${get(0, "d")}${get(1, "d")}/${get(2, "m")}${get(3, "m")}/${get(
      4,
      "y",
    )}${get(5, "y")}${get(6, "y")}${get(7, "y")}`;
  }

  const text = String(digits || "").replace(/\D/g, "");
  const dd = text.slice(0, 2).padEnd(2, "d");
  const mm = text.slice(2, 4).padEnd(2, "m");
  const yyyy = text.slice(4, 8).padEnd(4, "y");
  return `${dd}/${mm}/${yyyy}`;
}

function parseDigitsToDate(digits) {
  if (digits.length !== 8) return null;
  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));
  const dt = new Date(year, month - 1, day);
  if (
    dt.getFullYear() !== year ||
    dt.getMonth() !== month - 1 ||
    dt.getDate() !== day
  )
    return null;
  return dt;
}

function toDMYDate(d) {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).padStart(4, "0");
  return `${day}/${month}/${year}`;
}

function getGridStart(monthDate, weekStartsOnMonday) {
  const first = startOfMonth(monthDate);
  const day = first.getDay();
  const offset = weekStartsOnMonday ? (day === 0 ? 6 : day - 1) : day;
  return addDays(first, -offset);
}

const SEGMENTS = {
  day: { start: 0, end: 2, index: 0, length: 2 },
  month: { start: 3, end: 5, index: 2, length: 2 },
  year: { start: 6, end: 10, index: 4, length: 4 },
};

const SEGMENT_ORDER = ["day", "month", "year"];

export default function DatePicker({
  value,
  onChange,
  onInvalidInput,
  min = null,
  max = null,
  disabledDates = [],
  locale = "vi-VN",
  label = "",
  placeholder = "dd/mm/yyyy",
  disabled = false,
  clearable = true,
  readOnly = false,
  selectOnly = false,
  error = "",
  weekStartsOnMonday = true,
  className = "",
  inputClassName = "",
  noDefaultToday = false,
}) {
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const popoverRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [digits, setDigits] = useState(["", "", "", "", "", "", "", ""]);
  const [localError, setLocalError] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [focusedDate, setFocusedDate] = useState(null);
  const [isMonthYearPickerOpen, setIsMonthYearPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [monthYearLabel, setMonthYearLabel] = useState("");
  const [popoverStyle, setPopoverStyle] = useState({});
  const digitsRef = useRef(digits);
  const lastSegmentRef = useRef("day");
  const handledByKeydownRef = useRef(false);

  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short" }),
    [locale],
  );

  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale],
  );

  const ariaDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    [locale],
  );

  const minDate = useMemo(() => (min ? toDateLocal(min) : null), [min]);
  const maxDate = useMemo(() => (max ? toDateLocal(max) : null), [max]);

  const disabledSet = useMemo(() => {
    if (Array.isArray(disabledDates)) return new Set(disabledDates);
    return null;
  }, [disabledDates]);

  function isDateDisabled(date) {
    const day = clampTime(date);
    const minVal = minDate ? clampTime(minDate) : null;
    const maxVal = maxDate ? clampTime(maxDate) : null;

    if (minVal && day < minVal) return true;
    if (maxVal && day > maxVal) return true;

    if (Array.isArray(disabledDates)) {
      return disabledSet?.has(toISODateLocal(day)) ?? false;
    }

    if (typeof disabledDates === "function") {
      try {
        return !!disabledDates(day);
      } catch {
        return false;
      }
    }

    return false;
  }

  function syncFromValue(val) {
    const parsed = val ? toDateLocal(val) : null;
    setSelectedDate(parsed);
    const d = toDigitsFromModel(val);
    const nextDigits = Array.from({ length: 8 }, (_, i) => d[i] || "");
    setDigits(nextDigits);
    setInputText(toMaskedText(nextDigits));
    setViewDate(parsed ? startOfMonth(parsed) : startOfMonth(new Date()));
    setFocusedDate(parsed ?? clampTime(new Date()));
    setPickerYear((parsed ?? new Date()).getFullYear());
    setMonthYearLabel(
      monthFormatter.format(parsed ? startOfMonth(parsed) : new Date()),
    );
  }

  useEffect(() => {
    syncFromValue(value || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, locale]);

  useEffect(() => {
    digitsRef.current = digits;
  }, [digits]);

  useEffect(() => {
    function onDocClick(e) {
      if (!isOpen) return;
      const target = e.target;
      const insideRoot = rootRef.current?.contains(target);
      const insidePopover = popoverRef.current?.contains(target);
      if (!insideRoot && !insidePopover) setIsOpen(false);
    }

    function onResizeScroll() {
      if (!isOpen) return;
      updatePopoverPosition();
    }

    document.addEventListener("mousedown", onDocClick);
    window.addEventListener("resize", onResizeScroll);
    window.addEventListener("scroll", onResizeScroll, true);

    return () => {
      document.removeEventListener("mousedown", onDocClick);
      window.removeEventListener("resize", onResizeScroll);
      window.removeEventListener("scroll", onResizeScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      updatePopoverPosition();
      requestAnimationFrame(() => updatePopoverPosition());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, viewDate, isMonthYearPickerOpen]);

  function updatePopoverPosition() {
    const root = rootRef.current;
    if (!root || !isOpen) return;

    const margin = 8;
    const rect = root.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const availableWidth = Math.max(220, viewportWidth - margin * 2);
    const popupMinWidth = 320;
    const popupPreferredWidth = 360;
    const minWidth = Math.min(popupMinWidth, availableWidth);
    const width = Math.min(
      Math.max(popupPreferredWidth, minWidth),
      availableWidth,
    );
    const left = Math.max(
      margin,
      Math.min(rect.left, viewportWidth - width - margin),
    );

    const measuredHeight =
      popoverRef.current?.getBoundingClientRect().height ?? 420;
    const spaceBelow = viewportHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const showAbove = spaceBelow < measuredHeight && spaceAbove > spaceBelow;

    const top = showAbove
      ? Math.max(margin, rect.top - measuredHeight - margin)
      : Math.min(viewportHeight - margin, rect.bottom + margin);

    const maxHeight = Math.max(220, (showAbove ? spaceAbove : spaceBelow) - 4);

    setPopoverStyle({
      position: "fixed",
      left: `${left}px`,
      top: `${top}px`,
      minWidth: `${minWidth}px`,
      width: `${width}px`,
      maxHeight: `${maxHeight}px`,
      zIndex: 2147483647,
    });
  }

  function emitChange(next) {
    if (typeof onChange === "function") onChange(next);
  }

  function open() {
    if (disabled || readOnly || isOpen) return;

    const target = selectedDate || clampTime(new Date());
    setViewDate(startOfMonth(target));
    setFocusedDate(target);
    setPickerYear(target.getFullYear());
    setMonthYearLabel(monthFormatter.format(startOfMonth(target)));

    setIsOpen(true);
  }

  function close() {
    setIsOpen(false);
    setIsMonthYearPickerOpen(false);
  }

  function clear() {
    if (readOnly) return;
    setLocalError("");
    const nextDigits = ["", "", "", "", "", "", "", ""];
    setDigits(nextDigits);
    setInputText(toMaskedText(nextDigits));
    setSelectedDate(null);
    setFocusedDate(clampTime(new Date()));
    emitChange(null);
    setTimeout(() => {
      if (document.activeElement === inputRef.current) {
        selectSegment("day");
      }
    }, 0);
  }

  function selectDate(date) {
    if (isDateDisabled(date)) return;
    const iso = toISODateLocal(date);
    setLocalError("");
    setSelectedDate(date);
    setFocusedDate(date);
    setInputText(toDMYDate(date));
    const nextDigits = toDigitsFromModel(iso).split("");
    setDigits(nextDigits);
    emitChange(iso);
    close();
  }

  function goToday() {
    const t = clampTime(new Date());
    if (isDateDisabled(t)) return;
    selectDate(t);
  }

  function goPrevMonth() {
    const next = addMonths(viewDate, -1);
    setViewDate(next);
    setMonthYearLabel(monthFormatter.format(next));
  }

  function goNextMonth() {
    const next = addMonths(viewDate, 1);
    setViewDate(next);
    setMonthYearLabel(monthFormatter.format(next));
  }

  const monthPickerItems = useMemo(
    () =>
      Array.from({ length: 12 }, (_, month) => ({
        month,
        label: `Thg ${month + 1}`,
      })),
    [],
  );

  const yearOptions = useMemo(() => {
    const center = pickerYear;
    return Array.from({ length: 21 }, (_, i) => center - 10 + i);
  }, [pickerYear]);

  const weekDays = useMemo(() => {
    const base = weekStartsOnMonday
      ? new Date(2026, 0, 5)
      : new Date(2026, 0, 4);
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(base, i);
      if (
        String(locale || "")
          .toLowerCase()
          .startsWith("vi")
      ) {
        const day = d.getDay();
        return day === 0 ? "CN" : `T${day + 1}`;
      }
      return weekdayFormatter.format(d);
    });
  }, [locale, weekStartsOnMonday, weekdayFormatter]);

  const calendarRows = useMemo(() => {
    const rows = [];
    const start = getGridStart(viewDate, weekStartsOnMonday);
    const today = clampTime(new Date());
    const selected = selectedDate ? clampTime(selectedDate) : null;
    const focused = focusedDate ? clampTime(focusedDate) : null;

    for (let w = 0; w < 6; w++) {
      const row = [];
      for (let i = 0; i < 7; i++) {
        const d = clampTime(addDays(start, w * 7 + i));
        row.push({
          key: toISODateLocal(d),
          date: d,
          day: d.getDate(),
          inCurrentMonth: d.getMonth() === viewDate.getMonth(),
          isToday: isSameDate(d, today),
          isSelected: isSameDate(d, selected),
          isDisabled: isDateDisabled(d),
          isFocused: isSameDate(d, focused || selected || today),
          ariaLabel: ariaDateFormatter.format(d),
        });
      }
      rows.push(row);
    }
    return rows;
  }, [
    viewDate,
    selectedDate,
    focusedDate,
    weekStartsOnMonday,
    ariaDateFormatter,
    minDate,
    maxDate,
  ]);

  function onInputChange(e) {
    const inputType = e?.nativeEvent?.inputType || "";
    if (inputType !== "insertFromPaste" && inputType !== "insertFromDrop") {
      return;
    }
    const raw = e.target.value;
    const clean = raw.replace(/\D/g, "").slice(0, 8);
    if (!clean) return;
    applyPastedDigits(clean);
  }

  function getSegmentFromPos(pos) {
    if (pos <= SEGMENTS.day.end) return "day";
    if (pos <= SEGMENTS.month.end) return "month";
    return "year";
  }

  function getNextSegment(seg) {
    const idx = SEGMENT_ORDER.indexOf(seg);
    return SEGMENT_ORDER[Math.min(idx + 1, SEGMENT_ORDER.length - 1)];
  }

  function getPrevSegment(seg) {
    const idx = SEGMENT_ORDER.indexOf(seg);
    return SEGMENT_ORDER[Math.max(idx - 1, 0)];
  }

  function setSelection(start, end) {
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.setSelectionRange(start, end);
    });
  }

  function selectSegment(seg) {
    const range = SEGMENTS[seg];
    lastSegmentRef.current = seg;
    setSelection(range.start, range.end);
  }

  function setCaret(pos) {
    setSelection(pos, pos);
  }

  function clearSegment(seg) {
    const nextDigits = [...digitsRef.current];
    const range = SEGMENTS[seg];
    for (let i = 0; i < range.length; i++) {
      nextDigits[range.index + i] = "";
    }
    setDigits(nextDigits);
    setInputText(toMaskedText(nextDigits));
    setLocalError("");
  }

  function applyDigitInput(digit) {
    const input = inputRef.current;
    const pos = input?.selectionStart ?? 0;
    const seg = getSegmentFromPos(pos);
    const range = SEGMENTS[seg];

    const nextDigits = [...digitsRef.current];
    let posInSeg = pos - range.start;
    if (posInSeg < 0) posInSeg = 0;
    if (posInSeg >= range.length) posInSeg = range.length - 1;

    const segDigits = nextDigits.slice(range.index, range.index + range.length);

    // ===== DAY =====
    if (seg === "day") {
      if (posInSeg === 0) {
        if (digit > "3") {
          nextDigits[range.index] = "0";
          nextDigits[range.index + 1] = digit;
          setDigits(nextDigits);
          setInputText(toMaskedText(nextDigits));
          selectSegment("month");
          return;
        }
      }

      nextDigits[range.index + posInSeg] = digit;

      const val = Number(
        nextDigits.slice(range.index, range.index + 2).join(""),
      );

      if (posInSeg === 1) {
        if (val === 0) {
          nextDigits[range.index] = "0";
          nextDigits[range.index + 1] = "1";
        } else if (val > 31) {
          nextDigits[range.index] = "3";
          nextDigits[range.index + 1] = "1";
        }

        setDigits(nextDigits);
        setInputText(toMaskedText(nextDigits));
        selectSegment("month");
        return;
      }
    }

    // ===== MONTH =====
    if (seg === "month") {
      if (posInSeg === 0) {
        if (digit > "1") {
          nextDigits[range.index] = "0";
          nextDigits[range.index + 1] = digit;
          setDigits(nextDigits);
          setInputText(toMaskedText(nextDigits));
          selectSegment("year");
          return;
        }
      }

      nextDigits[range.index + posInSeg] = digit;

      const val = Number(
        nextDigits.slice(range.index, range.index + 2).join(""),
      );

      if (posInSeg === 1) {
        if (val === 0) {
          nextDigits[range.index] = "0";
          nextDigits[range.index + 1] = "1";
        } else if (val > 12) {
          nextDigits[range.index] = "1";
          nextDigits[range.index + 1] = "2";
        }

        setDigits(nextDigits);
        setInputText(toMaskedText(nextDigits));
        selectSegment("year");
        return;
      }
    }

    // ===== YEAR =====
    nextDigits[range.index + posInSeg] = digit;

    setDigits(nextDigits);
    setInputText(toMaskedText(nextDigits));

    const nextPos = range.start + Math.min(posInSeg + 1, range.length - 1);
    setCaret(nextPos);
  }

  function applyPastedDigits(text) {
    const clean = String(text || "")
      .replace(/\D/g, "")
      .slice(0, 8);
    if (!clean) return;
    const input = inputRef.current;
    const pos = input?.selectionStart ?? 0;
    const seg = getSegmentFromPos(pos);
    const startIndex = SEGMENTS[seg].index;
    const nextDigits = [...digitsRef.current];

    for (let i = 0; i < clean.length && startIndex + i < 8; i++) {
      nextDigits[startIndex + i] = clean[i];
    }

    setDigits(nextDigits);
    setInputText(toMaskedText(nextDigits));
    setLocalError("");

    const nextSeg = SEGMENT_ORDER.find((key) => {
      const range = SEGMENTS[key];
      return nextDigits
        .slice(range.index, range.index + range.length)
        .some((d) => !/^\d$/.test(d));
    });

    selectSegment(nextSeg || "year");
  }

  function handleInputFocus() {
    setTimeout(() => {
      focusActiveDay();
      selectSegment(lastSegmentRef.current || "day");
    }, 0);
  }

  function handleInputClick() {
    open();
    setTimeout(() => {
      const input = inputRef.current;
      if (!input) return;
      const pos = input.selectionStart ?? 0;
      selectSegment(getSegmentFromPos(pos));
    }, 0);
  }

  function handleInputSelect() {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart ?? 0;
    const end = input.selectionEnd ?? 0;
    if (inputText && start === 0 && end === inputText.length) {
      selectSegment(lastSegmentRef.current || "day");
    }
  }

  function handleInputKeyDown(e) {
    if (disabled || readOnly) return;
    const key = e.key;
    const input = inputRef.current;
    const pos = input?.selectionStart ?? 0;
    const seg = getSegmentFromPos(pos);

    if ((e.ctrlKey || e.metaKey) && key.toLowerCase() === "a") {
      e.preventDefault();
      selectSegment(seg);
      return;
    }

    if (key === "ArrowLeft") {
      e.preventDefault();
      selectSegment(getPrevSegment(seg));
      return;
    }

    if (key === "ArrowRight") {
      e.preventDefault();
      selectSegment(getNextSegment(seg));
      return;
    }

    if (key === "Home") {
      e.preventDefault();
      selectSegment("day");
      return;
    }

    if (key === "End") {
      e.preventDefault();
      selectSegment("year");
      return;
    }

    if (key === "/") {
      e.preventDefault();
      selectSegment(getNextSegment(seg));
      return;
    }

    if (key === "Backspace" || key === "Delete") {
      e.preventDefault();
      handledByKeydownRef.current = true;
      clearSegment(seg);
      selectSegment(seg);
      setTimeout(() => {
        handledByKeydownRef.current = false;
      }, 0);
      return;
    }

    if (!/^\d$/.test(key)) return;

    e.preventDefault();
    handledByKeydownRef.current = true;
    applyDigitInput(key);
    setTimeout(() => {
      handledByKeydownRef.current = false;
    }, 0);
  }

  function handleInputBeforeInput(e) {
    if (disabled || readOnly) return;

    // Nếu selectOnly = true, chặn tất cả input trực tiếp
    if (selectOnly) {
      e.preventDefault();
      return;
    }

    const inputType = e?.nativeEvent?.inputType || "";
    if (!inputType) return;

    if (inputType === "insertText") {
      if (handledByKeydownRef.current) {
        e.preventDefault();
        handledByKeydownRef.current = false;
        return;
      }
      const data = e.data || e?.nativeEvent?.data || "";
      if (!/^\d$/.test(data)) {
        e.preventDefault();
        return;
      }
      e.preventDefault();
      applyDigitInput(data);
      return;
    }

    if (
      inputType === "deleteContentBackward" ||
      inputType === "deleteContentForward" ||
      inputType === "deleteContent" ||
      inputType === "deleteByCut"
    ) {
      if (handledByKeydownRef.current) {
        e.preventDefault();
        handledByKeydownRef.current = false;
        return;
      }
      e.preventDefault();
      const input = inputRef.current;
      const pos = input?.selectionStart ?? 0;
      const seg = getSegmentFromPos(pos);
      clearSegment(seg);
      selectSegment(seg);
      return;
    }

    if (inputType === "insertFromPaste" || inputType === "insertFromDrop") {
      const data = e.data || e?.nativeEvent?.data || "";
      e.preventDefault();
      applyPastedDigits(data);
    }
  }

  function handleInputPaste(e) {
    if (disabled || readOnly) return;

    // Nếu selectOnly = true, chặn paste
    if (selectOnly) {
      e.preventDefault();
      return;
    }

    const text = e.clipboardData?.getData("text") || "";
    if (!text) return;
    e.preventDefault();
    applyPastedDigits(text);
  }

  function onInputBlur() {
    const allEmpty = digits.every((v) => !v);
    const allFilled = digits.every((v) => /^\d$/.test(v));

    if (allEmpty) {
      if (value !== null && value !== undefined) clear();
      return;
    }

    if (!allFilled) {
      const day = digits.slice(0, 2).join("");
      const month = digits.slice(2, 4).join("");
      const year = digits.slice(4, 8).join("");
      const missing = [];
      if (!/^\d{2}$/.test(day)) missing.push("ngày");
      if (!/^\d{2}$/.test(month)) missing.push("tháng");
      if (!/^\d{4}$/.test(year)) missing.push("năm");

      if (missing.length > 0) {
        const msg =
          missing.length === 1
            ? `Thiếu ${missing[0]}`
            : missing.length === 2
              ? `Thiếu ${missing[0]} và ${missing[1]}`
              : `Thiếu ${missing.join(", ")}`;
        setLocalError(msg);
        if (onInvalidInput) onInvalidInput(msg);
        return;
      }
    }

    const parsed = parseDigitsToDate(digits.join(""));
    if (!parsed || isDateDisabled(parsed)) {
      const msg = "Ngày không hợp lệ";
      setLocalError(msg);
      if (onInvalidInput) onInvalidInput(msg);
      return;
    }

    selectDate(parsed);
  }

  function selectMonthFromPicker(month) {
    const preferredDay =
      selectedDate?.getDate() ?? focusedDate?.getDate() ?? new Date().getDate();
    const maxDay = new Date(pickerYear, month + 1, 0).getDate();
    const day = Math.max(1, Math.min(preferredDay, maxDay));
    const picked = new Date(pickerYear, month, day);

    setViewDate(new Date(pickerYear, month, 1));
    setFocusedDate(picked);
    setIsMonthYearPickerOpen(false);
    setMonthYearLabel(monthFormatter.format(new Date(pickerYear, month, 1)));

    if (!isDateDisabled(picked)) {
      const iso = toISODateLocal(picked);
      setSelectedDate(picked);
      setInputText(toDMYDate(picked));
      setDigits(toDigitsFromModel(iso).split(""));
      setLocalError("");
      emitChange(iso);
    }

    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  function updateYear(year) {
    setPickerYear(year);
    setViewDate(new Date(year, viewDate.getMonth(), 1));
    setMonthYearLabel(
      monthFormatter.format(new Date(year, viewDate.getMonth(), 1)),
    );
  }

  function focusActiveDay() {
    const active = popoverRef.current?.querySelector(
      'button[data-active="true"]',
    );
    if (active) active.focus();
  }

  return (
    <div ref={rootRef} className={`relative inline-flex flex-col ${className}`}>
      {label ? (
        <label className="mb-1 text-xs text-gray-600">{label}</label>
      ) : null}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          placeholder={placeholder}
          // disabled={disabled || selectOnly}
          readOnly={readOnly || selectOnly}
          autoComplete="off"
          onKeyDown={selectOnly ? undefined : handleInputKeyDown}
          onBeforeInput={handleInputBeforeInput}
          onPaste={handleInputPaste}
          // onChange={onInputChange}
          onBlur={onInputBlur}
          onFocus={selectOnly ? undefined : handleInputFocus}
          onClick={handleInputClick}
          onSelect={selectOnly ? undefined : handleInputSelect}
          className={`h-9 w-full rounded-md border border-gray-300 bg-white px-3 pr-20 text-sm outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-100 ${inputClassName}`}
        />

        {!disabled && !readOnly ? (
          <button
            type="button"
            onClick={() => (isOpen ? close() : open())}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-blue-600"
            aria-label="Open calendar">
            <Icon icon="heroicons-outline:calendar" />
          </button>
        ) : null}

        {clearable && !disabled && value && !readOnly ? (
          <button
            type="button"
            onClick={clear}
            className="absolute right-10 top-1/2 -translate-y-1/2 rounded p-1 text-gray-500 hover:text-red-600"
            aria-label="Clear date">
            <Icon icon="heroicons-outline:x-mark" />
          </button>
        ) : null}
      </div>

      {localError || error ? (
        <p className="mt-1 text-xs text-red-600">{localError || error}</p>
      ) : null}

      {isOpen && !disabled ? (
        <div className="fixed inset-0 z-[2147483647] pointer-events-none">
          <div
            ref={popoverRef}
            role="dialog"
            aria-modal="false"
            aria-label="Date picker"
            style={popoverStyle}
            onMouseDown={(e) => e.preventDefault()}
            className="pointer-events-auto rounded-xl border border-gray-200 bg-white p-3 shadow-xl">
            <div className="mb-1 flex items-center justify-between">
              <button
                type="button"
                onClick={goPrevMonth}
                className="h-8 rounded-md border border-gray-300 px-3 hover:bg-gray-50"
                aria-label="Previous month">
                ‹
              </button>

              <button
                type="button"
                onClick={() => setIsMonthYearPickerOpen((v) => !v)}
                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-gray-50">
                <span className="text-sm font-semibold">{monthYearLabel}</span>
                <span
                  className={`text-xs transition-transform ${isMonthYearPickerOpen ? "rotate-180" : ""}`}>
                  ▾
                </span>
              </button>

              <button
                type="button"
                onClick={goNextMonth}
                className="h-8 rounded-md border border-gray-300 px-3 hover:bg-gray-50"
                aria-label="Next month">
                ›
              </button>
            </div>

            {isMonthYearPickerOpen ? (
              <div className="mb-1 rounded-lg border border-gray-200 bg-gray-50 p-2">
                <div className="mb-1 grid grid-cols-[32px_1fr_32px] items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateYear(pickerYear - 1)}
                    className="h-8 rounded-md border border-gray-300 hover:bg-white"
                    aria-label="Năm trước">
                    ‹
                  </button>

                  <select
                    value={pickerYear}
                    onChange={(e) => updateYear(Number(e.target.value))}
                    className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm"
                    aria-label="Chọn năm">
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={() => updateYear(pickerYear + 1)}
                    className="h-8 rounded-md border border-gray-300 hover:bg-white"
                    aria-label="Năm sau">
                    ›
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {monthPickerItems.map((m) => (
                    <button
                      key={m.month}
                      type="button"
                      onClick={() => selectMonthFromPicker(m.month)}
                      className={`rounded-md border px-2 py-2 text-xs hover:bg-gray-100 ${
                        m.month === viewDate.getMonth()
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 bg-white"
                      }`}>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <table className="w-full table-fixed border-collapse">
              <thead>
                <tr>
                  {weekDays.map((w) => (
                    <th
                      key={w}
                      className="py-1 text-xs font-semibold text-gray-500">
                      {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {calendarRows.map((week, wi) => (
                  <tr key={wi}>
                    {week.map((cell) => (
                      <td key={cell.key} className="p-0">
                        <button
                          type="button"
                          data-active={cell.isFocused ? "true" : "false"}
                          disabled={cell.isDisabled}
                          onClick={() => selectDate(cell.date)}
                          onFocus={() => setFocusedDate(cell.date)}
                          aria-label={cell.ariaLabel}
                          aria-selected={cell.isSelected}
                          aria-current={cell.isToday ? "date" : undefined}
                          className={[
                            "h-9 w-full rounded-lg text-sm transition",
                            cell.isDisabled
                              ? "cursor-not-allowed text-gray-300 line-through opacity-40 hover:bg-transparent"
                              : [
                                  "hover:bg-blue-50",
                                  !cell.inCurrentMonth
                                    ? "text-gray-400"
                                    : "text-gray-800",
                                  cell.isToday
                                    ? "ring-1 ring-dashed ring-gray-400"
                                    : "",
                                  cell.isSelected
                                    ? "bg-[#cb8901] !text-gray-800 hover:bg-[#cb8901]"
                                    : "",
                                  cell.isFocused ? "ring-1 ring-blue-400" : "",
                                ]
                                  .filter(Boolean)
                                  .join(" "),
                          ]
                            .filter(Boolean)
                            .join(" ")}>
                          {cell.day}
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-2 flex justify-between gap-2 border-t border-gray-200 pt-2">
              {clearable && (
                <button
                  type="button"
                  onClick={clear}
                  className="h-8 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">
                  Xóa
                </button>
              )}
              <button
                type="button"
                onClick={goToday}
                className="h-8 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50">
                Hôm nay
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
