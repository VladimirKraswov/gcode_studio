import React from "react";

export interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({ min, max, step = 1, value, onChange, className = "" }) => {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary ${className}`}
    />
  );
};
