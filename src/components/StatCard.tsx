import { useStyles } from "../styles/useStyles";

type StatCardProps = {
  label: string;
  value: string;
  mono?: boolean;
};

export function StatCard({ label, value, mono = false }: StatCardProps) {
  const styles = useStyles();

  return (
    <div style={styles.statCard}>
      <div style={styles.statLabel}>{label}</div>
      <div
        style={{
          ...styles.statValue,
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