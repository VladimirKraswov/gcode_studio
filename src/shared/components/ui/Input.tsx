import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`ui-input ${error ? "border-danger" : ""} focus:ring-4 focus:ring-[var(--ring)] outline-none transition-all ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
