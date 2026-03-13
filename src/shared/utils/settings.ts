export type CadPanButtonMode = "middle" | "right" | "both";

export type MachineTool = {
  id: string;
  name: string;
  type: string;
  diameter: number;
  feed: number;
  rpm: number;
};

export type UserSettings = {
  cad: {
    panButton: CadPanButtonMode;
  };
  preview: {
    showToolpath: boolean;
    showRapids: boolean;
  };
  cnc: {
    defaultCutDepth: number;
    toolLibrary: MachineTool[];
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
  cnc: {
    defaultCutDepth: 5,
    toolLibrary: [
      {
        id: "corn-mill-preset",
        name: "Фреза кукуруза",
        type: "endmill",
        diameter: 3.175,
        feed: 1000,
        rpm: 12000,
      },
    ],
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
    const cnc = isObject(parsed.cnc) ? parsed.cnc : {};

    const panButton = isPanButtonMode(cad.panButton)
      ? cad.panButton
      : DEFAULT_SETTINGS.cad.panButton;

    const showToolpath = isBoolean(preview.showToolpath)
      ? preview.showToolpath
      : DEFAULT_SETTINGS.preview.showToolpath;

    const showRapids = isBoolean(preview.showRapids)
      ? preview.showRapids
      : DEFAULT_SETTINGS.preview.showRapids;

    const defaultCutDepth =
      typeof cnc.defaultCutDepth === "number"
        ? cnc.defaultCutDepth
        : DEFAULT_SETTINGS.cnc.defaultCutDepth;

    const toolLibrary = Array.isArray(cnc.toolLibrary)
      ? cnc.toolLibrary
      : DEFAULT_SETTINGS.cnc.toolLibrary;

    return {
      cad: {
        panButton,
      },
      preview: {
        showToolpath,
        showRapids,
      },
      cnc: {
        defaultCutDepth,
        toolLibrary,
      },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}