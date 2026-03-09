// src/modules/cad/panels/settings/CamDefaultsSection.tsx
import { useStyles } from "../../../../styles/useStyles";
import { useTheme } from "../../../../contexts/ThemeContext";
import type { SketchCamSettings, SketchDocument } from "../../model/types";
import { createDefaultCamSettings } from "../../model/document";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

const twoColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10,
  minWidth: 0,
};

const threeColumnGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 10,
  minWidth: 0,
};

type CamDefaultsSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function CamDefaultsSection({ document, setDocument }: CamDefaultsSectionProps) {
  const styles = useStyles();
  const { theme } = useTheme();

  const checkboxRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    fontWeight: 700,
    color: theme.text,
    padding: 12,
    borderRadius: 12,
    background: theme.panelSolid,
    border: `1px solid ${theme.border}`,
  };

  const defaultCamSettings = (() => {
    const defaults = createDefaultCamSettings();
    const value = document.defaultCamSettings ?? defaults;
    return {
      operation: value.operation ?? defaults.operation,
      direction: value.direction ?? defaults.direction,
      stepdown: value.stepdown ?? defaults.stepdown,
      stepover: value.stepover ?? defaults.stepover,
      tabs: {
        enabled: value.tabs?.enabled ?? defaults.tabs.enabled,
        count: value.tabs?.count ?? defaults.tabs.count,
        width: value.tabs?.width ?? defaults.tabs.width,
        height: value.tabs?.height ?? defaults.tabs.height,
      },
      ramping: {
        enabled: value.ramping?.enabled ?? defaults.ramping.enabled,
        turns: value.ramping?.turns ?? defaults.ramping.turns,
      },
    };
  })();

  function updateDefaultCam(
    patch:
      | Partial<SketchCamSettings>
      | ((prev: SketchCamSettings) => SketchCamSettings),
  ) {
    setDocument((prev) => {
      const defaults = createDefaultCamSettings();
      const current = prev.defaultCamSettings ?? defaults;
      const next =
        typeof patch === "function"
          ? patch(current)
          : { ...current, ...patch };

      return {
        ...prev,
        defaultCamSettings: next,
      };
    });
  }

  return (
    <CollapsibleCardBlock title="CAM defaults">
      <div style={{ display: "grid", gap: 10 }}>
        <div style={twoColumnGrid}>
          <label style={styles.inputLabel}>
            Операция по умолчанию
            <select
              value={defaultCamSettings.operation}
              onChange={(e) =>
                updateDefaultCam({
                  operation: e.target.value as SketchCamSettings["operation"],
                })
              }
              style={styles.select}
            >
              <option value="follow-path">Follow path</option>
              <option value="profile-inside">Profile inside</option>
              <option value="profile-outside">Profile outside</option>
              <option value="pocket">Pocket</option>
            </select>
          </label>

          <label style={styles.inputLabel}>
            Направление
            <select
              value={defaultCamSettings.direction}
              onChange={(e) =>
                updateDefaultCam({
                  direction: e.target.value as SketchCamSettings["direction"],
                })
              }
              style={styles.select}
            >
              <option value="climb">Climb</option>
              <option value="conventional">Conventional</option>
            </select>
          </label>

          <label style={styles.inputLabel}>
            Stepdown override
            <input
              style={styles.input}
              type="number"
              step="0.001"
              value={defaultCamSettings.stepdown ?? ""}
              onChange={(e) =>
                updateDefaultCam({
                  stepdown: e.target.value === "" ? null : Math.max(0.001, Number(e.target.value) || 0.001),
                })
              }
              placeholder="inherit passDepth"
            />
          </label>

          <label style={styles.inputLabel}>
            Stepover override
            <input
              style={styles.input}
              type="number"
              min="0.05"
              max="1"
              step="0.01"
              value={defaultCamSettings.stepover ?? ""}
              onChange={(e) =>
                updateDefaultCam({
                  stepover: e.target.value === "" ? null : Math.min(1, Math.max(0.05, Number(e.target.value) || 0.05)),
                })
              }
              placeholder="inherit document stepover"
            />
          </label>
        </div>

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={defaultCamSettings.ramping.enabled}
            onChange={(e) =>
              updateDefaultCam((prev) => ({
                ...prev,
                ramping: {
                  ...prev.ramping,
                  enabled: e.target.checked,
                },
              }))
            }
          />
          <span>Ramping по умолчанию</span>
        </label>

        <label style={styles.inputLabel}>
          Количество витков ramping
          <input
            style={styles.input}
            type="number"
            min="1"
            step="1"
            value={defaultCamSettings.ramping.turns}
            onChange={(e) =>
              updateDefaultCam((prev) => ({
                ...prev,
                ramping: {
                  ...prev.ramping,
                  turns: Math.max(1, Number(e.target.value) || 1),
                },
              }))
            }
          />
        </label>

        <label style={checkboxRow}>
          <input
            type="checkbox"
            checked={defaultCamSettings.tabs.enabled}
            onChange={(e) =>
              updateDefaultCam((prev) => ({
                ...prev,
                tabs: {
                  ...prev.tabs,
                  enabled: e.target.checked,
                },
              }))
            }
          />
          <span>Tabs / bridges по умолчанию</span>
        </label>

        <div style={threeColumnGrid}>
          <label style={styles.inputLabel}>
            Count
            <input
              style={styles.input}
              type="number"
              min="0"
              step="1"
              value={defaultCamSettings.tabs.count}
              onChange={(e) =>
                updateDefaultCam((prev) => ({
                  ...prev,
                  tabs: {
                    ...prev.tabs,
                    count: Math.max(0, Number(e.target.value) || 0),
                  },
                }))
              }
            />
          </label>

          <label style={styles.inputLabel}>
            Width
            <input
              style={styles.input}
              type="number"
              min="0.1"
              step="0.1"
              value={defaultCamSettings.tabs.width}
              onChange={(e) =>
                updateDefaultCam((prev) => ({
                  ...prev,
                  tabs: {
                    ...prev.tabs,
                    width: Math.max(0.1, Number(e.target.value) || 0.1),
                  },
                }))
              }
            />
          </label>

          <label style={styles.inputLabel}>
            Height
            <input
              style={styles.input}
              type="number"
              min="0.1"
              step="0.1"
              value={defaultCamSettings.tabs.height}
              onChange={(e) =>
                updateDefaultCam((prev) => ({
                  ...prev,
                  tabs: {
                    ...prev.tabs,
                    height: Math.max(0.1, Number(e.target.value) || 0.1),
                  },
                }))
              }
            />
          </label>
        </div>
      </div>
    </CollapsibleCardBlock>
  );
}