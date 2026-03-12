export type CadPanButtonMode = "middle" | "right" | "both";

export type UserSettings = {
  cad: {
    panButton: CadPanButtonMode;
  };
  preview: {
    showToolpath: boolean;
    showRapids: boolean;
  };
};

const STORAGE_KEY = "gcode-studio-settings";

const DEFAULT_SETTINGS: UserSettings = {
  cad: {
    panButton: "right",
  },
  preview: {
    showToolpath: true,
    showRapids: true,
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPanButtonMode(value: unknown): value is CadPanButtonMode {
  return value === "middle" || value === "right" || value === "both";
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

export function getDefaultSettings(): UserSettings {
  return DEFAULT_SETTINGS;
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isObject(parsed)) {
      return DEFAULT_SETTINGS;
    }

    const cad = isObject(parsed.cad) ? parsed.cad : {};
    const preview = isObject(parsed.preview) ? parsed.preview : {};

    const panButton = isPanButtonMode(cad.panButton)
      ? cad.panButton
      : DEFAULT_SETTINGS.cad.panButton;

    const showToolpath = isBoolean(preview.showToolpath)
      ? preview.showToolpath
      : DEFAULT_SETTINGS.preview.showToolpath;

    const showRapids = isBoolean(preview.showRapids)
      ? preview.showRapids
      : DEFAULT_SETTINGS.preview.showRapids;

    return {
      cad: {
        panButton,
      },
      preview: {
        showToolpath,
        showRapids,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}