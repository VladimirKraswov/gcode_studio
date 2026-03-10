import type { ReactNode } from "react";

type CardBlockProps = {
  title?: string;
  children: ReactNode;
};

export function CardBlock({ title, children }: CardBlockProps) {
  return (
    <div className="ui-card-block">
      {title && <div className="ui-card-block-title">{title}</div>}
      {children}
    </div>
  );
}