import type { ChangeEvent } from "react";

type RangeCardProps = {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  onChange: (value: number) => void;
};

export function RangeCard({
  label,
  value,
  min,
  max,
  step,
  current,
  onChange,
}: RangeCardProps) {
  return (
    <div className="ui-panel-inset mb-2.5 p-3">
      <div className="mb-2 flex justify-between gap-3">
        <span className="text-[13px] font-bold text-[var(--color-text)]">
          {label}
        </span>
        <span className="text-[13px] font-extrabold text-[var(--color-primary-text)]">
          {value}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(Number(e.target.value))
        }
        className="w-full"
      />
    </div>
  );
}