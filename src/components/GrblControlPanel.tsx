import { useTranslation } from "react-i18next";
import { useGrblSender } from "@/hooks/useGrblSender";
import {
  FiHome,
  FiArrowUp,
  FiArrowDown,
  FiArrowLeft,
  FiArrowRight,
} from "react-icons/fi";

export function GrblControlPanel() {
  const { t } = useTranslation();
  const { status, log, connect, disconnect, send } = useGrblSender();

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-panel-solid)] p-4 shadow-[var(--shadow-soft)]">
      <h3 className="mb-3 text-base font-bold text-[var(--color-text)]">
        {t("grbl.title")}
      </h3>

      <div className="mb-2 text-[13px] text-[var(--color-text)]">
        <span className="font-semibold">{t("grbl.status")}:</span> {status.state}
      </div>

      <div className="mb-4 text-[13px] text-[var(--color-text-soft)]">
        {t("grbl.position")}: X{status.pos.x.toFixed(2)} Y{status.pos.y.toFixed(2)} Z
        {status.pos.z.toFixed(2)}
      </div>

      <div className="mb-4 flex gap-2">
        <button
          onClick={connect}
          disabled={status.connected}
          className="ui-btn disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("grbl.connect")}
        </button>

        <button
          onClick={disconnect}
          disabled={!status.connected}
          className="ui-btn-danger disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("grbl.disconnect")}
        </button>
      </div>

      <div className="my-4 h-px bg-[var(--color-border)]" />

      <div className="mb-4 flex flex-wrap gap-2">
        <button onClick={() => send("$H")} className="ui-btn-ghost">
          <FiHome size={16} className="mr-1.5" />
          Home
        </button>

        <button onClick={() => send("?")} className="ui-btn-ghost">
          {t("grbl.update_status")}
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          onClick={() => send("G91G0X10")}
          className="ui-btn-ghost"
          title="X+10"
        >
          <FiArrowRight size={16} className="mr-1.5" />
          X+10
        </button>

        <button
          onClick={() => send("G91G0X-10")}
          className="ui-btn-ghost"
          title="X-10"
        >
          <FiArrowLeft size={16} className="mr-1.5" />
          X-10
        </button>

        <button
          onClick={() => send("G91G0Y10")}
          className="ui-btn-ghost"
          title="Y+10"
        >
          <FiArrowUp size={16} className="mr-1.5" />
          Y+10
        </button>

        <button
          onClick={() => send("G91G0Y-10")}
          className="ui-btn-ghost"
          title="Y-10"
        >
          <FiArrowDown size={16} className="mr-1.5" />
          Y-10
        </button>

        <button onClick={() => send("G91G0Z5")} className="ui-btn-ghost" title="Z+5">
          Z+5
        </button>

        <button
          onClick={() => send("G91G0Z-5")}
          className="ui-btn-ghost"
          title="Z-5"
        >
          Z-5
        </button>

        <button onClick={() => send("G90")} className="ui-btn-ghost" title={t("grbl.absolute")}>
          {t("grbl.absolute")}
        </button>
      </div>

      <div className="my-4 h-px bg-[var(--color-border)]" />

      <textarea
        value={log.join("\n")}
        readOnly
        rows={10}
        className="ui-input min-h-40 h-auto w-full resize-y bg-[var(--color-panel-muted)] font-mono text-xs leading-6"
      />
    </div>
  );
}