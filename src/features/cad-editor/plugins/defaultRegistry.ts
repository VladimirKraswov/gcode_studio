import type { CadPlugin } from "./types";
import { createCadPluginRegistry } from "./registry";
import { builtinShapesPlugin } from "./builtinShapes";
import { builtinToolsPlugin } from "./builtinTools";

export function createDefaultCadRegistry(extraPlugins: CadPlugin[] = []) {
  return createCadPluginRegistry([
    builtinShapesPlugin,
    builtinToolsPlugin,
    ...extraPlugins,
  ]);
}