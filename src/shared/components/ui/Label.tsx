import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ children, className = "", ...props }) => {
  return (
    <label className={`text-[11px] font-bold text-text-muted uppercase tracking-wider select-none ${className}`} {...props}>
      {children}
    </label>
  );
};
