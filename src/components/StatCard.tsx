type StatCardProps = {
  label: string;
  value: string;
  mono?: boolean;
};

export function StatCard({ label, value, mono = false }: StatCardProps) {
  return (
    <div style={{ background: "#f1f5f9", borderRadius: 12, padding: 12 }}>
      <div style={{ color: "#64748b", fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 600,
          fontFamily: mono ? "monospace" : "inherit",
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}