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

export function pointDistance(a: CadPointLike, b: CadPointLike): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function pointToSegmentDistance(
  point: CadPointLike,
  start: CadPointLike,
  end: CadPointLike,
): number {
  const abx = end.x - start.x;
  const aby = end.y - start.y;
  const apx = point.x - start.x;
  const apy = point.y - start.y;
  const ab2 = abx * abx + aby * aby;

  if (ab2 === 0) {
    return pointDistance(point, start);
  }

  const t = Math.max(0, Math.min(1, (apx * abx + apy * aby) / ab2));

  return pointDistance(point, {
    x: start.x + abx * t,
    y: start.y + aby * t,
  });
}

export function normalizeAngle360(angleDeg: number): number {
  const value = angleDeg % 360;
  return value < 0 ? value + 360 : value;
}

export function angleDegFromCenter(
  center: CadPointLike,
  point: CadPointLike,
): number {
  return normalizeAngle360(
    (Math.atan2(point.y - center.y, point.x - center.x) * 180) / Math.PI,
  );
}

export function isAngleOnArc(
  angleDeg: number,
  startAngleDeg: number,
  endAngleDeg: number,
  clockwise: boolean,
): boolean {
  const angle = normalizeAngle360(angleDeg);
  const start = normalizeAngle360(startAngleDeg);
  const end = normalizeAngle360(endAngleDeg);

  if (!clockwise) {
    if (start <= end) {
      return angle >= start && angle <= end;
    }
    return angle >= start || angle <= end;
  }

  if (end <= start) {
    return angle <= start && angle >= end;
  }
  return angle <= start || angle >= end;
}

export function arcStartPoint(
  center: CadPointLike,
  radius: number,
  startAngleDeg: number,
): CadPointLike {
  const t = (startAngleDeg * Math.PI) / 180;
  return {
    x: round(center.x + Math.cos(t) * radius),
    y: round(center.y + Math.sin(t) * radius),
  };
}

export function arcEndPoint(
  center: CadPointLike,
  radius: number,
  endAngleDeg: number,
): CadPointLike {
  const t = (endAngleDeg * Math.PI) / 180;
  return {
    x: round(center.x + Math.cos(t) * radius),
    y: round(center.y + Math.sin(t) * radius),
  };
}

export function sampleArcPoints(
  center: CadPointLike,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  clockwise: boolean,
  segments = 64,
): CadPointLike[] {
  const start = normalizeAngle360(startAngleDeg);
  const end = normalizeAngle360(endAngleDeg);

  let sweep: number;
  if (!clockwise) {
    sweep = end >= start ? end - start : 360 - start + end;
  } else {
    sweep = start >= end ? start - end : 360 - end + start;
    sweep *= -1;
  }

  const points: CadPointLike[] = [];

  for (let i = 0; i <= segments; i += 1) {
    const angle = start + (sweep * i) / segments;
    const rad = (angle * Math.PI) / 180;

    points.push({
      x: round(center.x + Math.cos(rad) * radius),
      y: round(center.y + Math.sin(rad) * radius),
    });
  }

  return points;
}

export function pointToArcDistance(
  point: CadPointLike,
  center: CadPointLike,
  radius: number,
  startAngleDeg: number,
  endAngleDeg: number,
  clockwise: boolean,
): number {
  const angle = angleDegFromCenter(center, point);
  const radialDistance = Math.abs(pointDistance(point, center) - radius);

  if (isAngleOnArc(angle, startAngleDeg, endAngleDeg, clockwise)) {
    return radialDistance;
  }

  const startPoint = arcStartPoint(center, radius, startAngleDeg);
  const endPoint = arcEndPoint(center, radius, endAngleDeg);

  return Math.min(
    pointDistance(point, startPoint),
    pointDistance(point, endPoint),
  );
}