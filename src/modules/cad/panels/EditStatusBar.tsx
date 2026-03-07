import { theme } from "../../../styles/ui";

export function EditStatusBar({ objectCount }: { objectCount: number }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
        marginTop: 12,
        color: theme.textMuted,
        fontSize: 12,
        flexShrink: 0,
      }}
    >
      <span>Инструменты сверху работают по подсказкам при наведении</span>
      <span>Объектов: {objectCount}</span>
    </div>
  );
}
