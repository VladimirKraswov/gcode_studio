import React from "react";
import { FiSettings, FiCheck, FiGlobe } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { Modal } from "@/shared/components/ui/Modal";
import { useSettings } from "@/contexts/SettingsContext";
import { Switch } from "@/shared/components/ui/Switch";
import { Label } from "@/shared/components/ui/Label";
import { Button } from "@/shared/components/ui/Button";

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
