import React, { Suspense } from "react";
import { useGCode } from "@/contexts/GCodeContext";
import { useUI } from "@/contexts/UIContext";
import { useCad } from "@/contexts/CadContext";
import { useSettings } from "@/contexts/SettingsContext";
import { PathScene } from "@/features/preview/components/PathScene";

const GCodeEditorPanel = React.lazy(() => import("@/features/gcode-editor/components/GCodeEditorPanel"));
const EditTab = React.lazy(() => import("@/components/EditTab"));

function Loader() {
  return (
    <div className="grid h-full place-items-center">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
    </div>
  );
}

export function CenterPanelContainer() {
  const { activeTab } = useUI();
  const {
    parsed,
    currentState,
    progress,
    stock,
    showMaterialRemoval,
    placementMode,
    detailLevel,
    source,
    setSource,
    fileName,
    applyGeneratedGCode,
  } = useGCode();
  const {
    cameraResetKey,
    editDocument,
    setEditDocument,
    setEditDocumentSilently,
    selection,
    setSelection,
    setSelectionSilently,
    cadView,
    setCadView,
    setCadViewSilently,
    checkpointHistory,
    undo,
    redo,
    canUndo,
    canRedo,
    setCameraInfo,
  } = useCad();
  const { settings } = useSettings();

  return (
    <div className="flex flex-1 min-h-0 min-w-0 bg-panel-solid">
      {activeTab === "view" && (
        <div className="flex flex-1 min-h-0 flex-col p-2">
          <div className="mb-2 flex shrink-0 flex-wrap justify-between gap-3 rounded-lg border border-border bg-panel-muted px-3 py-1.5 text-[11px] text-text-muted">
            <span>ЛКМ/ПКМ — панорама, колесо — масштаб</span>
            <span>Machine zero: X0 Y0 Z0</span>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-border bg-panel-muted">
            <PathScene
              progress={progress}
              showToolpath={showToolpath}
              showRapids={showRapids}
              parsed={parsed!}
              currentState={currentState}
              cameraResetKey={cameraResetKey}
              stock={stock}
              showMaterialRemoval={showMaterialRemoval}
              totalLength={parsed?.totalLength ?? 0}
              placementMode={placementMode}
              detailLevel={detailLevel}
              toolDiameter={editDocument.toolDiameter}
              onCameraUpdate={setCameraInfo}
            />
          </div>
        </div>
      )}

      {activeTab === "gcode" && (
        <Suspense fallback={<Loader />}>
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
            <GCodeEditorPanel source={source} setSource={setSource} fileName={fileName} />
          </div>
        </Suspense>
      )}

      {activeTab === "edit" && (
        <Suspense fallback={<Loader />}>
          <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
            <EditTab
              document={editDocument}
              setDocument={setEditDocument}
              setDocumentSilently={setEditDocumentSilently}
              onGenerateGCode={applyGeneratedGCode}
              selection={selection}
              onSelectionChange={setSelection}
              onSelectionChangeSilently={setSelectionSilently}
              view={cadView}
              onViewChange={setCadView}
              onViewChangeSilently={setCadViewSilently}
              checkpointHistory={checkpointHistory}
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndo}
              canRedo={canRedo}
              panButtonMode={settings.cad.panButton}
            />
          </div>
        </Suspense>
      )}
    </div>
  );
}
