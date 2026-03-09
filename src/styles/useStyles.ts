// src/styles/useStyles.ts
import { useMemo } from 'react';
import type { CSSProperties } from 'react';
import { useTheme } from '../contexts/ThemeContext';

export function useStyles() {
  const { theme } = useTheme();

  return useMemo(() => ({
    appShell: {
      minHeight: "100vh",
      background: `radial-gradient(circle at top left, ${theme.primary}15, transparent 22%), linear-gradient(180deg, ${theme.app} 0%, ${theme.bgSoft} 100%)`,
      color: theme.text,
      fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
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
      overflowY: "auto",
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
      border: `1px solid ${theme.primaryText}`,
      background: `linear-gradient(180deg, ${theme.primary} 0%, ${theme.primaryText} 100%)`,
      color: "#fff",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      fontSize: 13,
      fontWeight: 700,
      cursor: "pointer",
      boxShadow: `0 10px 20px ${theme.primary}30`,
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
      border: `1px solid ${theme.danger}`,
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
      background: theme.panelSolid,  // было "#fff"
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
      background: theme.panelSolid,  // было "#fff"
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
      background: theme.panelSolid,
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
  }), [theme]);
}