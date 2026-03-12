// src/hooks/useProject.ts
import { useCallback } from "react";
import { downloadTextFile } from "@/shared/utils/common";
import { createProjectFile, parseProjectFile } from "@/shared/utils/projectFile";
import { useGCode } from "@/contexts/GCodeContext";
import { useCad } from "@/contexts/CadContext";
import { useUI } from "@/contexts/UIContext";
import type { GCodeStudioProject } from "@/types/project";
import { useNotifications } from "@/contexts/NotificationContext";

export function useProject() {
  const {
    fileName,
    setFileName,
    source,
    setSource,
    stock,
    setStock,
    showMaterialRemoval,
    setShowMaterialRemoval,
    placementMode,
    setPlacementMode,
    detailLevel,
    setDetailLevel,
  } = useGCode();

  const {
    editDocument,
    setEditDocument,
    selection,
    setSelection,
    cadView,
    setCadView,
  } = useCad();

  const {
    activeTab,
    setActiveTab,
  } = useUI();

  const { addNotification } = useNotifications();

  const saveProject = useCallback(() => {
    const project: GCodeStudioProject = {
      kind: "gcode-studio-project",
      version: 3,
      fileName,
      source,
      stock,
      showMaterialRemoval,
      placementMode,
      detailLevel,
      activeTab,
      editDocument,
      selection,
      cadView,
    };

    const json = createProjectFile(project);
    const name = fileName.replace(/\.[^/.]+$/, "") + ".json";
    downloadTextFile(json, name);

    addNotification("success", `Проект ${name} успешно сохранён`);
  }, [
    fileName,
    source,
    stock,
    showMaterialRemoval,
    placementMode,
    detailLevel,
    activeTab,
    editDocument,
    selection,
    cadView,
    addNotification,
  ]);

  const loadProject = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const project = parseProjectFile(text);

      setFileName(project.fileName);
      setSource(project.source);
      setStock(project.stock);
      setShowMaterialRemoval(project.showMaterialRemoval);
      setPlacementMode(project.placementMode);
      setDetailLevel(project.detailLevel);
      setActiveTab(project.activeTab);
      setEditDocument(project.editDocument);
      setSelection(project.selection);
      setCadView(project.cadView);

      addNotification("success", `Проект ${file.name} успешно открыт`);
    } catch (e: any) {
      addNotification("error", e.message || "Не удалось прочитать файл проекта");
    }
  }, [
    setFileName,
    setSource,
    setStock,
    setShowMaterialRemoval,
    setPlacementMode,
    setDetailLevel,
    setActiveTab,
    setEditDocument,
    setSelection,
    setCadView,
    addNotification,
  ]);

  return {
    saveProject,
    loadProject,
  };
}
