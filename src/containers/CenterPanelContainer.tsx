// src/containers/CenterPanelContainer.tsx
import { useApp } from '../contexts/AppContext';
import { PathScene } from '../components/PathScene';
import { GCodeEditorPanel } from '../components/GCodeEditorPanel';
import { EditTab } from '../components/EditTab';
import { theme, ui } from '../styles/ui';

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
    setActiveTab,
    setFileName,
    resetPlayback,
    setCameraResetKey,
    setCameraInfo,
    applyGeneratedGCode,
  } = useApp();

  // Функция applyGeneratedGCode должна быть определена в контексте или передана
  // Предположим, что она есть в useAppState (нужно добавить)
  // Если нет, можно определить здесь, используя setSource и т.д.
  // Но для простоты будем считать, что она есть в контексте.

  return (
    <div
      style={{
        ...ui.panel,
        flex: 1,
        minHeight: 0,
        padding: 16,
        background: theme.panelSolid,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {activeTab === "view" && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div
            style={{
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 14,
              background: theme.panelMuted,
              border: `1px solid ${theme.border}`,
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 12,
              color: theme.textMuted,
              flexShrink: 0,
            }}
          >
            <span>ЛКМ/ПКМ — панорама, колесо — масштаб</span>
            <span>Machine zero: X0 Y0 Z0</span>
          </div>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              borderRadius: 18,
              border: `1px solid ${theme.border}`,
              background: "#f8fafc",
            }}
          >
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
        <div
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <GCodeEditorPanel source={source} setSource={setSource} fileName={fileName} />
        </div>
      )}
      {activeTab === "edit" && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: "flex",
            overflow: "hidden",
          }}
        >
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
      )}
    </div>
  );
}