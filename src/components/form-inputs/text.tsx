import { Icon } from "@iconify/react";
import { Input } from "antd";
import { cn } from "../../lib/utils";
import React from "react";

import styles from "./Form.module.scss";
import Label, { type LabelProps } from "./label";

export interface InputProps extends Omit<LabelProps, "title"> {
  labelTitle?: string;
  type: "text" | "url" | "email" | "password" | "number";
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  error?: string;
  placeholder?: string;
  name?: string;
  disabled?: boolean;
  prefixIconName?: string;
  suffixIconName?: string;
  readOnly?: boolean;
  helperText?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  className?: string;
}

export const CustomInput = ({
  required,
  labelTitle,
  value,
  onChange,
  onBlur,
  placeholder,
  type,
  name,
  error,
  disabled,
  prefixIconName,
  suffixIconName,
  labelColor,
  transform,
  readOnly,
  helperText,
  onKeyDown,
  className,
}: InputProps) => {
  return (
    <div className={cn("w-full flex flex-col")}>
      {labelTitle && (
        <Label
          title={labelTitle}
          required={required}
          labelColor={labelColor}
          transform={transform}
        />
      )}
      <Input
        type={type || "text"}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={cn(styles.input, className)}
        name={name}
        status={error && "error"}
        disabled={disabled}
        readOnly={readOnly}
        id={name}
        size="large"
        prefix={
          prefixIconName ? (
            <Icon icon={prefixIconName} color="rgba(0, 0, 0, 0.3)" />
          ) : undefined
        }
        suffix={
          suffixIconName ? (
            <Icon icon={suffixIconName} color="rgba(0, 0, 0, 0.3)" />
          ) : undefined
        }
      />
      {helperText && <p className="text-xs text-gray-400 mt-1">{helperText}</p>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};
export default CustomInput;
