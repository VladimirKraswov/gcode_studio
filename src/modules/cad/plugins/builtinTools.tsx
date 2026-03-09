import {
  FiCircle,
  FiGitCommit,
  FiMinus,
  FiMousePointer,
  FiPenTool,
  FiSquare,
  FiType,
} from "react-icons/fi";
import type { CadPlugin } from "./types";

export const builtinToolsPlugin: CadPlugin = {
  id: "builtin-tools",
  tools: [
    {
      id: "select",
      label: "Выбор",
      hint: "Выделение и перемещение",
      icon: <FiMousePointer size={14} />,
      order: 0,
    },
    {
      id: "rectangle",
      label: "Прямоугольник",
      hint: "Построить прямоугольник",
      icon: <FiSquare size={14} />,
      order: 10,
    },
    {
      id: "circle",
      label: "Окружность",
      hint: "Построить окружность",
      icon: <FiCircle size={14} />,
      order: 20,
    },
    {
      id: "line",
      label: "Линия",
      hint: "Построить линию",
      icon: <FiMinus size={14} />,
      order: 30,
    },
    {
      id: "arc",
      label: "Дуга",
      hint: "Дуга: центр → старт → конец",
      icon: <FiGitCommit size={14} />,
      order: 40,
    },
    {
      id: "polyline",
      label: "Ломаная",
      hint: "Построить ломаную",
      icon: <FiPenTool size={14} />,
      order: 50,
    },
    {
      id: "text",
      label: "Текст",
      hint: "Добавить текст",
      icon: <FiType size={14} />,
      order: 60,
    },
  ],
};