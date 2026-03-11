import React from "react";

type IconButtonVariant = "ghost" | "primary" | "secondary" | "danger" | "success";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: "sm" | "md" | "lg";
  icon: React.ReactNode;
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = "ghost",
      size = "md",
      icon,
      active = false,
      className = "",
      type = "button",
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center shrink-0 rounded-lg border transition-all duration-150 " +
      "disabled:opacity-40 disabled:cursor-not-allowed " +
      "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";

    const sizeStyles = {
      sm: "h-8 w-8 text-xs",
      md: "h-[34px] w-[34px] text-sm",
      lg: "h-10 w-10 text-base",
    };

    const variantStyles = {
      ghost: active
        ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]"
        : "border-[var(--color-border)] bg-[var(--color-panel-solid)] text-[var(--color-text-muted)] hover:bg-[var(--color-panel-muted)] hover:text-[var(--color-text)]",
      primary:
        "border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-text)]",
      secondary:
        "border-[var(--color-border)] bg-[var(--color-panel-solid)] text-[var(--color-text)] hover:bg-[var(--color-panel-muted)]",
      danger:
        "border-[var(--color-danger)] bg-transparent text-[var(--color-danger)] hover:bg-[var(--color-danger-soft)]",
      success:
        "border-[var(--color-success)] bg-transparent text-[var(--color-success)] hover:bg-[var(--color-success-soft)]",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";