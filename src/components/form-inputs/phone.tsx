import { cn } from "../../lib/utils";
import { PhoneInput as InternationalPhoneInput } from "react-international-phone";

import "react-international-phone/style.css";

import type { InputProps } from "./text";
import Label from "./label";

export interface PhoneInputProps extends Omit<
  InputProps,
  "onChange" | "type" | "onBlur"
> {
  onBlur?: (value: string) => void;
  onChange?: (value: string) => void;
  countryCodeEditable?: boolean;
  useDefaultSytles?: boolean;
  isValid?: (value: string, country: object) => boolean;
  helperText?: string;
}

export const PhoneInput = ({
  labelTitle,
  required,
  value,
  onBlur,
  onChange,
  placeholder,
  error,
  labelColor,
  countryCodeEditable,
  disabled,
  readOnly,
  helperText,
}: PhoneInputProps) => {
  return (
    <div className="w-full flex flex-col gap-1">
      {labelTitle && (
        <Label title={labelTitle} required={required} labelColor={labelColor} />
      )}
      <InternationalPhoneInput
        value={value ?? ""}
        onChange={(phone) => onChange?.(phone)}
        onBlur={(e) => onBlur?.(e.target.value)}
        defaultCountry="rw"
        defaultMask="... ... ..."
        placeholder={placeholder}
        forceDialCode={!countryCodeEditable}
        disabled={disabled}
        inputProps={readOnly ? { readOnly: true } : undefined}
        className={cn("w-full", error && "[&_input]:border-red-500!")}
        inputStyle={{ width: "100%", height: "40px" }}
        countrySelectorStyleProps={{ buttonStyle: { height: "40px" } }}
      />
      {helperText && (
        <span className="text-sm text-gray-500">{helperText}</span>
      )}
      {error && <span className="text-red-500">{error}</span>}
    </div>
  );
};
export default PhoneInput;
