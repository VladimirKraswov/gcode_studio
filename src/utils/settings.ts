export type CadPanButtonMode = "middle" | "right" | "both";

export type UserSettings = {
  cad: {
    panButton: CadPanButtonMode;
  };
};

const STORAGE_KEY = "gcode-studio-settings";

const DEFAULT_SETTINGS: UserSettings = {
  cad: {
    panButton: "right",
  },
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isPanButtonMode(value: unknown): value is CadPanButtonMode {
  return value === "middle" || value === "right" || value === "both";
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
    const panButton = isPanButtonMode(cad.panButton)
      ? cad.panButton
      : DEFAULT_SETTINGS.cad.panButton;

    return {
      cad: {
        panButton,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}