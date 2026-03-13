import {
  FiCircle,
  FiGitCommit,
  FiMinus,
  FiMousePointer,
  FiPenTool,
  FiSquare,
  FiType,
} from "react-icons/fi";
import i18next from "i18next";
import type { CadPlugin } from "./types";

export const builtinToolsPlugin: CadPlugin = {
  id: "builtin-tools",
  tools: [
    {
      id: "select",
      get label() { return i18next.t("cad.tools.select"); },
      get hint() { return i18next.t("cad.tools.select_hint"); },
      icon: <FiMousePointer size={14} />,
      order: 0,
    },
    {
      id: "rectangle",
      get label() { return i18next.t("cad.tools.rectangle"); },
      get hint() { return i18next.t("cad.tools.rectangle_hint"); },
      icon: <FiSquare size={14} />,
      order: 10,
    },
    {
      id: "circle",
      get label() { return i18next.t("cad.tools.circle"); },
      get hint() { return i18next.t("cad.tools.circle_hint"); },
      icon: <FiCircle size={14} />,
      order: 20,
    },
    {
      id: "line",
      get label() { return i18next.t("cad.tools.line"); },
      get hint() { return i18next.t("cad.tools.line_hint"); },
      icon: <FiMinus size={14} />,
      order: 30,
    },
    {
      id: "arc",
      get label() { return i18next.t("cad.tools.arc"); },
      get hint() { return i18next.t("cad.tools.arc_hint"); },
      icon: <FiGitCommit size={14} />,
      order: 40,
    },
    {
      id: "polyline",
      get label() { return i18next.t("cad.tools.polyline"); },
      get hint() { return i18next.t("cad.tools.polyline_hint"); },
      icon: <FiPenTool size={14} />,
      order: 50,
    },
    {
      id: "text",
      get label() { return i18next.t("cad.tools.text"); },
      get hint() { return i18next.t("cad.tools.text_hint"); },
      icon: <FiType size={14} />,
      order: 60,
    },
  ],
};