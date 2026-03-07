import { ui } from "../styles/ui";

type StatCardProps = {
  label: string;
  value: string;
  mono?: boolean;
};

export function StatCard({ label, value, mono = false }: StatCardProps) {
  return (
    <div style={ui.statCard}>
      <div style={ui.statLabel}>{label}</div>
      <div
        style={{
          ...ui.statValue,
          fontFamily: mono
            ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
            : "inherit",
          wordBreak: "break-word",
        }}
      >
        {value}
      </div>
    </div>
  );
}