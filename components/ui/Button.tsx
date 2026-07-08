import { type ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const base =
  "inline-flex min-h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-azure-600 text-white hover:bg-azure-700",
  secondary:
    "border border-azure-200 bg-surface text-azure-700 hover:bg-azure-50",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
