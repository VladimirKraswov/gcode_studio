import { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useTheme } from '../contexts/ThemeContext';

export function NotificationToast() {
  const { notifications, removeNotification } = useNotifications();
  const { theme } = useTheme();

  const typeStyles = {
    info: { bg: theme.primarySoft, border: theme.primary, color: theme.primaryText },
    success: { bg: '#dcfce7', border: '#bbf7d0', color: '#166534' },
    warning: { bg: '#fef3c7', border: '#fde68a', color: '#92400e' },
    error: { bg: theme.dangerSoft, border: theme.danger, color: theme.danger },
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {notifications.map(n => (
        <div
          key={n.id}
          style={{
            padding: '12px 16px',
            borderRadius: 12,
            background: typeStyles[n.type].bg,
            border: `1px solid ${typeStyles[n.type].border}`,
            color: typeStyles[n.type].color,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: theme.shadow,
            maxWidth: 320,
            animation: 'slideIn 0.2s ease',
            cursor: 'pointer',
          }}
          onClick={() => removeNotification(n.id)}
        >
          {n.message}
        </div>
      ))}
    </div>
  );
}