// src/styles/editorThemes.ts
import { EditorView } from "@codemirror/view";

export const lightEditorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      width: "100%",
      fontSize: "13px",
      color: "#0f172a", // slate-900
      backgroundColor: "#fef9e7", // очень светлый бежевый
    },

    ".cm-editor": {
      height: "100%",
      backgroundColor: "#fef9e7",
    },

    ".cm-scroller": {
      backgroundColor: "#fef9e7",
      color: "#0f172a",
      fontFamily: "monospace",
    },

    ".cm-content": {
      caretColor: "#d97706", // amber-600
    },

    ".cm-gutters": {
      backgroundColor: "#f5e9d8", // чуть темнее фона
      color: "#57534e", // stone-600
      borderRight: "1px solid #e2d6c0",
    },

    ".cm-activeLine": {
      backgroundColor: "#fae9ce", // light amber
    },

    ".cm-activeLineGutter": {
      backgroundColor: "#f2d9b0",
      color: "#0f172a",
    },

    ".cm-cursor": {
      borderLeftColor: "#d97706",
    },

    ".cm-selectionBackground, ::selection": {
      backgroundColor: "#fcd9a8", // light orange
    },
  },
  { dark: false }
);

export const darkEditorTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      width: "100%",
      fontSize: "13px",
      color: "#f5f5f4", // stone-100
      backgroundColor: "#292524", // stone-800
    },

    ".cm-editor": {
      height: "100%",
      backgroundColor: "#292524",
    },

    ".cm-scroller": {
      backgroundColor: "#292524",
      color: "#f5f5f4",
      fontFamily: "monospace",
    },

    ".cm-content": {
      caretColor: "#f59e0b", // amber-500
    },

    ".cm-gutters": {
      backgroundColor: "#44403c", // stone-700
      color: "#a8a29e", // stone-400
      borderRight: "1px solid #57534e", // stone-600
    },

    ".cm-activeLine": {
      backgroundColor: "rgba(245, 158, 11, 0.15)",
    },

    ".cm-activeLineGutter": {
      backgroundColor: "rgba(245, 158, 11, 0.2)",
      color: "#f5f5f4",
    },

    ".cm-cursor": {
      borderLeftColor: "#f59e0b",
    },

    ".cm-selectionBackground, ::selection": {
      backgroundColor: "rgba(245, 158, 11, 0.3)",
    },
  },
  { dark: true }
);