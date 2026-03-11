

// =============================
// FILE: src/utils/projectFile.ts
// =============================

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
    throw new Error("Некорректный формат проекта");
  }

  if (raw.kind !== "gcode-studio-project") {
    throw new Error("Это не файл проекта GCode Studio");
  }

  if (raw.version !== 3) {
    throw new Error("Поддерживается только формат проекта version 3");
  }

  return raw as GCodeStudioProject;
}
