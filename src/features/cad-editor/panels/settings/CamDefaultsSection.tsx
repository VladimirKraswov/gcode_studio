// src/modules/cad/panels/settings/CamDefaultsSection.tsx
import type { SketchCamSettings, SketchDocument } from "@/features/cad-editor/model/types";
import { createDefaultCamSettings } from "@/features/cad-editor/model/document";
import { CollapsibleCardBlock } from "./CollapsibleCardBlock";

type CamDefaultsSectionProps = {
  document: SketchDocument;
  setDocument: React.Dispatch<React.SetStateAction<SketchDocument>>;
};

export function CamDefaultsSection({
  document,
  setDocument,
}: CamDefaultsSectionProps) {
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
      <div className="grid gap-2.5">
        <div className="grid min-w-0 grid-cols-2 gap-2.5">
          <label className="ui-label">
            Операция по умолчанию
            <select
              value={defaultCamSettings.operation}
              onChange={(e) =>
                updateDefaultCam({
                  operation: e.target.value as SketchCamSettings["operation"],
                })
              }
              className="ui-input"
            >
              <option value="follow-path">Follow path</option>
              <option value="profile-inside">Profile inside</option>
              <option value="profile-outside">Profile outside</option>
              <option value="pocket">Pocket</option>
            </select>
          </label>

          <label className="ui-label">
            Направление
            <select
              value={defaultCamSettings.direction}
              onChange={(e) =>
                updateDefaultCam({
                  direction: e.target.value as SketchCamSettings["direction"],
                })
              }
              className="ui-input"
            >
              <option value="climb">Climb</option>
              <option value="conventional">Conventional</option>
            </select>
          </label>

          <label className="ui-label">
            Stepdown override
            <input
              className="ui-input"
              type="number"
              step="0.001"
              value={defaultCamSettings.stepdown ?? ""}
              onChange={(e) =>
                updateDefaultCam({
                  stepdown:
                    e.target.value === ""
                      ? null
                      : Math.max(0.001, Number(e.target.value) || 0.001),
                })
              }
              placeholder="inherit passDepth"
            />
          </label>

          <label className="ui-label">
            Stepover override
            <input
              className="ui-input"
              type="number"
              min="0.05"
              max="1"
              step="0.01"
              value={defaultCamSettings.stepover ?? ""}
              onChange={(e) =>
                updateDefaultCam({
                  stepover:
                    e.target.value === ""
                      ? null
                      : Math.min(1, Math.max(0.05, Number(e.target.value) || 0.05)),
                })
              }
              placeholder="inherit document stepover"
            />
          </label>
        </div>

        <label className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-solid)] p-3 text-[13px] font-bold text-[var(--color-text)]">
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

        <label className="ui-label">
          Количество витков ramping
          <input
            className="ui-input"
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

        <label className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-panel-solid)] p-3 text-[13px] font-bold text-[var(--color-text)]">
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

        <div className="grid min-w-0 grid-cols-3 gap-2.5">
          <label className="ui-label">
            Count
            <input
              className="ui-input"
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

          <label className="ui-label">
            Width
            <input
              className="ui-input"
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

          <label className="ui-label">
            Height
            <input
              className="ui-input"
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