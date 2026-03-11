// src/features/cad-editor/panels/settings/CamDefaultsSection.tsx
import type { SketchCamSettings, SketchDocument } from "@/features/cad-editor/model/types";
import { createDefaultCamSettings } from "@/features/cad-editor/model/document";
import { Label } from "@/shared/components/ui/Label";
import { Input } from "@/shared/components/ui/Input";
import { Switch } from "@/shared/components/ui/Switch";

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
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Операция</Label>
          <select
            value={defaultCamSettings.operation}
            onChange={(e) =>
              updateDefaultCam({
                operation: e.target.value as SketchCamSettings["operation"],
              })
            }
            className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="follow-path">По контуру</option>
            <option value="profile-inside">Внутри</option>
            <option value="profile-outside">Снаружи</option>
            <option value="pocket">Карман</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <Label>Направление</Label>
          <select
            value={defaultCamSettings.direction}
            onChange={(e) =>
              updateDefaultCam({
                direction: e.target.value as SketchCamSettings["direction"],
              })
            }
            className="flex h-9 w-full rounded-md border border-border bg-panel-solid px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="climb">Попутное</option>
            <option value="conventional">Встречное</option>
          </select>
        </div>
      </div>

      <div className="p-3 bg-panel-muted border border-border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-bold">Ramping (Врезание)</Label>
          <Switch
            checked={defaultCamSettings.ramping.enabled}
            onCheckedChange={(checked) =>
              updateDefaultCam((prev) => ({
                ...prev,
                ramping: { ...prev.ramping, enabled: checked },
              }))
            }
          />
        </div>

        <div className="space-y-1.5">
          <Label>Витков врезания</Label>
          <Input
            type="number"
            min="1"
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
        </div>
      </div>

      <div className="p-3 bg-panel-muted border border-border rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <Label className="font-bold">Tabs (Перемычки)</Label>
          <Switch
            checked={defaultCamSettings.tabs.enabled}
            onCheckedChange={(checked) =>
              updateDefaultCam((prev) => ({
                ...prev,
                tabs: { ...prev.tabs, enabled: checked },
              }))
            }
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label className="text-[10px]">Кол-во</Label>
            <Input
              type="number"
              min="0"
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
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Ширина</Label>
            <Input
              type="number"
              min="0.1"
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
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px]">Высота</Label>
            <Input
              type="number"
              min="0.1"
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
          </div>
        </div>
      </div>
    </div>
  );
}
