import {
  FiArrowRight,
  FiArrowUp,
  FiMaximize,
  FiMinus,
  FiPause,
  FiPlusSquare,
  FiLock,
  FiMove,
  FiTarget,
  FiLayout,
} from "react-icons/fi";
import { IconButton } from "@/shared/components/ui/IconButton";
import type { SketchConstraintType } from "../model/types";

type QuickConstraintBarProps = {
  onAdd: (type: SketchConstraintType) => void;
};

export function QuickConstraintBar({ onAdd }: QuickConstraintBarProps) {
  return (
    <div className="flex gap-1 p-1 bg-panel border border-border rounded-lg shadow-md animate-in fade-in slide-in-from-bottom-2">
      <IconButton
        icon={<FiArrowRight size={14} />}
        onClick={() => onAdd("horizontal")}
        title="Горизонтально"
      />
      <IconButton
        icon={<FiArrowUp size={14} />}
        onClick={() => onAdd("vertical")}
        title="Вертикально"
      />
      <IconButton
        icon={<FiMaximize size={14} />}
        onClick={() => onAdd("distance")}
        title="Размер"
      />
      <IconButton
        icon={<FiPause size={14} className="rotate-90" />}
        onClick={() => onAdd("parallel")}
        title="Параллельно"
      />
      <IconButton
        icon={<FiPlusSquare size={14} />}
        onClick={() => onAdd("perpendicular")}
        title="Перпендикулярно"
      />
      <IconButton
        icon={<FiMinus size={14} />}
        onClick={() => onAdd("coincident")}
        title="Совпадение"
      />
      <IconButton
        icon={<FiTarget size={14} />}
        onClick={() => onAdd("equal")}
        title="Равенство"
      />
      <IconButton
        icon={<FiLayout size={14} />}
        onClick={() => onAdd("symmetric")}
        title="Симметрия"
      />
      <IconButton
        icon={<FiMove size={14} />}
        onClick={() => onAdd("tangent")}
        title="Касательная"
      />
      <IconButton
        icon={<FiLock size={14} />}
        onClick={() => onAdd("lock")}
        title="Закрепить"
      />
    </div>
  );
}
