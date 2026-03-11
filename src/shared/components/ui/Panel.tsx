import React from "react";

type PanelVariant = "default" | "inset" | "solid" | "muted";

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: PanelVariant;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ variant = "default", className = "", ...props }, ref) => {
    const variantStyles = {
      default: "ui-panel",
      inset: "ui-panel-inset",
      solid: "ui-panel border border-border bg-panel-solid",
      muted: "ui-panel-inset border border-border bg-panel-muted",
    };

    return (
      <div
        ref={ref}
        className={`${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  }
);

Panel.displayName = "Panel";
