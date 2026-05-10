import { Select, type SelectProps } from "antd";
import { cn } from "../../lib/utils";
import React from "react";

import styles from "./Form.module.scss";
import type { InputProps } from "./text";
import Label from "./label";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectInputProps extends Omit<
  InputProps,
  "value" | "type" | "name" | "onChange"
> {
  options: SelectOption[];
  value?: string | string[] | SelectOption | SelectOption[] | undefined;
  onChange?: (
    option: SelectOption,
    value?: string | string[] | SelectOption | SelectOption[],
  ) => void;
  dropdownRender?: React.ReactNode;
  loading?: boolean;
  mode?: "multiple" | "tags";
  fixedHeight?: boolean;
  selectClassName?: string;
  wrapperClassName?: string;
  allowClear?: boolean;
  showSearch?: boolean;
  onSearch?: (value: string) => void;
  size?: "large" | "middle" | "small";
  helperText?: string;
  onPopupScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  listHeight?: number;
  optionRender?: SelectProps["optionRender"];
}

export const SelectInput = ({
  placeholder,
  onChange,
  onBlur,
  labelTitle,
  required,
  error,
  options,
  value,
  dropdownRender,
  loading,
  mode,
  fixedHeight = true,
  selectClassName,
  wrapperClassName,
  allowClear = true,
  showSearch,
  onSearch,
  labelColor,
  size = "large",
  transform,
  disabled,
  helperText,
  onPopupScroll,
  listHeight,
  optionRender,
}: SelectInputProps) => {
  const dropdownRenderFunc = (menu: React.ReactElement<unknown>) => {
    return (
      <>
        {menu}
        {dropdownRender}
      </>
    );
  };
  return (
    <div
      className={cn(
        styles.selectInputWrapper,
        "flex flex-col",
        wrapperClassName ?? "",
      )}
    >
      {labelTitle && (
        <Label
          title={labelTitle}
          required={required}
          labelColor={labelColor}
          transform={transform}
        />
      )}
      <Select
        options={options.map((item) => ({
          ...item,
          label: item.label,
        }))}
        size={size}
        onBlur={onBlur}
        placeholder={placeholder}
        value={value ? value : undefined}
        onChange={(value, opt) => onChange?.(opt as SelectOption, value)}
        className={cn(
          styles.selectInput,
          {
            [styles.fixedHeight]: fixedHeight,
          },
          !fixedHeight ? styles.autoHeight : undefined,
          selectClassName,
        )}
        status={error && "error"}
        allowClear={allowClear}
        mode={mode}
        popupRender={
          dropdownRender ? (menu) => dropdownRenderFunc(menu) : undefined
        }
        loading={loading}
        onSearch={onSearch}
        showSearch={showSearch}
        onPopupScroll={onPopupScroll}
        listHeight={listHeight}
        optionRender={optionRender}
        // When onSearch is provided (API search), disable local filtering
        // When showSearch is true without onSearch, enable local filtering
        filterOption={
          showSearch && !onSearch
            ? (input, option) =>
                (option?.label ?? "")
                  .toString()
                  .toLowerCase()
                  .includes(input.toLowerCase())
            : false
        }
        disabled={disabled}
      />
      {helperText && <p className="text-xs text-gray-400 mt-1">{helperText}</p>}
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
};
export default SelectInput;
