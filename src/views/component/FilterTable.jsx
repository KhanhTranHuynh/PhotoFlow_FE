import React, { useEffect, useMemo, useState } from "react";
import Autocomplete from "@/components/ui/Autocomplete";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";

const DATE_RANGE_ERR = "Từ ngày không được lớn hơn Đến ngày";

const formatThousandsDot = (digits) => {
  if (!digits) return "";
  const clean = String(digits).replace(/^0+(?=\d)/, "");
  return clean.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

function isValidYMDDate(s) {
  if (typeof s !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [yy, mm, dd] = s.split("-");
  const y = Number(yy);
  const m = Number(mm);
  const d = Number(dd);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d))
    return false;
  if (y < 1 || y > 9999) return false;
  if (m < 1 || m > 12) return false;
  if (d < 1 || d > 31) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function validateNativeDateInput(raw, inputEl) {
  const s = (raw ?? "").toString().trim();

  if (!s) {
    if (inputEl?.validity?.badInput) return "Ngày không tồn tại";
    if (inputEl?.validity?.rangeOverflow || inputEl?.validity?.rangeUnderflow)
      return DATE_RANGE_ERR;
    return null;
  }

  if (inputEl?.validity?.rangeOverflow || inputEl?.validity?.rangeUnderflow)
    return DATE_RANGE_ERR;

  const m = s.match(/^(\d+)-(\d{2})-(\d{2})$/);
  if (!m) return "Ngày không hợp lệ";
  if (m[1].length > 4) return "Năm chỉ được nhập tối đa 4 số";
  const ymd = `${m[1]}-${m[2]}-${m[3]}`;
  if (!isValidYMDDate(ymd)) return "Ngày không tồn tại";
  return null;
}

const DATE_SUFFIX_PAIRS = [
  ["Tu", "Den"],
  ["tu", "den"],
  ["From", "To"],
  ["from", "to"],
  ["FROM", "TO"],
  ["fromDate", "toDate"],
  ["from_Date", "to_Date"],
  ["from_date", "to_date"],
  ["FromDate", "ToDate"],
];

function getPairedDateKey(key) {
  const k = String(key || "");
  if (!k) return "";

  for (const [fromS, toS] of DATE_SUFFIX_PAIRS) {
    if (k.endsWith(fromS)) return `${k.slice(0, -fromS.length)}${toS}`;
    if (k.endsWith(toS)) return `${k.slice(0, -toS.length)}${fromS}`;
  }

  return "";
}

function isFromDateKey(key) {
  const k = String(key || "");
  return DATE_SUFFIX_PAIRS.some(([fromS]) => k.endsWith(fromS));
}

function isToDateKey(key) {
  const k = String(key || "");
  return DATE_SUFFIX_PAIRS.some(([, toS]) => k.endsWith(toS));
}

export default function FilterBar({
  filters = [],
  modelValue = {},
  buttonSearch = false,
  initialFilters = {},
  emitOnInit = "none",
  hideClearButton = false,
  hideLabels = false,
  onUpdateModelValue,
  onClearFilters,
  onSearch,
  classParent,
  t,
}) {
  const normalizedFilters = useMemo(
    () => filters.map((f) => ({ type: "select", ...f })),
    [filters],
  );

  const [local, setLocal] = useState({ ...modelValue });
  const [moneyDisplays, setMoneyDisplays] = useState({});
  const [dateInputValues, setDateInputValues] = useState({});
  const [dateErrors, setDateErrors] = useState({});

  useEffect(() => {
    setLocal({ ...(modelValue || {}) });
  }, [modelValue]);

  useEffect(() => {
    let changed = false;
    const next = { ...local };
    Object.entries(initialFilters || {}).forEach(([k, v]) => {
      const cur = next[k];
      if (cur === undefined || cur === null || cur === "") {
        next[k] = v;
        changed = true;
      }
    });
    if (changed) {
      setLocal(next);
      if (emitOnInit === "update") onUpdateModelValue?.(next);
      else if (emitOnInit === "search") {
        onUpdateModelValue?.(next);
        onSearch?.();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilters]);

  const dateKeySet = useMemo(() => {
    const keys = normalizedFilters
      .filter((f) => f && f.type === "date" && f.key)
      .map((f) => String(f.key));
    return new Set(keys);
  }, [normalizedFilters]);

  const getDateMinForKey = (key) => {
    const k = String(key || "");
    if (isToDateKey(k)) {
      const fromKey = getPairedDateKey(k);
      if (fromKey && dateKeySet.has(fromKey)) {
        const fromVal = String(local[fromKey] || "").trim();
        if (isValidYMDDate(fromVal)) return fromVal;
      }
    }
    return "0001-01-01";
  };

  const getDateMaxForKey = (key) => {
    const k = String(key || "");
    if (isFromDateKey(k)) {
      const toKey = getPairedDateKey(k);
      if (toKey && dateKeySet.has(toKey)) {
        const toVal = String(local[toKey] || "").trim();
        if (isValidYMDDate(toVal)) return toVal;
      }
    }
    return "9999-12-31";
  };

  const rangeErrors = useMemo(() => {
    const errs = {};
    const keys = Array.from(dateKeySet);
    keys.forEach((k) => {
      if (!isFromDateKey(k)) return;
      const denKey = getPairedDateKey(k);
      if (!denKey || !dateKeySet.has(denKey)) return;

      const fromVal = String(local[k] || "").trim();
      const toVal = String(local[denKey] || "").trim();
      if (!isValidYMDDate(fromVal) || !isValidYMDDate(toVal)) return;

      if (fromVal > toVal) {
        errs[k] = DATE_RANGE_ERR;
        errs[denKey] = DATE_RANGE_ERR;
      }
    });
    return errs;
  }, [dateKeySet, local]);

  useEffect(() => {
    setDateErrors((cur) => {
      const next = { ...(cur || {}) };
      Object.keys(cur || {}).forEach((k) => {
        if (cur[k] !== DATE_RANGE_ERR) return;
        if (rangeErrors[k]) return;
        const v = String(local[k] || "").trim();
        if (!v || isValidYMDDate(v)) delete next[k];
      });
      return next;
    });
  }, [rangeErrors, local]);

  const emitUpdate = (next) => {
    if (!buttonSearch) onUpdateModelValue?.({ ...next });
  };

  const getFilterConfigByKey = (key) =>
    normalizedFilters.find((f) => f.key === key);

  const applyPairedDateClear = (next, key, raw) => {
    if (!raw) return;
    const pairedKey = getPairedDateKey(key);
    if (!pairedKey || !dateKeySet.has(pairedKey)) return;
    const pairedVal = String(next[pairedKey] || "").trim();
    if (!isValidYMDDate(pairedVal)) return;
    if (isFromDateKey(key) && pairedVal < raw) next[pairedKey] = null;
    if (isToDateKey(key) && pairedVal > raw) next[pairedKey] = null;
  };

  const updateField = (key, value, type) => {
    let v = value;
    const next = { ...local };

    if (type === "date") {
      const raw = (value ?? "").toString();
      const err = validateNativeDateInput(raw, null);
      setDateErrors((p) => ({ ...p, [key]: err }));
      if (err) return;

      next[key] = raw ? raw : null;
      applyPairedDateClear(next, key, raw);

      setLocal(next);
      emitUpdate(next);
      return;
    } else if (type === "number") {
      const digits = String(value ?? "").replace(/\D/g, "");
      v = digits ? digits : "";
    } else if (type === "time-hm") {
      v = typeof v === "string" ? v.trim() : v;
      if (v === undefined || v === null || v === "") v = "";
    } else if (type === "text" && typeof v === "string") {
      v = v.trim();
    }

    if (v === undefined) v = type === "text" ? "" : null;

    const cfg = getFilterConfigByKey(key);
    if (cfg?.formatter && typeof cfg.formatter === "function") {
      v = cfg.formatter(v);
    }

    next[key] = v;
    setLocal(next);
    emitUpdate(next);
  };

  const onDateInput = (key, eOrValue) => {
    const inputEl = eOrValue?.target;
    const raw =
      typeof eOrValue === "string" ? eOrValue : (inputEl?.value ?? "");
    setDateInputValues((p) => ({ ...p, [key]: raw }));
    const err = validateNativeDateInput(raw, inputEl);
    setDateErrors((p) => ({ ...p, [key]: err }));
    if (err) return;

    const next = { ...local };
    next[key] = raw || null;
    applyPairedDateClear(next, key, raw);

    setLocal(next);
    emitUpdate(next);
  };

  const onDateBlur = (key, eOrValue) => {
    const inputEl = eOrValue?.target;
    const raw =
      typeof eOrValue === "string"
        ? eOrValue
        : (inputEl?.value ?? dateInputValues[key] ?? local[key] ?? "");
    setDateInputValues((p) => ({ ...p, [key]: raw }));
    const err = validateNativeDateInput(raw, inputEl);
    setDateErrors((p) => ({ ...p, [key]: err }));
  };

  const onMoneyInput = (key, e) => {
    const raw = e.target.value ?? "";
    const digits = raw.replace(/\D/g, "");
    const next = { ...local };
    next[key] = digits ? Number(digits).toString() : "";
    setLocal(next);
    setMoneyDisplays((p) => ({ ...p, [key]: formatThousandsDot(digits) }));
  };

  const onMoneyBlur = (key) => {
    const next = { ...local };
    const digits = String(next[key] ?? "").replace(/\D/g, "");
    const numeric = digits ? Number(digits) : 0;
    next[key] = numeric ? numeric.toString() : "";
    setLocal(next);
    setMoneyDisplays((p) => ({ ...p, [key]: null }));
    emitUpdate(next);
  };

  const triggerSearch = () => {
    onUpdateModelValue?.({ ...local });
    onSearch?.();
  };

  const clearAll = () => {
    const reset = { ...local };
    filters.forEach((f) => {
      if (f?.preserveOnClear) reset[f.key] = local[f.key];
      else reset[f.key] = f.type === "text" || f.type === "time-hm" ? "" : null;
    });

    setLocal(reset);
    setMoneyDisplays({});
    setDateInputValues({});
    setDateErrors({});
    onUpdateModelValue?.({ ...reset });
    onClearFilters?.();
  };

  const getSortedItems = (filter) => {
    if (!Array.isArray(filter.items)) return [];
    if (filter.disableSort) return filter.items;

    const titleKey = filter.itemTitle || "title";

    return [...filter.items].sort((a, b) => {
      const aSort = a?.sortOrder ?? a?.sortorder;
      const bSort = b?.sortOrder ?? b?.sortorder;

      const aHasSort = aSort !== undefined && aSort !== null;
      const bHasSort = bSort !== undefined && bSort !== null;

      if (aHasSort && bHasSort) {
        if (aSort !== bSort) return Number(aSort) - Number(bSort);
      } else if (aHasSort) {
        return -1;
      } else if (bHasSort) {
        return 1;
      }

      const at = (a?.[titleKey] ?? "").toString().toLowerCase();
      const bt = (b?.[titleKey] ?? "").toString().toLowerCase();
      if (at < bt) return -1;
      if (at > bt) return 1;
      return 0;
    });
  };

  return (
    <div
      className={`flex flex-col sm:flex-row sm:flex-wrap xl:flex-nowrap items-stretch sm:items-end gap-3 ${classParent}`}>
      {normalizedFilters.map((f) => {
        const type = f.type ?? "select";

        if (type === "select") {
          const items = getSortedItems(f);
          const itemTitle = f.itemTitle || "title";
          const itemValue = f.itemValue || "value";

          const options = items.map((it) => ({
            value: it?.[itemValue],
            label: String(
              it?.[itemTitle] ?? it?.title ?? it?.label ?? it?.value ?? "",
            ),
            raw: it,
          }));

          const uiValue = f.returnObject
            ? (local[f.key]?.[itemValue] ?? local[f.key]?.value ?? null)
            : (local[f.key] ?? null);

          return (
            <div
              key={f.key}
              className="w-full sm:min-w-[180px] sm:max-w-[240px]">
              <Autocomplete
                label={!hideLabels ? f.label : undefined}
                floatingLabel={false}
                uiVariant={"gray"}
                options={options}
                value={uiValue}
                placeholder={f.placeholder || f.label || "Chọn..."}
                emptyText="Không có kết quả phù hợp"
                className="w-full"
                clearable={Boolean(f.clearable)}
                onChange={(val) => {
                  const selected = options.find(
                    (o) => String(o.value) === String(val),
                  );
                  const out = f.returnObject
                    ? (selected?.raw ?? null)
                    : val === undefined || val === null || val === ""
                      ? null
                      : val;
                  updateField(f.key, out, "select");
                }}
              />
            </div>
          );
        }

        if (type === "text") {
          return (
            <div
              key={f.key}
              className="w-full sm:min-w-[180px] sm:max-w-[240px]">
              <Textinput
                type="text"
                label={!hideLabels ? f.label : undefined}
                placeholder={f.placeholder || f.label}
                value={local[f.key] ?? ""}
                onChange={(e) => updateField(f.key, e.target.value, "text")}
              />
            </div>
          );
        }

        if (type === "number") {
          const display =
            moneyDisplays[f.key] ??
            formatThousandsDot(String(local[f.key] ?? ""));
          return (
            <div
              key={f.key}
              className="w-full sm:min-w-[180px] sm:max-w-[240px]">
              <Textinput
                type="text"
                label={!hideLabels ? f.label : undefined}
                placeholder={f.placeholder || f.label}
                value={display}
                inputMode="numeric"
                onChange={(e) => onMoneyInput(f.key, e)}
                onBlur={() => onMoneyBlur(f.key)}
                onKeyDown={(e) => {
                  if (e.ctrlKey || e.metaKey || e.altKey) return;
                  const allowed = [
                    "Backspace",
                    "Delete",
                    "ArrowLeft",
                    "ArrowRight",
                    "Tab",
                    "Home",
                    "End",
                  ];
                  if (allowed.includes(e.key)) return;
                  if (!/^\d$/.test(e.key)) e.preventDefault();
                }}
              />
            </div>
          );
        }

        if (type === "date") {
          const errMsg = dateErrors[f.key] || rangeErrors[f.key] || "";
          return (
            <div
              key={f.key}
              className="w-full sm:min-w-[180px] sm:max-w-[240px]">
              <Textinput
                type="date"
                datePicker
                label={!hideLabels ? f.label : undefined}
                value={local[f.key] ?? ""}
                onChange={(val) => onDateInput(f.key, val)}
                onBlur={(val) => onDateBlur(f.key, val)}
                min={getDateMinForKey(f.key)}
                max={getDateMaxForKey(f.key)}
                error={errMsg ? { message: errMsg } : null}
              />
            </div>
          );
        }

        return (
          <div key={f.key} className="text-danger-500 text-xs">
            Unsupported filter type: {String(type)}
          </div>
        );
      })}
      {buttonSearch && (
        <Button
          text={t?.("Filter") ?? "Filter"}
          className="btn-dark btn-sm w-full sm:w-auto"
          onClick={triggerSearch}
        />
      )}
      <div className="hidden sm:block sm:flex-1" />
      {!hideClearButton && (
        <Button
          text={t?.("clear_filters") || "Xóa lọc"}
          className="btn-outline-secondary text-slate-600 dark:border-slate-700 dark:text-slate-300 font-normal btn-sm w-full sm:w-auto"
          onClick={clearAll}
        />
      )}
    </div>
  );
}
