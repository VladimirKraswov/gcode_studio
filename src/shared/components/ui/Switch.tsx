import React from "react";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange, label, disabled }) => {
  return (
    <label className={`flex items-center gap-2.5 cursor-pointer select-none ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}>
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <div className={`block w-9 h-5 rounded-full transition-colors ${checked ? "bg-primary" : "bg-border-strong dark:bg-zinc-700"}`} />
        <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${checked ? "translate-x-4" : ""}`} />
      </div>
      {label && <span className="text-xs font-bold text-text-muted uppercase tracking-tight">{label}</span>}
    </label>
  );
};
