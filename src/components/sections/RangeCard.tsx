import { theme, ui } from "../../styles/ui";

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
    <div
      style={{
        ...ui.panelInset,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700 }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: theme.primaryText }}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}