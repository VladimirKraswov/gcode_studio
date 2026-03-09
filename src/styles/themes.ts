// src/styles/themes.ts
export const lightTheme = {
  bg: "#fcf8f3",       // очень светлый тёплый фон
  bgSoft: "#f5efe8",   // чуть насыщеннее
  app: "#f5efe8",
  panel: "rgba(255,255,255,0.92)",
  panelSolid: "#ffffff",
  panelMuted: "#faf1e7", // тёплый молочный
  border: "#e8dccc",    // тёплый светло-серый
  borderStrong: "#d6c9b8",
  text: "#2c2c2c",      // тёплый тёмно-серый
  textSoft: "#5a4f45",
  textMuted: "#8b7f72",
  primary: "#d97706",   // amber-600
  primarySoft: "#fef3c7", // amber-100
  primaryText: "#b45309", // amber-700
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
    canvasBg: "#fcf8f3",
    sheetFill: "rgba(255,255,255,0.86)",
    sheetStroke: "#d6c9b8",

    gridMinor: "#e8dccc",
    gridMajor: "#d6c9b8",
    ruler: "#d6c9b8",
    rulerTickMajor: "#8b7f72",
    rulerTickMinor: "#b3a693",
    rulerText: "#5a4f45",

    axisX: "#f87171",   // красный (оставим)
    axisY: "#d97706",   // amber-600
    axisText: "#2c2c2c",
    origin: "#f87171",
    originText: "#2c2c2c",

    shapeStroke: "#5a4f45",
    selectedStroke: "#d97706",

    selectionStroke: "#d97706",
    selectionFill: "rgba(217, 119, 6, 0.06)",
    selectionHoverFill: "rgba(217, 119, 6, 0.12)",
    selectionDragStroke: "#d97706",
    selectionDragFill: "rgba(245, 158, 11, 0.12)",

    draftStroke: "#d97706",
    draftFill: "rgba(217,119,6,0.12)",
    draftAccent: "#f87171",
    draftGuide: "#fdba74", // amber-300

    constraintStroke: "#2c2c2c",
    constraintMuted: "#b3a693",
    constraintSource: "#d97706",
    constraintTarget: "#5a4f45",
    constraintHandleX: "#d97706",
    constraintHandleY: "#fbbf24",
    constraintLabelFill: "#ffffff",
    constraintLabelStroke: "#d6c9b8",
    constraintLabelText: "#2c2c2c",

    constraintPreviewStroke: "#f59e0b",
    constraintPreviewFill: "#fff7ed",
    constraintPreviewBorder: "#fdba74",
    constraintPreviewText: "#9a3412",

    arrayPreviewStroke: "#d97706",
    arrayPreviewFill: "rgba(217,119,6,0.08)",
    arrayPreviewGuide: "rgba(217,119,6,0.35)",
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