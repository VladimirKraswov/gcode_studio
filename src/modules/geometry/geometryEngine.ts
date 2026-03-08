import {
  AcGeMatrix2d,
  AcGePoint2d,
  type AcGePoint2dLike,
} from "@mlightcad/geometry-engine";

export type CadPointLike = {
  x: number;
  y: number;
};

export type Bounds2DLike = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

function round(value: number): number {
  return Number(value.toFixed(3));
}

export function toAcGePoint2d(point: AcGePoint2dLike): AcGePoint2d {
  return new AcGePoint2d(point.x, point.y);
}

export function fromAcGePoint2d(point: AcGePoint2dLike): CadPointLike {
  return {
    x: round(point.x),
    y: round(point.y),
  };
}

export function makeTranslationMatrix(dx: number, dy: number): AcGeMatrix2d {
  return new AcGeMatrix2d().makeTranslation(dx, dy);
}

export function makeRotationMatrix(angleDeg: number): AcGeMatrix2d {
  const radians = (angleDeg * Math.PI) / 180;
  return new AcGeMatrix2d().makeRotation(radians);
}

export function makeScaleMatrix(sx: number, sy: number): AcGeMatrix2d {
  return new AcGeMatrix2d().makeScale(sx, sy);
}

export function multiplyMatrices(...matrices: AcGeMatrix2d[]): AcGeMatrix2d {
  const result = new AcGeMatrix2d();

  for (const matrix of matrices) {
    result.multiply(matrix);
  }

  return result;
}

export function transformCadPoint(
  point: CadPointLike,
  matrix: AcGeMatrix2d,
): CadPointLike {
  const transformed = toAcGePoint2d(point).applyMatrix2d(matrix);
  return fromAcGePoint2d(transformed);
}

export function translateCadPoint(
  point: CadPointLike,
  dx: number,
  dy: number,
): CadPointLike {
  return transformCadPoint(point, makeTranslationMatrix(dx, dy));
}

export function rotateCadPoint(
  point: CadPointLike,
  origin: CadPointLike,
  angleDeg: number,
): CadPointLike {
  if (!angleDeg) {
    return {
      x: round(point.x),
      y: round(point.y),
    };
  }

  const matrix = multiplyMatrices(
    makeTranslationMatrix(origin.x, origin.y),
    makeRotationMatrix(angleDeg),
    makeTranslationMatrix(-origin.x, -origin.y),
  );

  return transformCadPoint(point, matrix);
}

export function scaleCadPoint(
  point: CadPointLike,
  origin: CadPointLike,
  sx: number,
  sy: number,
): CadPointLike {
  const matrix = multiplyMatrices(
    makeTranslationMatrix(origin.x, origin.y),
    makeScaleMatrix(sx, sy),
    makeTranslationMatrix(-origin.x, -origin.y),
  );

  return transformCadPoint(point, matrix);
}

export function boundsFromPoints(points: CadPointLike[]): Bounds2DLike {
  return {
    minX: Math.min(...points.map((point) => point.x)),
    minY: Math.min(...points.map((point) => point.y)),
    maxX: Math.max(...points.map((point) => point.x)),
    maxY: Math.max(...points.map((point) => point.y)),
  };
}