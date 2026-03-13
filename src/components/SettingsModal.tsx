import React from "react";
import { FiSettings, FiCheck } from "react-icons/fi";
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
      title="Настройки приложения"
      icon={<FiSettings size={24} />}
      footer={
        <div className="flex justify-end">
          <Button onClick={onClose} className="flex items-center gap-2">
            <FiCheck size={18} />
            Применить
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">3D Превью</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold mb-1 block">Показывать траекторию</Label>
                <p className="text-xs text-text-muted">Отображать линии G1/G2/G3 в превью</p>
              </div>
              <Switch checked={settings.preview.showToolpath} onCheckedChange={handleToggleToolpath} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold mb-1 block">Показывать быстрые перемещения</Label>
                <p className="text-xs text-text-muted">Отображать линии G0 (пустые ходы)</p>
              </div>
              <Switch checked={settings.preview.showRapids} onCheckedChange={handleToggleRapids} />
            </div>
          </div>
        </section>

        <div className="h-px bg-border/50" />

        <section>
          <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted mb-4">Конструктор (CAD)</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold mb-1 block">Кнопка панорамирования</Label>
                <p className="text-xs text-text-muted">Какая кнопка мыши используется для панорамирования</p>
              </div>
              <select
                value={settings.cad.panButton}
                onChange={handlePanButtonChange}
                className="bg-panel-muted border border-border rounded-lg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="right">Правая (ПКМ)</option>
                <option value="middle">Средняя (Колесо)</option>
                <option value="both">Обе</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    </Modal>
  );
}
