import React from "react";

export const Separator: React.FC<{ className?: string; orientation?: "horizontal" | "vertical" }> = ({
  className = "",
  orientation = "horizontal"
}) => {
  return (
    <div
      className={`${orientation === "horizontal" ? "h-px w-full" : "w-px h-full"} bg-border shrink-0 ${className}`}
    />
  );
};
