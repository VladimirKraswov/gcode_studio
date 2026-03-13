

// =============================
// FILE: src/utils/projectFile.ts
// =============================

import i18next from "i18next";
import type { GCodeStudioProject } from "@/types/project";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function createProjectFile(data: GCodeStudioProject): string {
  return JSON.stringify(data, null, 2);
}

export function parseProjectFile(text: string): GCodeStudioProject {
  const raw: unknown = JSON.parse(text);

  if (!isObject(raw)) {
    throw new Error(i18next.t("common.project_invalid_format"));
  }

  if (raw.kind !== "gcode-studio-project") {
    throw new Error(i18next.t("common.project_not_studio"));
  }

  if (raw.version !== 3) {
    throw new Error(i18next.t("common.project_version_unsupported"));
  }

  return raw as GCodeStudioProject;
}
