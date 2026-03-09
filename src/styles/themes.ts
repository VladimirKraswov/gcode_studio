// src/styles/themes.ts
export const lightTheme = {
  bg: "#f8fafc",
  bgSoft: "#f1f5f9",
  app: "#f1f5f9",
  panel: "rgba(255,255,255,0.92)",
  panelSolid: "#ffffff",
  panelMuted: "#f8fafc",
  border: "#e2e8f0",
  borderStrong: "#cbd5e1",
  text: "#0f172a",
  textSoft: "#334155",
  textMuted: "#64748b",
  primary: "#3b82f6",
  primarySoft: "#dbeafe",
  primaryText: "#2563eb",
  success: "#10b981",
  successSoft: "#d1fae5",
  warning: "#f59e0b",
  warningSoft: "#fef3c7",
  danger: "#ef4444",
  dangerSoft: "#fee2e2",
  shadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.02)",
  shadowSoft: "0 4px 12px rgba(0, 0, 0, 0.03)",
  radius: {
    lg: 16,
    xl: 20,
    pill: 9999,
  },

  cad: {
    canvasBg: "#f8fafc",
    sheetFill: "rgba(255,255,255,0.86)",
    sheetStroke: "#cbd5e1",

    gridMinor: "#e2e8f0",
    gridMajor: "#cbd5e1",
    ruler: "#cbd5e1",
    rulerTickMajor: "#64748b",
    rulerTickMinor: "#94a3b8",
    rulerText: "#475569",

    axisX: "#ef4444",
    axisY: "#2563eb",
    axisText: "#0f172a",
    origin: "#ef4444",
    originText: "#0f172a",

    shapeStroke: "#475569",
    selectedStroke: "#1d4ed8",

    selectionStroke: "#2563eb",
    selectionFill: "rgba(37, 99, 235, 0.06)",
    selectionHoverFill: "rgba(37, 99, 235, 0.12)",
    selectionDragStroke: "#d97706",
    selectionDragFill: "rgba(245, 158, 11, 0.12)",

    draftStroke: "#2563eb",
    draftFill: "rgba(37,99,235,0.12)",
    draftAccent: "#ef4444",
    draftGuide: "#93c5fd",

    constraintStroke: "#0f172a",
    constraintMuted: "#94a3b8",
    constraintSource: "#1d4ed8",
    constraintTarget: "#475569",
    constraintHandleX: "#2563eb",
    constraintHandleY: "#7c3aed",
    constraintLabelFill: "#ffffff",
    constraintLabelStroke: "#cbd5e1",
    constraintLabelText: "#0f172a",

    constraintPreviewStroke: "#f59e0b",
    constraintPreviewFill: "#fff7ed",
    constraintPreviewBorder: "#fdba74",
    constraintPreviewText: "#9a3412",

    arrayPreviewStroke: "#22c55e",
    arrayPreviewFill: "rgba(34,197,94,0.08)",
    arrayPreviewGuide: "rgba(34,197,94,0.35)",
  },
};

export const darkTheme = {
  bg: "#1c1917", // warm dark background (stone-900)
  bgSoft: "#292524", // stone-800
  app: "#0c0a09", // stone-950
  panel: "rgba(41, 37, 36, 0.95)", // warm semi-transparent
  panelSolid: "#292524", // stone-800
  panelMuted: "#44403c", // stone-700
  border: "#44403c",
  borderStrong: "#57534e",
  text: "#f5f5f4",
  textSoft: "#d6d3d1",
  textMuted: "#a8a29e",
  primary: "#f59e0b", // amber-500
  primarySoft: "#7b341e", // warm brown
  primaryText: "#d97706", // amber-600
  success: "#10b981",
  successSoft: "#064e3b",
  warning: "#f59e0b",
  warningSoft: "#78350f",
  danger: "#ef4444",
  dangerSoft: "#7f1d1d",
  shadow: "0 20px 40px rgba(0, 0, 0, 0.6), 0 8px 18px rgba(0, 0, 0, 0.5)",
  shadowSoft: "0 8px 24px rgba(0, 0, 0, 0.5)",
  radius: {
    lg: 16,
    xl: 20,
    pill: 9999,
  },

  cad: {
    canvasBg: "#1c1917", // stone-900
    sheetFill: "rgba(28,25,23,0.72)",
    sheetStroke: "#57534e", // stone-600

    gridMinor: "#44403c", // stone-700
    gridMajor: "#57534e", // stone-600
    ruler: "#57534e",
    rulerTickMajor: "#a8a29e", // stone-400
    rulerTickMinor: "#78716c", // stone-500
    rulerText: "#d6d3d1", // stone-300

    axisX: "#f87171", // red-400
    axisY: "#fbbf24", // amber-400 (warm yellow)
    axisText: "#f5f5f4",
    origin: "#f87171",
    originText: "#f5f5f4",

    shapeStroke: "#d6d3d1", // stone-300
    selectedStroke: "#f59e0b", // amber-500

    selectionStroke: "#f59e0b", // amber-500
    selectionFill: "rgba(245, 158, 11, 0.10)",
    selectionHoverFill: "rgba(245, 158, 11, 0.16)",
    selectionDragStroke: "#d97706", // amber-600
    selectionDragFill: "rgba(217, 119, 6, 0.16)",

    draftStroke: "#f59e0b", // amber-500
    draftFill: "rgba(245,158,11,0.14)",
    draftAccent: "#f87171", // red-400
    draftGuide: "#fde68a", // amber-200

    constraintStroke: "#f5f5f4",
    constraintMuted: "#78716c", // stone-500
    constraintSource: "#f59e0b", // amber-500
    constraintTarget: "#a8a29e", // stone-400
    constraintHandleX: "#f59e0b", // amber-500
    constraintHandleY: "#fbbf24", // amber-400
    constraintLabelFill: "#292524", // stone-800
    constraintLabelStroke: "#57534e",
    constraintLabelText: "#f5f5f4",

    constraintPreviewStroke: "#d97706", // amber-600
    constraintPreviewFill: "#3f2a12",
    constraintPreviewBorder: "#b45309",
    constraintPreviewText: "#fdba74", // amber-300

    arrayPreviewStroke: "#f59e0b", // amber-500
    arrayPreviewFill: "rgba(245,158,11,0.12)",
    arrayPreviewGuide: "rgba(245,158,11,0.35)",
  },
};

export type Theme = typeof lightTheme;