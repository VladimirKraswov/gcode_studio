import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, subtitle, children, className = "", ...props }) => {
  return (
    <div
      className={`ui-card-block min-w-0 p-3 rounded-[14px] border border-border bg-panel-solid ${className}`}
      {...props}
    >
      {title && (
        <div className="ui-card-block-title mb-2.5 text-[13px] font-extrabold text-text">
          {title}
        </div>
      )}
      {subtitle && (
        <div className="mb-2 text-xs text-text-muted">
          {subtitle}
        </div>
      )}
      {children}
    </div>
  );
};
