import React from "react";

type IconButtonVariant = "ghost" | "primary" | "secondary" | "danger" | "success";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: "sm" | "md" | "lg";
  icon: React.ReactNode;
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "md", icon, active, className = "", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center shrink-0 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed";

    const sizeStyles = {
      sm: "h-8 w-8 text-xs",
      md: "h-[34px] w-[34px] text-sm",
      lg: "h-10 w-10 text-base",
    };

    const variantStyles = {
      ghost: active
        ? "bg-primary-soft text-primary-text border border-primary/20"
        : "text-text-muted hover:text-text hover:bg-panel-muted",
      primary: "bg-primary text-white hover:bg-primary-text",
      secondary: "bg-panel-solid text-text border border-border hover:bg-panel-muted",
      danger: "text-danger hover:bg-danger-soft",
      success: "text-success hover:bg-success-soft",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
