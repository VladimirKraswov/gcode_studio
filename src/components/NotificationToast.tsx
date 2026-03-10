import { useNotifications } from "../contexts/NotificationContext";

export function NotificationToast() {
  const { notifications, removeNotification } = useNotifications();

  const typeClasses = {
    info: {
      bg: "bg-[var(--color-primary-soft)]",
      border: "border-[var(--color-primary)]",
      text: "text-[var(--color-primary-text)]",
    },
    success: {
      bg: "bg-[#dcfce7]",
      border: "border-[#bbf7d0]",
      text: "text-[#166534]",
    },
    warning: {
      bg: "bg-[#fef3c7]",
      border: "border-[#fde68a]",
      text: "text-[#92400e]",
    },
    error: {
      bg: "bg-[var(--color-danger-soft)]",
      border: "border-[var(--color-danger)]",
      text: "text-[var(--color-danger)]",
    },
  } as const;

  return (
    <div className="fixed right-5 bottom-5 z-[9999] flex flex-col gap-2.5">
      {notifications.map((n) => {
        const styles = typeClasses[n.type];

        return (
          <div
            key={n.id}
            onClick={() => removeNotification(n.id)}
            className={[
              "max-w-80 cursor-pointer rounded-xl border px-4 py-3 text-sm font-semibold shadow-[var(--shadow)]",
              "animate-[slideIn_0.2s_ease]",
              styles.bg,
              styles.border,
              styles.text,
            ].join(" ")}
          >
            {n.message}
          </div>
        );
      })}
    </div>
  );
}