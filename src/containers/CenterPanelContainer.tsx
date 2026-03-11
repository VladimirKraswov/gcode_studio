import React, { Suspense } from "react";
import { useApp } from "@/contexts/AppContext";
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
  const {
    activeTab,
    parsed,
    currentState,
    progress,
    cameraResetKey,
    stock,
    showMaterialRemoval,
    placementMode,
    detailLevel,
    editDocument,
    source,
    setSource,
    fileName,
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
    settings,
    setCameraInfo,
    applyGeneratedGCode,
  } = useApp();

  // "edit" tab is edge-to-edge for a professional CAD feel.
  // Other tabs keep the standard panel look with padding.
  const isEdit = activeTab === "edit";

  return (
    <div className={`${isEdit ? "flex flex-1 min-h-0 min-w-0" : "ui-panel flex flex-1 min-h-0 flex-col overflow-hidden bg-panel-solid p-4"}`}>
      {activeTab === "view" && (
        <div className="flex flex-1 min-h-0 flex-col">
          <div className="mb-3 flex shrink-0 flex-wrap justify-between gap-3 rounded-[14px] border border-border bg-panel-muted px-3 py-2.5 text-xs text-text-muted">
            <span>ЛКМ/ПКМ — панорама, колесо — масштаб</span>
            <span>Machine zero: X0 Y0 Z0</span>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden rounded-[18px] border border-border bg-panel-muted">
            <PathScene
              parsed={parsed!}
              currentState={currentState}
              progress={progress}
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
