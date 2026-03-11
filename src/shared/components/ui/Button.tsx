import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "secondary",
      size = "md",
      icon,
      children,
      className = "",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-150 " +
      "disabled:opacity-50 disabled:cursor-not-allowed " +
      "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

    const variantStyles = {
      primary:
        "border border-[var(--color-primary-text)] bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-primary-text)_100%)] text-white shadow-[0_10px_20px_color-mix(in_srgb,var(--color-primary)_30%,transparent)]",
      secondary:
        "border border-[var(--color-border-strong)] bg-[var(--color-panel-solid)] text-[var(--color-text)] hover:bg-[var(--color-panel-muted)]",
      ghost:
        "border border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-text)] hover:opacity-90",
      danger:
        "border border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)] hover:opacity-90",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-[12px]",
      md: "h-10 px-3.5 text-[13px]",
      lg: "h-12 px-5 text-[15px]",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";