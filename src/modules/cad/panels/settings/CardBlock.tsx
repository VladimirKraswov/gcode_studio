import type { ReactNode } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

type CardBlockProps = {
  title?: string;
  children: ReactNode;
};

export function CardBlock({ title, children }: CardBlockProps) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        background: theme.panelSolid,
        border: `1px solid ${theme.border}`,
        borderRadius: 14,
        padding: 12,
        minWidth: 0,
      }}
    >
      {title && (
        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: theme.text,
            marginBottom: 10,
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}