import React from "react";

type BadgeVariant = "primary" | "success" | "warning" | "danger" | "ghost" | "info" | "purple";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "primary", icon, children, className = "", ...props }) => {
  const variantStyles = {
    primary: "bg-primary-soft text-primary-text border-transparent",
    success: "bg-success-soft text-success border-transparent",
    warning: "bg-warning-soft text-warning border-transparent",
    danger: "bg-danger-soft text-danger border-transparent",
    ghost: "bg-panel-muted text-text-muted border border-border",
    info: "bg-cyan-100 text-cyan-800 border-cyan-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
  };

  const isIconOnly = !children && icon;

  return (
    <div
      className={`inline-flex items-center justify-center rounded-md border text-[10px] font-bold px-1.5 py-0.5 ${variantStyles[variant]} ${isIconOnly ? 'p-1' : ''} ${className}`}
      {...props}
    >
      {icon && <span className={children ? "mr-1" : ""}>{icon}</span>}
      {children}
    </div>
  );
};
