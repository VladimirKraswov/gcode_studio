// src/containers/CenterPanelContainer.tsx
import React, { Suspense } from 'react';
import { useApp } from '../contexts/AppContext';
import { PathScene } from '../components/PathScene';
import { useStyles } from '../styles/useStyles';
import { useTheme } from '../contexts/ThemeContext';

const GCodeEditorPanel = React.lazy(() => import('../components/GCodeEditorPanel'));
const EditTab = React.lazy(() => import('../components/EditTab'));

// Компонент-заглушка для загрузки
function Loader() {
  const styles = useStyles();
  const { theme } = useTheme();

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <div style={{ 
        width: 40, 
        height: 40, 
        borderRadius: '50%', 
        border: `3px solid ${theme.border}`, 
        borderTopColor: theme.primary, 
        animation: 'spin 1s linear infinite' 
      }} />
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

  const styles = useStyles();
  const { theme } = useTheme();

  return (
    <div style={{ 
      ...styles.panel, 
      flex: 1, 
      minHeight: 0, 
      padding: 16, 
      background: theme.panelSolid, 
      display: "flex", 
      flexDirection: "column", 
      overflow: "hidden" 
    }}>
      {activeTab === "view" && (
        <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
          <div style={{ 
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
            flexShrink: 0 
          }}>
            <span>ЛКМ/ПКМ — панорама, колесо — масштаб</span>
            <span>Machine zero: X0 Y0 Z0</span>
          </div>
          <div style={{ 
            flex: 1, 
            minHeight: 0, 
            overflow: "hidden", 
            borderRadius: 18, 
            border: `1px solid ${theme.border}`, 
            background: theme.panelMuted 
          }}>
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
          <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", overflow: "hidden" }}>
            <GCodeEditorPanel source={source} setSource={setSource} fileName={fileName} />
          </div>
        </Suspense>
      )}
      {activeTab === "edit" && (
        <Suspense fallback={<Loader />}>
          <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", overflow: "hidden" }}>
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