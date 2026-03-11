import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "secondary", size = "md", icon, children, className = "", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl font-bold cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed";

    const variantStyles = {
      primary: "ui-btn-primary text-white border-primary-text",
      secondary: "ui-btn border-border-strong bg-panel-solid text-text",
      ghost: "ui-btn-ghost border-border bg-panel-muted text-text",
      danger: "ui-btn-danger border-danger bg-danger-soft text-danger",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-[12px]",
      md: "h-10 px-3.5 text-[13px]",
      lg: "h-12 px-5 text-[15px]",
    };

    const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    return (
      <button ref={ref} className={combinedClassName} {...props}>
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
