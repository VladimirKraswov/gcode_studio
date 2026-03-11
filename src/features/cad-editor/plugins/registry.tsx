import { createContext, useContext } from "react";
import type { PropsWithChildren } from "react";
import type {
  AnyShapePlugin,
  CadPlugin,
  CommandPlugin,
  ToolPlugin,
} from "./types";
import type { SketchShape, SketchShapeType, SketchTool } from "../model/types";

export type CadPluginRegistry = {
  plugins: CadPlugin[];
  shapePlugins: Map<SketchShapeType, AnyShapePlugin>;
  toolPlugins: Map<SketchTool, ToolPlugin>;
  commandPlugins: Map<string, CommandPlugin>;
};

export function createCadPluginRegistry(
  plugins: CadPlugin[],
): CadPluginRegistry {
  const shapePlugins = new Map<SketchShapeType, AnyShapePlugin>();
  const toolPlugins = new Map<SketchTool, ToolPlugin>();
  const commandPlugins = new Map<string, CommandPlugin>();

  for (const plugin of plugins) {
    for (const shape of plugin.shapes ?? []) {
      shapePlugins.set(shape.type as SketchShapeType, shape);
    }

    for (const tool of plugin.tools ?? []) {
      toolPlugins.set(tool.id, tool);
    }

    for (const command of plugin.commands ?? []) {
      commandPlugins.set(command.id, command);
    }
  }

  return {
    plugins,
    shapePlugins,
    toolPlugins,
    commandPlugins,
  };
}

export function getShapePlugin(
  registry: CadPluginRegistry,
  shape: SketchShape,
): AnyShapePlugin | undefined {
  return registry.shapePlugins.get(shape.type as SketchShapeType);
}

export function getToolPlugins(registry: CadPluginRegistry): ToolPlugin[] {
  return [...registry.toolPlugins.values()].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
}

const CadRegistryContext = createContext<CadPluginRegistry | null>(null);

export function CadRegistryProvider({
  registry,
  children,
}: PropsWithChildren<{ registry: CadPluginRegistry }>) {
  return (
    <CadRegistryContext.Provider value={registry}>
      {children}
    </CadRegistryContext.Provider>
  );
}

export function useCadRegistry(): CadPluginRegistry {
  const registry = useContext(CadRegistryContext);

  if (!registry) {
    throw new Error(
      "CadRegistryProvider is missing. Wrap CAD UI with <CadRegistryProvider registry={...}>.",
    );
  }

  return registry;
}

export function useShapePlugin(shape: SketchShape): AnyShapePlugin | undefined {
  const registry = useCadRegistry();
  return getShapePlugin(registry, shape);
}

export function useToolPlugins(): ToolPlugin[] {
  const registry = useCadRegistry();
  return getToolPlugins(registry);
}