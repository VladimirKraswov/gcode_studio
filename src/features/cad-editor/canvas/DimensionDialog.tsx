import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/shared/components/ui/Button";
import { Input } from "@/shared/components/ui/Input";

type DimensionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (value: number) => void;
  onDelete?: () => void;
  initialValue: number;
  title: string;
  x: number;
  y: number;
};

export function DimensionDialog({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  initialValue,
  title,
  x,
  y,
}: DimensionDialogProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState(String(initialValue));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setValue(String(initialValue));
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-40 bg-black/5" onPointerDown={onClose} />
    <div
      className="fixed z-50 pointer-events-auto"
      style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="bg-panel border border-border rounded-xl shadow-2xl p-4 w-64 animate-in zoom-in-95 duration-100">
        <h3 className="text-sm font-medium mb-3 text-foreground">{title}</h3>
        <div className="flex flex-col gap-4">
          <Input
            ref={inputRef}
            type="number"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onSubmit(Number(value));
              }
              if (e.key === "Escape") {
                onClose();
              }
            }}
            placeholder={t("cad.objects.search_placeholder")}
          />
          <div className="flex gap-2 justify-between">
            {onDelete && (
                <Button variant="ghost" size="sm" onClick={onDelete} className="text-destructive hover:bg-destructive/10">
                    {t("cad.actions.delete")}
                </Button>
            )}
            <div className="flex gap-2 ml-auto">
                <Button variant="ghost" size="sm" onClick={onClose}>
                    {t("common.cancel")}
                </Button>
                <Button size="sm" onClick={() => onSubmit(Number(value))}>
                    OK
                </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
