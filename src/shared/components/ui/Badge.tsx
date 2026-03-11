import React from "react";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "ghost";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "primary", icon, children, className = "", ...props }) => {
  const variantStyles = {
    primary: "bg-primary-soft text-primary-text",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    ghost: "bg-panel-muted text-text-muted border border-border",
  };

  return (
    <div
      className={`ui-icon-badge h-10 w-10 shrink-0 grid place-items-center rounded-[14px] ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {icon ? icon : children}
    </div>
  );
};
