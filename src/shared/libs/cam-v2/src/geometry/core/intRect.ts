// src/geometry/core/intRect.ts

import { Path64, Point64, IPoint64 } from "./path64";

export class Rect64 {
  public left: number;
  public top: number;
  public right: number;
  public bottom: number;

  constructor(lOrIsValidOrRec?: number | boolean | Rect64, t?: number, r?: number, b?: number) {
    if (typeof lOrIsValidOrRec === "boolean") {
      if (lOrIsValidOrRec) {
        this.left = 0;
        this.top = 0;
        this.right = 0;
        this.bottom = 0;
      } else {
        this.left = Number.MAX_SAFE_INTEGER;
        this.top = Number.MAX_SAFE_INTEGER;
        this.right = Number.MIN_SAFE_INTEGER;
        this.bottom = Number.MIN_SAFE_INTEGER;
      }
    } else if (typeof lOrIsValidOrRec === "number") {
      this.left = lOrIsValidOrRec;
      this.top = t as number;
      this.right = r as number;
      this.bottom = b as number;
    } else if (lOrIsValidOrRec) {
      this.left = lOrIsValidOrRec.left;
      this.top = lOrIsValidOrRec.top;
      this.right = lOrIsValidOrRec.right;
      this.bottom = lOrIsValidOrRec.bottom;
    } else {
      this.left = 0;
      this.top = 0;
      this.right = 0;
      this.bottom = 0;
    }
  }

  public get width(): number {
    return this.right - this.left;
  }

  public set width(value: number) {
    this.right = this.left + value;
  }

  public get height(): number {
    return this.bottom - this.top;
  }

  public set height(value: number) {
    this.bottom = this.top + value;
  }

  public isEmpty(): boolean {
    return this.bottom <= this.top || this.right <= this.left;
  }

  public midPoint(): Point64 {
    return new Point64((this.left + this.right) / 2, (this.top + this.bottom) / 2);
  }

  public contains(pt: IPoint64): boolean {
    return pt.x > this.left && pt.x < this.right && pt.y > this.top && pt.y < this.bottom;
  }

  public containsRect(rec: Rect64): boolean {
    return rec.left >= this.left && rec.right <= this.right && rec.top >= this.top && rec.bottom <= this.bottom;
  }

  public intersects(rec: Rect64): boolean {
    return (
      Math.max(this.left, rec.left) <= Math.min(this.right, rec.right) &&
      Math.max(this.top, rec.top) <= Math.min(this.bottom, rec.bottom)
    );
  }

  public asPath(): Path64 {
    const result = new Path64();
    result.push(new Point64(this.left, this.top));
    result.push(new Point64(this.right, this.top));
    result.push(new Point64(this.right, this.bottom));
    result.push(new Point64(this.left, this.bottom));
    return result;
  }
}