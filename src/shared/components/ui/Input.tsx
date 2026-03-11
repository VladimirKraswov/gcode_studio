import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex w-full h-8 px-2.5 text-[12px] font-medium rounded-md border bg-panel-solid text-text border-border shadow-sm focus:border-primary/50 focus:ring-2 focus:ring-primary/10 outline-none transition-all placeholder:text-text-muted/50 disabled:bg-panel-muted disabled:text-text-muted ${error ? "border-danger ring-danger/10" : ""} ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";
