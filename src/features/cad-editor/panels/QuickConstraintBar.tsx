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
import { useTranslation } from "react-i18next";
import { IconButton } from "@/shared/components/ui/IconButton";
import type { SketchConstraintType } from "../model/types";
import { useUI } from "@/contexts/UIContext";

type QuickConstraintBarProps = {
  onAdd: (type: SketchConstraintType) => void;
};

export function QuickConstraintBar({ onAdd }: QuickConstraintBarProps) {
  const { t } = useTranslation();
  const { setHint } = useUI();

  const handleMouseEnter = useCallback((hint: string) => {
    setHint(`${t("cad.constraints.hint_prefix")}${hint}`);
  }, [setHint, t]);

  const handleMouseLeave = useCallback(() => {
    setHint("");
  }, [setHint]);

  return (
    <div className="flex gap-1 p-1 bg-panel border border-border rounded-lg shadow-md animate-in fade-in slide-in-from-bottom-2 pointer-events-auto">
      <IconButton
        icon={<FiArrowRight size={14} />}
        onClick={() => onAdd("horizontal")}
        title={t("cad.constraints.horizontal")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.horizontal"))}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiArrowUp size={14} />}
        onClick={() => onAdd("vertical")}
        title={t("cad.constraints.vertical")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.vertical"))}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiMaximize size={14} />}
        onClick={() => onAdd("distance")}
        title={t("cad.constraints.distance")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.distance"))}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiPause size={14} className="rotate-90" />}
        onClick={() => onAdd("parallel")}
        title={t("cad.constraints.parallel")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.parallel"))}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiPlusSquare size={14} />}
        onClick={() => onAdd("perpendicular")}
        title={t("cad.constraints.perpendicular")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.perpendicular"))}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiMinus size={14} />}
        onClick={() => onAdd("coincident")}
        title={t("cad.constraints.coincident")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.coincident"))}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiTarget size={14} />}
        onClick={() => onAdd("equal")}
        title={t("cad.constraints.equal")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.equal"))}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiLayout size={14} />}
        onClick={() => onAdd("symmetric")}
        title={t("cad.constraints.symmetric")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.symmetric"))}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiMove size={14} />}
        onClick={() => onAdd("tangent")}
        title={t("cad.constraints.tangent")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.tangent"))}
        onMouseLeave={handleMouseLeave}
      />
      <IconButton
        icon={<FiLock size={14} />}
        onClick={() => onAdd("lock")}
        title={t("cad.constraints.lock")}
        onMouseEnter={() => handleMouseEnter(t("cad.constraints.lock"))}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
