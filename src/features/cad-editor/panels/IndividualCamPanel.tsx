import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { FiTool, FiInfo } from "react-icons/fi";
import { createDefaultCamSettings } from "../model/document";
import type {
  SketchCamSettings,
  SketchDocument,
  SketchShape,
} from "../model/types";
import { updateShape } from "../model/document";
import { Label } from "@/shared/components/ui/Label";
import type { SelectionState } from "../model/selection";
import { isShapeClosed } from "../geometry/shapeContours";

export type IndividualCamPanelProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
  selection: SelectionState;
};

function resolveShapeCamSettings(
  shape: SketchShape,
  document: SketchDocument,
): SketchCamSettings {
  const docDefaults = document.defaultCamSettings ?? createDefaultCamSettings();
  const shapeCam = shape.camSettings ?? {};

  return {
    operation: shapeCam.operation ?? docDefaults.operation,
    direction: shapeCam.direction ?? docDefaults.direction,
    stepdown: shapeCam.stepdown ?? docDefaults.stepdown,
    stepover: shapeCam.stepover ?? docDefaults.stepover,
    tabs: {
      enabled: shapeCam.tabs?.enabled ?? docDefaults.tabs.enabled,
      count: shapeCam.tabs?.count ?? docDefaults.tabs.count,
      width: shapeCam.tabs?.width ?? docDefaults.tabs.width,
      height: shapeCam.tabs?.height ?? docDefaults.tabs.height,
    },
    ramping: {
      enabled: shapeCam.ramping?.enabled ?? docDefaults.ramping.enabled,
      turns: shapeCam.ramping?.turns ?? docDefaults.ramping.turns,
    },
  };
}

export function IndividualCamPanel({
  document,
  setDocument,
  selection,
}: IndividualCamPanelProps) {
  const { t } = useTranslation();

  const selectedShape = useMemo(
    () =>
      selection.primaryRef?.kind === "shape"
        ? document.shapes.find((shape) => shape.id === selection.primaryRef?.id) ?? null
        : null,
    [document.shapes, selection.primaryRef],
  );

  const shapeCamSettings = useMemo(
    () => (selectedShape ? resolveShapeCamSettings(selectedShape, document) : null),
    [selectedShape, document],
  );

  function updateSelectedCam(
    patch:
      | Partial<SketchCamSettings>
      | ((prev: SketchCamSettings) => SketchCamSettings),
  ) {
    if (!selectedShape) return;

    const current = resolveShapeCamSettings(selectedShape, document);
    const next =
      typeof patch === "function"
        ? patch(current)
        : { ...current, ...patch };

    setDocument((prev) =>
      updateShape(prev, selectedShape.id, {
        camSettings: next,
      } as Partial<SketchShape>),
    );
  }

  if (!selectedShape) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <FiInfo size={32} className="text-border mb-3" />
        <div className="text-xs text-text-muted">
          {t("cad.properties.select_object")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-1">
      <div className="flex items-center gap-3 p-2 bg-panel-muted rounded-lg border border-border">
        <div className="w-8 h-8 rounded bg-primary-soft text-primary grid place-items-center">
          <FiTool size={14} />
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-text truncate">
            {selectedShape.name}
          </div>
          <div className="text-[11px] text-text-muted capitalize">
            {t("cad.properties.cam_processing")}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-1.5">
          <Label>{t("cad.properties.op_type")}</Label>
          <select
            value={shapeCamSettings?.operation}
            onChange={(e) =>
              updateSelectedCam({
                operation: e.target.value as SketchCamSettings["operation"],
              })
            }
            className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="follow-path">{t("cad.properties.op_follow")}</option>
            <option value="profile-inside" disabled={!isShapeClosed(selectedShape)}>{t("cad.properties.op_inside")}</option>
            <option value="profile-outside" disabled={!isShapeClosed(selectedShape)}>{t("cad.properties.op_outside")}</option>
            <option value="pocket" disabled={!isShapeClosed(selectedShape)}>{t("cad.properties.op_pocket")}</option>
          </select>
        </div>

        {shapeCamSettings?.operation !== "follow-path" && (
          <div className="grid gap-1.5">
            <Label>{t("cad.properties.direction")}</Label>
            <select
              value={shapeCamSettings?.direction}
              onChange={(e) =>
                updateSelectedCam({
                  direction: e.target.value as SketchCamSettings["direction"],
                })
              }
              className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="climb">{t("cad.properties.dir_climb")}</option>
              <option value="conventional">{t("cad.properties.dir_conventional")}</option>
            </select>
          </div>
        )}
      </div>
    </div>
  );
}
