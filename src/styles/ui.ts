import type { CSSProperties } from "react";

export const theme = {
  bg: "#0b1220",
  bgSoft: "#111827",
  app: "#f3f6fb",
  panel: "rgba(255,255,255,0.88)",
  panelSolid: "#ffffff",
  panelMuted: "#f8fafc",
  border: "#dbe4ee",
  borderStrong: "#c7d2e0",
  text: "#0f172a",
  textSoft: "#475569",
  textMuted: "#64748b",
  primary: "#2563eb",
  primarySoft: "#dbeafe",
  primaryText: "#1d4ed8",
  success: "#16a34a",
  warning: "#d97706",
  danger: "#e11d48",
  dangerSoft: "#fff1f2",
  shadow:
    "0 20px 40px rgba(15, 23, 42, 0.08), 0 8px 18px rgba(15, 23, 42, 0.05)",
  shadowSoft: "0 8px 24px rgba(15, 23, 42, 0.06)",
  radius: {
    lg: 18,
    xl: 22,
    pill: 999,
  },
};

export const ui = {
  appShell: {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(37,99,235,0.08), transparent 22%), linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%)",
    color: theme.text,
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  } satisfies CSSProperties,

  page: {
    height: "100vh",
    padding: 20,
    boxSizing: "border-box",
  } satisfies CSSProperties,

  pageGrid: {
    height: "100%",
    display: "grid",
    gridTemplateColumns: "320px minmax(0, 1fr) 320px",
    gap: 20,
    minHeight: 0,
    maxWidth: 1880,
    margin: "0 auto",
  } satisfies CSSProperties,

  column: {
    minHeight: 0,
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  } satisfies CSSProperties,

  panel: {
    background: theme.panel,
    backdropFilter: "blur(14px)",
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius.xl,
    boxShadow: theme.shadow,
  } satisfies CSSProperties,

  panelInset: {
    background: theme.panelMuted,
    border: `1px solid ${theme.border}`,
    borderRadius: theme.radius.lg,
  } satisfies CSSProperties,

  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  } satisfies CSSProperties,

  sectionTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
    color: theme.text,
  } satisfies CSSProperties,

  sectionSubtle: {
    fontSize: 12,
    color: theme.textMuted,
    marginTop: 4,
  } satisfies CSSProperties,

  button: {
    height: 40,
    padding: "0 14px",
    borderRadius: 12,
    border: `1px solid ${theme.borderStrong}`,
    background: "#fff",
    color: theme.text,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  } satisfies CSSProperties,

  buttonPrimary: {
    height: 40,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #1d4ed8",
    background: "linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)",
    color: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(37, 99, 235, 0.22)",
  } satisfies CSSProperties,

  buttonGhost: {
    height: 38,
    padding: "0 12px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    background: theme.panelMuted,
    color: theme.text,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  } satisfies CSSProperties,

  buttonDanger: {
    height: 40,
    padding: "0 14px",
    borderRadius: 12,
    border: "1px solid #fecdd3",
    background: theme.dangerSoft,
    color: theme.danger,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
  } satisfies CSSProperties,

  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    display: "grid",
    placeItems: "center",
    background: theme.primarySoft,
    color: theme.primaryText,
    flexShrink: 0,
  } satisfies CSSProperties,

  input: {
    width: "100%",
    height: 40,
    borderRadius: 12,
    border: `1px solid ${theme.borderStrong}`,
    background: "#fff",
    color: theme.text,
    padding: "0 12px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  } satisfies CSSProperties,

  select: {
    width: "100%",
    height: 40,
    borderRadius: 12,
    border: `1px solid ${theme.borderStrong}`,
    background: "#fff",
    color: theme.text,
    padding: "0 12px",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  } satisfies CSSProperties,

  inputLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 12,
    fontWeight: 600,
    color: theme.textSoft,
  } satisfies CSSProperties,

  statCard: {
    background: "#fff",
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 14,
    boxShadow: theme.shadowSoft,
  } satisfies CSSProperties,

  statLabel: {
    fontSize: 12,
    color: theme.textMuted,
    marginBottom: 6,
  } satisfies CSSProperties,

  statValue: {
    fontSize: 17,
    fontWeight: 800,
    color: theme.text,
    lineHeight: 1.25,
  } satisfies CSSProperties,

  mutedText: {
    fontSize: 12,
    color: theme.textMuted,
  } satisfies CSSProperties,
};

export function mergeStyles(
  ...styles: Array<CSSProperties | undefined>
): CSSProperties {
  return Object.assign({}, ...styles);
}