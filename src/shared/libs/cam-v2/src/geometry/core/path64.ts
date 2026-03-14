// src/geometry/core/path64.ts

import { MidpointRounding } from "./enums";
import { midPointRound } from "./internalMath";

export interface IPoint64 {
  x: number;
  y: number;
}

export function pointsEqual64(
  lhs: IPoint64 | undefined,
  rhs: IPoint64 | undefined
): boolean {
  return !!lhs && !!rhs && lhs.x === rhs.x && lhs.y === rhs.y;
}

export function pointsNotEqual64(
  lhs: IPoint64 | undefined,
  rhs: IPoint64 | undefined
): boolean {
  return !pointsEqual64(lhs, rhs);
}

export class Path64 extends Array<IPoint64> {}

export class Paths64 extends Array<Path64> {}

export class Point64 implements IPoint64 {
  public x: number;
  public y: number;

  constructor(xOrPt?: number | Point64, yOrScale?: number) {
    if (typeof xOrPt === "number" && typeof yOrScale === "number") {
      this.x = midPointRound(xOrPt, MidpointRounding.AwayFromZero);
      this.y = midPointRound(yOrScale, MidpointRounding.AwayFromZero);
    } else {
      const pt = xOrPt as Point64;
      if (pt && yOrScale !== undefined) {
        this.x = midPointRound(pt.x * yOrScale, MidpointRounding.AwayFromZero);
        this.y = midPointRound(pt.y * yOrScale, MidpointRounding.AwayFromZero);
      } else if (pt) {
        this.x = pt.x;
        this.y = pt.y;
      } else {
        this.x = 0;
        this.y = 0;
      }
    }
  }

  public static equals(lhs: IPoint64, rhs: IPoint64): boolean {
    return lhs.x === rhs.x && lhs.y === rhs.y;
  }

  public static notEquals(lhs: IPoint64, rhs: IPoint64): boolean {
    return lhs.x !== rhs.x || lhs.y !== rhs.y;
  }

  public static add(lhs: Point64, rhs: Point64): Point64 {
    return new Point64(lhs.x + rhs.x, lhs.y + rhs.y);
  }

  public static subtract(lhs: Point64, rhs: Point64): Point64 {
    return new Point64(lhs.x - rhs.x, lhs.y - rhs.y);
  }

  public toString(): string {
    return `${this.x},${this.y} `;
  }

  public equals(obj: Point64): boolean {
    return obj instanceof Point64 ? Point64.equals(this, obj) : false;
  }
}