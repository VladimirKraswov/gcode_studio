import React from "react";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "ghost";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "primary",
  icon,
  children,
  size = "md",
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border font-bold";

  const sizeStyles = {
    sm: "min-h-6 px-2 text-[11px]",
    md: "min-h-7 px-2.5 text-xs",
  };

  const variantStyles = {
    primary:
      "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text)]",
    success:
      "border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]",
    warning:
      "border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]",
    danger:
      "border-[var(--color-danger)] bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
    ghost:
      "border-[var(--color-border)] bg-[var(--color-panel-muted)] text-[var(--color-text-muted)]",
  };

  return (
    <div
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </div>
  );
};