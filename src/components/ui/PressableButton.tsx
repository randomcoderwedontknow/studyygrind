import type { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
};

export function PressableButton({ children, variant = "primary", className = "", ...rest }: Props) {
  const extra = variant === "ghost" ? "ghost" : variant === "danger" ? "danger" : "";
  return (
    <button type="button" className={`pressable ${extra} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
