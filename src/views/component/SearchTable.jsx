import React, { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";

const SearchBar = ({
  value: initialValue = "",
  placeholder = "Tìm kiếm nhân viên...",
  onSearch = () => {},
  onClear,
  clearable = true,
  className = "",
}) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue || "");
  }, [initialValue]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setValue(newValue);
    if (newValue.trim() === "") {
      onSearch("");
      onClear?.();
    }
  };

  const runSearch = () => onSearch(value.trim());

  const clearSearch = () => {
    setValue("");
    onSearch("");
    onClear?.();
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") runSearch();
  };

  return (
    <div
      className={`flex items-center rounded-full border border-slate-200 bg-white overflow-hidden ${className}`}>
      {/* Icon kính lúp */}
      <span className="pl-4 pr-2 text-slate-400 flex items-center">
        <Icon icon="heroicons-outline:search" className="text-lg" />
      </span>

      {/* Input */}
      <input
        type="text"
        value={value || ""}
        onChange={handleChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none border-none py-3 pr-3 text-slate-600 placeholder:text-slate-400"
      />

      {/* Nút clear (chỉ hiện khi có text) */}
      {clearable && value && (
        <button
          type="button"
          aria-label="Xoa tim kiem"
          className="pr-3 text-slate-400 hover:text-slate-700 flex items-center"
          onClick={clearSearch}>
          <Icon icon="heroicons-outline:x" />
        </button>
      )}

      {/* Nút Go - viền đen, nền trắng, dính sát bên phải */}
      <button
        type="button"
        onClick={runSearch}
        className="border-l border-slate-200 bg-white text-slate-500 font-semibold px-8 py-3 hover:bg-slate-50 active:scale-[0.98] transition-all flex-shrink-0">
        Go
      </button>
    </div>
  );
};

export default SearchBar;
