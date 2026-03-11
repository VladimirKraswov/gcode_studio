import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "xs" | "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "sm", icon, children, className = "", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-1.5 rounded-md font-bold cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap select-none";

    const variantStyles = {
      primary: "bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/10 border border-primary/20",
      secondary: "bg-panel-solid text-text border border-border hover:bg-panel-muted shadow-sm",
      ghost: "text-text-muted hover:text-text hover:bg-panel-muted",
      danger: "bg-danger text-white hover:bg-danger/90 shadow-sm shadow-danger/10",
      outline: "bg-transparent text-text border border-border hover:border-text-muted hover:bg-panel-muted",
    };

    const sizeStyles = {
      xs: "h-7 px-2 text-[11px]",
      sm: "h-8 px-3 text-[12px]",
      md: "h-9 px-4 text-[13px]",
      lg: "h-10 px-5 text-[14px]",
    };

    return (
      <button ref={ref} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
