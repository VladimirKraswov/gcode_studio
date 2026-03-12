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
import { useCallback } from "react";
import { IconButton } from "@/shared/components/ui/IconButton";
import type { SketchConstraintType } from "../model/types";
import { useUI } from "@/contexts/UIContext";

type QuickConstraintBarProps = {
  onAdd: (type: SketchConstraintType) => void;
};

export function QuickConstraintBar({ onAdd }: QuickConstraintBarProps) {
  const { setHint } = useUI();

  const handleMouseEnter = useCallback((hint: string) => {
    setHint(hint);
  }, [setHint]);

  const handleMouseLeave = useCallback(() => {
    setHint("");
  }, [setHint]);

  return (
    <div className="flex gap-1 p-1 bg-panel border border-border rounded-lg shadow-md animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
      <IconButton
        icon={<FiArrowRight size={14} />}
        onClick={() => onAdd("horizontal")}
        title="Горизонтально"
        onMouseEnter={() => handleMouseEnter("Ограничение: Горизонтально")}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiArrowUp size={14} />}
        onClick={() => onAdd("vertical")}
        title="Вертикально"
        onMouseEnter={() => handleMouseEnter("Ограничение: Вертикально")}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiMaximize size={14} />}
        onClick={() => onAdd("distance")}
        title="Размер"
        onMouseEnter={() => handleMouseEnter("Ограничение: Размер")}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiPause size={14} className="rotate-90" />}
        onClick={() => onAdd("parallel")}
        title="Параллельно"
        onMouseEnter={() => handleMouseEnter("Ограничение: Параллельно")}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiPlusSquare size={14} />}
        onClick={() => onAdd("perpendicular")}
        title="Перпендикулярно"
        onMouseEnter={() => handleMouseEnter("Ограничение: Перпендикулярно")}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiMinus size={14} />}
        onClick={() => onAdd("coincident")}
        title="Совпадение"
        onMouseEnter={() => handleMouseEnter("Ограничение: Совпадение")}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiTarget size={14} />}
        onClick={() => onAdd("equal")}
        title="Равенство"
        onMouseEnter={() => handleMouseEnter("Ограничение: Равенство")}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiLayout size={14} />}
        onClick={() => onAdd("symmetric")}
        title="Симметрия"
        onMouseEnter={() => handleMouseEnter("Ограничение: Симметрия")}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiMove size={14} />}
        onClick={() => onAdd("tangent")}
        title="Касательная"
        onMouseEnter={() => handleMouseEnter("Ограничение: Касательная")}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiLock size={14} />}
        onClick={() => onAdd("lock")}
        title="Закрепить"
        onMouseEnter={() => handleMouseEnter("Ограничение: Закрепить")}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
