import { useState } from "react";
import { FiBarChart2, FiEdit, FiInfo, FiSettings, FiTool } from "react-icons/fi";

import { useApp } from "@/contexts/AppContext";
import { RightPanel } from "@/components/RightPanel";
import { InfoPanelSection } from "@/features/preview/components/panels/InfoPanelSection";
import { GCodeStatsSection } from "@/features/preview/components/panels/GCodeStatsSection";
import { CollapsibleSection } from "@/shared/components/layout/CollapsibleSection";
import { Tabs } from "@/shared/components/ui/Tabs";
import {
  ShapePropertiesPanel,
  DocumentSettingsPanel,
} from "@/features/cad-editor";

type CadTab = "cad" | "cam";

export function RightPanelContainer() {
  const {
    activeTab,
    parsed,
    currentState,
    cameraInfo,
    stock,
    editDocument,
    setEditDocument,
    selection,
    cadEditor,
  } = useApp();

  const [cadTab, setCadTab] = useState<CadTab>("cad");

  if (activeTab === "edit") {
    return (
      <RightPanel>
        <Tabs
          tabs={[
            { id: "cad", label: "CAD", icon: <FiEdit size={14} /> },
            { id: "cam", label: "CAM", icon: <FiTool size={14} /> },
          ]}
          activeTab={cadTab}
          onChange={(id) => setCadTab(id as CadTab)}
          className="mb-2"
        />

        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          {cadTab === "cad" && (
            <div className="flex flex-col gap-4">
              <CollapsibleSection
                title="Свойства объекта"
                icon={<FiEdit size={18} />}
              >
                <ShapePropertiesPanel
                  document={editDocument}
                  setDocument={setEditDocument}
                  selection={selection}
                  onInsertBSplineControlPoint={() => {
                    const primaryShape = editDocument.shapes.find(
                      (s) => s.id === selection.primaryId,
                    );
                    if (primaryShape?.type !== "bspline") return;

                    const pointMap = new Map(
                      editDocument.points.map((p) => [p.id, p]),
                    );

                    const controlPoints = primaryShape.controlPointIds
                      .map((id) => pointMap.get(id))
                      .filter((p): p is { id: string; x: number; y: number } => Boolean(p));

                    if (controlPoints.length < 2) return;

                    let cx = 0;
                    let cy = 0;

                    controlPoints.forEach((p) => {
                      cx += p.x;
                      cy += p.y;
                    });

                    cx /= controlPoints.length;
                    cy /= controlPoints.length;

                    cadEditor?.insertControlPointToSelectedBSpline(cx, cy);
                  }}
                  onRemoveBSplineControlPoint={() => {
                    cadEditor?.removeSelectedPointFromBSpline();
                  }}
                />
              </CollapsibleSection>
            </div>
          )}

          {cadTab === "cam" && (
            <div className="flex flex-col gap-4">
              <CollapsibleSection
                title="Настройки документа"
                icon={<FiSettings size={18} />}
              >
                <DocumentSettingsPanel
                  document={editDocument}
                  setDocument={setEditDocument}
                />
              </CollapsibleSection>
            </div>
          )}
        </div>
      </RightPanel>
    );
  }

  return (
    <RightPanel>
      <div className="flex flex-col gap-4">
        <CollapsibleSection title="Состояние" icon={<FiInfo size={18} />}>
          <InfoPanelSection
            bounds={
              parsed?.bounds ?? {
                minX: 0,
                minY: 0,
                minZ: 0,
                maxX: 0,
                maxY: 0,
                maxZ: 0,
              }
            }
            stock={stock}
            parsedStats={
              parsed?.stats ?? {
                totalLines: 0,
                totalMoves: 0,
                rapidMoves: 0,
                workMoves: 0,
                cuttingMoves: 0,
                renderMoves: 0,
                renderStep: 0,
              }
            }
            currentState={currentState}
            cameraInfo={cameraInfo}
            totalLength={parsed?.totalLength ?? 0}
          />
        </CollapsibleSection>

        <CollapsibleSection title="Статистика" icon={<FiBarChart2 size={18} />}>
          <GCodeStatsSection parsed={parsed ?? undefined} />
        </CollapsibleSection>
      </div>
    </RightPanel>
  );
}