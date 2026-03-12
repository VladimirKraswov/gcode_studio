import React from "react";

type IconButtonVariant = "ghost" | "primary" | "secondary" | "danger" | "success" | "outline";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: "xs" | "sm" | "md" | "lg";
  icon: React.ReactNode;
  active?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "ghost", size = "md", icon, active, className = "", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center shrink-0 rounded-md transition-all duration-200 ease-out transform-gpu hover:scale-125 hover:z-10 hover:shadow-xl active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";

    const sizeStyles = {
      xs: "h-6 w-6 text-[10px]",
      sm: "h-7 w-7 text-xs",
      md: "h-8 w-8 text-sm",
      lg: "h-10 w-10 text-base",
    };

    const variantStyles = {
      ghost: active
        ? "bg-primary-soft text-primary shadow-sm ring-1 ring-primary/20"
        : "text-text-muted hover:text-text hover:bg-panel-muted",
      primary: "bg-primary text-white hover:bg-primary/90 shadow-sm",
      secondary: "bg-panel-solid text-text border border-border hover:bg-panel-muted shadow-sm",
      outline: "bg-transparent text-text border border-border hover:border-text-muted hover:bg-panel-muted shadow-sm",
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
