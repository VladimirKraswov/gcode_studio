import { useGrblSender } from "../hooks/useGrblSender";
import { FiPlay, FiStopCircle, FiHome, FiArrowUp, FiArrowDown, FiArrowLeft, FiArrowRight } from "react-icons/fi";

export function GrblControlPanel() {
  const { status, log, connect, disconnect, send, sendGCode } = useGrblSender();

  return (
    <div style={{ padding: 16, background: "#fff", borderRadius: 18, border: "1px solid #dbe4ee" }}>
      <h3>Управление GRBL</h3>
      <div>Статус: {status.state}</div>
      <div>Позиция: X{status.pos.x.toFixed(2)} Y{status.pos.y.toFixed(2)} Z{status.pos.z.toFixed(2)}</div>
      <button onClick={connect} disabled={status.connected}>Подключиться</button>
      <button onClick={disconnect} disabled={!status.connected}>Отключиться</button>
      <hr />
      <div>
        <button onClick={() => send("$H")}><FiHome /> Home</button>
        <button onClick={() => send("?")}>Обновить статус</button>
      </div>
      <div>
        <button onClick={() => send("G91G0X10")}><FiArrowRight /> X+10</button>
        <button onClick={() => send("G91G0X-10")}><FiArrowLeft /> X-10</button>
        <button onClick={() => send("G91G0Y10")}><FiArrowUp /> Y+10</button>
        <button onClick={() => send("G91G0Y-10")}><FiArrowDown /> Y-10</button>
        <button onClick={() => send("G91G0Z5")}>Z+5</button>
        <button onClick={() => send("G91G0Z-5")}>Z-5</button>
        <button onClick={() => send("G90")}>Абсолютные</button>
      </div>
      <hr />
      <textarea value={log.join("\n")} readOnly rows={10} style={{ width: "100%" }} />
    </div>
  );
}