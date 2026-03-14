// src/geometry/core/enums.ts

export enum ClipType {
  None,
  Intersection,
  Union,
  Difference,
  Xor,
}

export enum PathType {
  Subject,
  Clip,
}

export enum FillRule {
  EvenOdd,
  NonZero,
  Positive,
  Negative,
}

export enum PipResult {
  Inside,
  Outside,
  OnEdge,
}

export enum MidpointRounding {
  ToEven,
  AwayFromZero,
}