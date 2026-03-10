type StatCardProps = {
  label: string;
  value: string;
  mono?: boolean;
};

export function StatCard({ label, value, mono = false }: StatCardProps) {
  return (
    <div className="ui-stat-card">
      <div className="mb-1.5 text-xs text-[var(--color-text-muted)]">{label}</div>
      <div
        className={[
          "break-words text-[17px] leading-[1.25] font-extrabold text-[var(--color-text)]",
          mono ? "font-mono" : "",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}