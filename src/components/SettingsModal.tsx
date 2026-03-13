import React from "react";
import { FiSettings, FiCheck, FiGlobe } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components/ui/Modal";
import { useSettings } from "@/contexts/SettingsContext";
import { Switch } from "@/shared/components/ui/Switch";
import { Label } from "@/shared/components/ui/Label";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { type MachineTool } from "@/shared/utils/settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { t, i18n } = useTranslation();
  const { settings, updateSettings } = useSettings();

  const handleToggleToolpath = (val: boolean) => {
    updateSettings(prev => ({
      ...prev,
      preview: { ...prev.preview, showToolpath: val }
    }));
  };

  const handleToggleRapids = (val: boolean) => {
    updateSettings(prev => ({
      ...prev,
      preview: { ...prev.preview, showRapids: val }
    }));
  };

  const handlePanButtonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateSettings(prev => ({
      ...prev,
      cad: { ...prev.cad, panButton: e.target.value as any }
    }));
  };

  const handleDefaultCutDepthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      updateSettings(prev => ({
        ...prev,
        cnc: { ...prev.cnc, defaultCutDepth: val }
      }));
    }
  };

  const handleAddTool = () => {
    const newTool: MachineTool = {
      id: crypto.randomUUID(),
      name: "New Tool",
      type: "endmill",
      diameter: 3.175,
      feed: 1000,
      rpm: 12000,
    };
    updateSettings(prev => ({
      ...prev,
      cnc: { ...prev.cnc, toolLibrary: [...prev.cnc.toolLibrary, newTool] }
    }));
  };

  const handleUpdateTool = (id: string, updates: Partial<MachineTool>) => {
    updateSettings(prev => ({
      ...prev,
      cnc: {
        ...prev.cnc,
        toolLibrary: prev.cnc.toolLibrary.map(t => t.id === id ? { ...t, ...updates } : t)
      }
    }));
  };

  const handleDeleteTool = (id: string) => {
    updateSettings(prev => ({
      ...prev,
      cnc: {
        ...prev.cnc,
        toolLibrary: prev.cnc.toolLibrary.filter(t => t.id !== id)
      }
    }));
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t("settings.title")}
      icon={<FiSettings size={24} />}
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose} className="flex items-center gap-2">
            <FiCheck size={18} />
            {t("common.apply")}
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">{t("settings.preview_section")}</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold mb-1 block">{t("settings.show_toolpath")}</Label>
                <p className="text-xs text-text-muted">{t("settings.show_toolpath_desc")}</p>
              </div>
              <Switch checked={settings.preview.showToolpath} onCheckedChange={handleToggleToolpath} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold mb-1 block">{t("settings.show_rapids")}</Label>
                <p className="text-xs text-text-muted">{t("settings.show_rapids_desc")}</p>
              </div>
              <Switch checked={settings.preview.showRapids} onCheckedChange={handleToggleRapids} />
            </div>
          </div>
        </section>

        <div className="h-px bg-border/50" />

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">{t("settings.cnc_section")}</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold mb-1 block">{t("settings.default_cut_depth")}</Label>
                <p className="text-xs text-text-muted">{t("settings.default_cut_depth_desc")}</p>
              </div>
              <div className="w-24">
                <Input
                  type="number"
                  step="0.1"
                  value={settings.cnc.defaultCutDepth}
                  onChange={handleDefaultCutDepthChange}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">{t("settings.tool_library")}</Label>
                <Button variant="secondary" size="sm" onClick={handleAddTool} className="flex items-center gap-1">
                  <FiPlus size={14} />
                  {t("settings.add_tool")}
                </Button>
              </div>

              <div className="space-y-3">
                {settings.cnc.toolLibrary.map((tool) => (
                  <div key={tool.id} className="p-3 bg-panel-muted border border-border rounded-lg space-y-3">
                    <div className="flex items-center gap-2">
                      <Input
                        value={tool.name}
                        onChange={(e) => handleUpdateTool(tool.id, { name: e.target.value })}
                        placeholder={t("settings.tool_name")}
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTool(tool.id)}
                        className="text-danger hover:bg-danger/10 p-1 h-8 w-8"
                      >
                        <FiTrash2 size={16} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-text-muted">{t("settings.tool_diameter")}</Label>
                        <Input
                          type="number"
                          step="0.001"
                          value={tool.diameter}
                          onChange={(e) => handleUpdateTool(tool.id, { diameter: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-text-muted">{t("settings.tool_feed")}</Label>
                        <Input
                          type="number"
                          value={tool.feed}
                          onChange={(e) => handleUpdateTool(tool.id, { feed: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-text-muted">{t("settings.tool_rpm")}</Label>
                        <Input
                          type="number"
                          value={tool.rpm}
                          onChange={(e) => handleUpdateTool(tool.id, { rpm: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] uppercase text-text-muted">{t("settings.tool_type")}</Label>
                        <select
                          value={tool.type}
                          onChange={(e) => handleUpdateTool(tool.id, { type: e.target.value })}
                          className="w-full bg-panel-solid border border-border rounded-md px-2 h-8 text-[12px] font-medium text-text focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                        >
                          <option value="endmill">Endmill</option>
                          <option value="ballnose">Ballnose</option>
                          <option value="v-bit">V-Bit</option>
                          <option value="drill">Drill</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="h-px bg-border/50" />

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">{t("settings.cad_section")}</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold mb-1 block">{t("settings.pan_button")}</Label>
                <p className="text-xs text-text-muted">{t("settings.pan_button_desc")}</p>
              </div>
              <select
                value={settings.cad.panButton}
                onChange={handlePanButtonChange}
                className="bg-panel-muted border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="right">{t("settings.pan_right")}</option>
                <option value="middle">{t("settings.pan_middle")}</option>
                <option value="both">{t("settings.pan_both")}</option>
              </select>
            </div>
          </div>
        </section>

        <div className="h-px bg-border/50" />

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">{t("settings.language")}</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-text">
              <FiGlobe className="text-primary" />
              <span className="text-sm font-semibold">{t("settings.language")}</span>
            </div>
            <select
              value={i18n.language.split("-")[0]}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
              className="bg-panel-muted border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="ru">Русский</option>
              <option value="en">English</option>
            </select>
          </div>
        </section>
      </div>
    </Modal>
  );
}
