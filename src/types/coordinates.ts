export type CadPoint2 = {
  x: number;
  y: number;
};

export type SvgPoint2 = {
  x: number;
  y: number;
};

/**
 * Внутренняя плоская система CAD.
 *
 * - origin: левый нижний угол листа/заготовки
 * - +X: вправо
 * - +Y: вверх
 *
 * Для 2.5D-редактора это основная «истина» в плоскости.
 * Она хорошо дружит и с математикой, и с G-code:
 * machine.X = cad.X, machine.Y = cad.Y.
 */
export type CadSpace = "cad";

/**
 * Экранная / SVG система.
 *
 * - origin: левый верхний угол viewport
 * - +X: вправо
 * - +Y: вниз
 */
export type SvgSpace = "svg";

/**
 * Станочная плоскость XY.
 *
 * - origin: левый нижний угол рабочей области
 * - +X: вправо
 * - +Y: вперёд (от оператора внутрь станка)
 */
export type MachinePlanarSpace = "machine-xy";