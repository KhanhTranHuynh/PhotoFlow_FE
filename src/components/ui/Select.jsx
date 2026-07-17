import React, { Fragment } from "react";
import Icon from "@/components/ui/Icon";
const Select = ({
  label,
  placeholder = "Select Option",
  classLabel = "form-label",
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
  msgTooltip,
  description,
  onChange,
  options,
  defaultValue,
  required,
  style,

  size,
  ...rest
}) => {
  options = options || Array(3).fill("option");
  const inputStyle = readonly
    ? { backgroundColor: "#D1D5DB", color: "#000000", ...style }
    : style;

  const normalizedPlaceholder =
    typeof placeholder === "string" ? placeholder.trim() : placeholder;

  const getOptionValue = (option) => {
    if (option && typeof option === "object" && "value" in option) {
      return option.value;
    }
    return option;
  };

  const getOptionLabel = (option) => {
    const rawLabel =
      option && typeof option === "object" && "label" in option
        ? option.label
        : option;
    return typeof rawLabel === "string" ? rawLabel.trim() : rawLabel;
  };

  return (
    <div
      className={`fromGroup  ${error ? "has-error" : ""}  ${
        horizontal ? "flex" : ""
      }  ${validate ? "is-valid" : ""} `}>
      {label && (
        <label
          htmlFor={id}
          className={`block capitalize ${classLabel}  ${
            horizontal ? " flex-0 mr-6 md:w-[100px] w-[60px] break-words" : ""
          } ${required ? "label-required" : ""} `}>
          {label}
        </label>
      )}
      <div className={`relative w-full ${horizontal ? "flex-1" : ""}`}>
        {name && (
          <select
            onChange={onChange}
            {...register(name)}
            {...rest}
            className={`${
              error ? " has-error" : " "
            } form-control py-2  appearance-none ${className}  `}
            placeholder={placeholder}
            readOnly={readonly}
            disabled={disabled}
            id={id}
            value={value}
            size={size}
            style={{ width: "100%", ...inputStyle }}
            defaultValue={defaultValue}>
            <option value="" disabled>
              {normalizedPlaceholder}
            </option>
            {options.map((option, i) => (
              <Fragment key={i}>
                <option key={i} value={getOptionValue(option)}>
                  {getOptionLabel(option)}
                </option>
              </Fragment>
            ))}
          </select>
        )}
        {!name && (
          <select
            onChange={onChange}
            className={`${
              error ? " has-error" : " "
            } form-control py-2 appearance-none ${className}  `}
            placeholder={placeholder}
            readOnly={readonly}
            disabled={disabled}
            id={id}
            value={value}
            size={size}
            style={{ width: "100%", ...inputStyle }}
            defaultValue={defaultValue}>
            <option value="" disabled>
              {normalizedPlaceholder}
            </option>
            {options.map((option, i) => (
              <Fragment key={i}>
                <option key={i} value={getOptionValue(option)}>
                  {getOptionLabel(option)}
                </option>
              </Fragment>
            ))}
          </select>
        )}

        {/* icon */}
        <div className="flex text-xl absolute ltr:right-[14px] rtl:left-[14px] top-1/2 -translate-y-1/2  space-x-1 rtl:space-x-reverse">
          <span className=" relative -right-2 inline-block text-slate-900 dark:text-slate-300 pointer-events-none">
            <Icon icon="heroicons:chevron-down" />
          </span>
          {error && (
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
      </div>
      {/* error and success message*/}
      {error && (
        <div
          className={` mt-2 ${
            msgTooltip
              ? " inline-block bg-danger-500 text-white text-[10px] px-2 py-1 rounded"
              : " text-danger-500 block text-sm"
          }`}>
          {error.message}
        </div>
      )}
      {/* validated and success message*/}
      {validate && (
        <div
          className={` mt-2 ${
            msgTooltip
              ? " inline-block bg-success-500 text-white text-[10px] px-2 py-1 rounded"
              : " text-success-500 block text-sm"
          }`}>
          {validate}
        </div>
      )}
      {/* only description */}
      {description && <span className="input-description">{description}</span>}
    </div>
  );
};

export default Select;
