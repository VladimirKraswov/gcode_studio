import React from "react";

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

export const Label: React.FC<LabelProps> = ({ children, className = "", ...props }) => {
  return (
    <label className={`ui-label flex flex-col gap-1.5 text-xs font-semibold text-text-soft ${className}`} {...props}>
      {children}
    </label>
  );
};
