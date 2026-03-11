import React from "react";

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  value: string;
}

export const Slider: React.FC<SliderProps> = ({ label, value, className = "", ...props }) => {
  return (
    <div className="ui-panel-inset mb-2.5 p-3 bg-panel-muted border border-border rounded-lg">
      <div className="mb-2 flex justify-between gap-3">
        <span className="text-[13px] font-bold text-text">
          {label}
        </span>
        <span className="text-[13px] font-extrabold text-primary-text">
          {value}
        </span>
      </div>

      <input
        type="range"
        className={`w-full ${className}`}
        {...props}
      />
    </div>
  );
};
