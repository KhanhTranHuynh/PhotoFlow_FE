import React, { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Textinput from "@/components/ui/Textinput";
import Icon from "@/components/ui/Icon";

const SearchBar = ({
  value: initialValue = "",
  placeholder = "Tìm kiếm theo tên, username hoặc email...",
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
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-1">
        <Textinput
          value={value || ""}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={clearable ? "pr-9" : ""}
        />

        {clearable && value && (
          <button
            type="button"
            aria-label="Xoa tim kiem"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
            onClick={clearSearch}>
            <Icon icon="heroicons-outline:x" />
          </button>
        )}
      </div>

      {/* Desktop: button đầy đủ với text + icon */}
      <Button
        onClick={runSearch}
        icon="heroicons-outline:search"
        text="Tìm kiếm"
        className="btn-primary bg-primary-800 btn-sm hidden sm:inline-flex"
      />

      {/* Mobile: chỉ hiện icon search, không có text */}
      <button
        type="button"
        aria-label="Tìm kiếm"
        onClick={runSearch}
        className="sm:hidden flex items-center justify-center w-10 h-10 rounded-md bg-primary-800 text-white hover:bg-primary-700 active:scale-95 transition-all flex-shrink-0">
        <Icon icon="heroicons-outline:search" />
      </button>
    </div>
  );
};

export default SearchBar;
