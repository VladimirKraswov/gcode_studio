import { useGrblSender } from "../hooks/useGrblSender";
import { FiPlay, FiStopCircle, FiHome, FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight } from "react-icons/fi";
import { useStyles } from "../styles/useStyles";
import { useTheme } from "../contexts/ThemeContext";

export function GrblControlPanel() {
  const { status, log, connect, disconnect, send, sendGCode } = useGrblSender();
  const styles = useStyles();
  const { theme } = useTheme();

  return (
    <div
      style={{
        padding: 16,
        background: theme.panelSolid,
        borderRadius: theme.radius.lg,
        border: `1px solid ${theme.border}`,
        boxShadow: theme.shadowSoft,
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: 16, fontWeight: 700, color: theme.text }}>
        Управление GRBL
      </h3>

      <div style={{ marginBottom: 8, fontSize: 13, color: theme.text }}>
        <span style={{ fontWeight: 600 }}>Статус:</span> {status.state}
      </div>

      <div style={{ marginBottom: 16, fontSize: 13, color: theme.textSoft }}>
        Позиция: X{status.pos.x.toFixed(2)} Y{status.pos.y.toFixed(2)} Z{status.pos.z.toFixed(2)}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={connect}
          disabled={status.connected}
          style={{
            ...styles.button,
            opacity: status.connected ? 0.5 : 1,
            cursor: status.connected ? "not-allowed" : "pointer",
          }}
        >
          Подключиться
        </button>
        <button
          onClick={disconnect}
          disabled={!status.connected}
          style={{
            ...styles.buttonDanger,
            opacity: !status.connected ? 0.5 : 1,
            cursor: !status.connected ? "not-allowed" : "pointer",
          }}
        >
          Отключиться
        </button>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${theme.border}`, margin: "16px 0" }} />

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => send("$H")} style={styles.buttonGhost}>
          <FiHome size={16} style={{ marginRight: 6 }} />
          Home
        </button>
        <button onClick={() => send("?")} style={styles.buttonGhost}>
          Обновить статус
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <button onClick={() => send("G91G0X10")} style={styles.buttonGhost} title="X+10">
          <FiArrowRight size={16} style={{ marginRight: 6 }} />
          X+10
        </button>
        <button onClick={() => send("G91G0X-10")} style={styles.buttonGhost} title="X-10">
          <FiArrowLeft size={16} style={{ marginRight: 6 }} />
          X-10
        </button>
        <button onClick={() => send("G91G0Y10")} style={styles.buttonGhost} title="Y+10">
          <FiArrowUp size={16} style={{ marginRight: 6 }} />
          Y+10
        </button>
        <button onClick={() => send("G91G0Y-10")} style={styles.buttonGhost} title="Y-10">
          <FiArrowDown size={16} style={{ marginRight: 6 }} />
          Y-10
        </button>
        <button onClick={() => send("G91G0Z5")} style={styles.buttonGhost} title="Z+5">
          Z+5
        </button>
        <button onClick={() => send("G91G0Z-5")} style={styles.buttonGhost} title="Z-5">
          Z-5
        </button>
        <button onClick={() => send("G90")} style={styles.buttonGhost} title="Абсолютные">
          Абсолютные
        </button>
      </div>

      <hr style={{ border: "none", borderTop: `1px solid ${theme.border}`, margin: "16px 0" }} />

      <textarea
        value={log.join("\n")}
        readOnly
        rows={10}
        style={{
          ...styles.input,
          width: "100%",
          height: "auto",
          minHeight: 160,
          resize: "vertical",
          fontFamily: "monospace",
          fontSize: 12,
          lineHeight: 1.5,
          background: theme.panelMuted,
        }}
      />
    </div>
  );
}