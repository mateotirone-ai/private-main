/**
 * Pure terrain survey math — towns terrace; refuse bad slopes/unloaded.
 */
export type TerrainSurveyResult =
  | { ok: true; minY: number; maxY: number; variance: number; samples: number }
  | { ok: false; reason: "unloaded" | "slope"; message: string; variance?: number };

export function heightVariance(heights: number[]): number {
  if (!heights.length) return 0;
  let min = heights[0]!;
  let max = heights[0]!;
  for (const h of heights) {
    if (h < min) min = h;
    if (h > max) max = h;
  }
  return max - min;
}

export function medianHeight(heights: number[]): number {
  if (!heights.length) return 0;
  const sorted = [...heights].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
  }
  return sorted[mid]!;
}

export function evaluateTerrainSamples(
  samples: Array<number | undefined>,
  slopeToleranceY: number
): TerrainSurveyResult {
  if (!samples.length) {
    return {
      ok: false,
      reason: "unloaded",
      message: "Terrain survey found no samples — chunks may be unloaded.",
    };
  }
  if (samples.some((s) => s === undefined)) {
    return {
      ok: false,
      reason: "unloaded",
      message: "Terrain survey hit unloaded chunks — move closer and try again.",
    };
  }
  const heights = samples as number[];
  const variance = heightVariance(heights);
  const minY = Math.min(...heights);
  const maxY = Math.max(...heights);
  if (variance > slopeToleranceY) {
    return {
      ok: false,
      reason: "slope",
      message: `Site slope variance ${variance} exceeds layout tolerance ${slopeToleranceY}. Pick flatter ground.`,
      variance,
    };
  }
  return { ok: true, minY, maxY, variance, samples: heights.length };
}

/** Grid sample points every `step` across [0..areaX) × [0..areaZ). */
export function terrainSamplePoints(
  areaX: number,
  areaZ: number,
  step = 2
): Array<{ x: number; z: number }> {
  const points: Array<{ x: number; z: number }> = [];
  for (let x = 0; x < areaX; x += step) {
    for (let z = 0; z < areaZ; z += step) {
      points.push({ x, z });
    }
  }
  return points;
}

/** Retaining-edge cells: pad perimeter where neighbor outside pad is lower. */
export function retainingEdgeCells(
  pad: { x1: number; z1: number; x2: number; z2: number },
  padY: number,
  outsideY: (x: number, z: number) => number | undefined
): Array<{ x: number; z: number }> {
  const edges: Array<{ x: number; z: number }> = [];
  for (let x = pad.x1; x <= pad.x2; x += 1) {
    for (const z of [pad.z1, pad.z2]) {
      const oy = outsideY(x, z + (z === pad.z1 ? -1 : 1));
      if (oy !== undefined && oy < padY) edges.push({ x, z });
    }
  }
  for (let z = pad.z1; z <= pad.z2; z += 1) {
    for (const x of [pad.x1, pad.x2]) {
      const oy = outsideY(x + (x === pad.x1 ? -1 : 1), z);
      if (oy !== undefined && oy < padY) edges.push({ x, z });
    }
  }
  return edges;
}
