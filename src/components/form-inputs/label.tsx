import { cn } from "../../lib/utils";

export interface LabelProps {
  title: string;
  className?: string;
  htmlFor?: string;
  required?: boolean;
  labelColor?: string;
  transform?: "capitalize" | "uppercase" | "lowercase";
  fontWeight?: "bold" | "normal";
}

export const Label = ({
  title,
  required,
  labelColor = "rgba(153, 153, 153, 1)",
  transform,
  fontWeight = "bold",
  className,
  htmlFor,
}: LabelProps) => {
  return (
    <div className={cn("flex items-center ", className)}>
      {required && (
        <span
          className={cn("font-bold leading-[0.5]")}
          style={{ color: "rgba(255, 0, 0, 1)" }}
        >
          *
        </span>
      )}
      <label
        className={cn("text-14 ", transform, `font-${fontWeight}`)}
        style={{ color: labelColor }}
        htmlFor={htmlFor}
      >
        {title}
      </label>
    </div>
  );
};
export default Label;
