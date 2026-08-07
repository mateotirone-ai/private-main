/**
 * Pure street rasterization — polylines, plaza, stubs. No snapping/straightening.
 */
export interface XZ {
  x: number;
  z: number;
}

export interface StreetCell {
  x: number;
  z: number;
  kind: "core" | "edge" | "plaza" | "well" | "stub" | "lantern";
  angleRad: number;
}

function dist2(a: XZ, b: XZ): number {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  return dx * dx + dz * dz;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Walk a polyline and stamp disks of the given half-width (no axis snap). */
export function rasterizePolyline(
  points: XZ[],
  width: number,
  kind: "core" | "stub" = "core"
): StreetCell[] {
  if (points.length < 2 || width <= 0) return [];
  const half = width / 2;
  const cells = new Map<string, StreetCell>();
  const stamp = (x: number, z: number, angleRad: number, cellKind: StreetCell["kind"]) => {
    const ix = Math.round(x);
    const iz = Math.round(z);
    const key = `${ix},${iz}`;
    const existing = cells.get(key);
    if (existing && existing.kind === "edge" && cellKind === "core") {
      cells.set(key, { x: ix, z: iz, kind: cellKind, angleRad });
      return;
    }
    if (!existing) cells.set(key, { x: ix, z: iz, kind: cellKind, angleRad });
  };

  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.sqrt(dist2(a, b));
    const steps = Math.max(1, Math.ceil(len * 2));
    const angleRad = Math.atan2(b.z - a.z, b.x - a.x);
    const nx = -Math.sin(angleRad);
    const nz = Math.cos(angleRad);
    for (let s = 0; s <= steps; s += 1) {
      const t = s / steps;
      const cx = lerp(a.x, b.x, t);
      const cz = lerp(a.z, b.z, t);
      for (let o = -half; o <= half; o += 0.5) {
        const px = cx + nx * o;
        const pz = cz + nz * o;
        const isEdge = Math.abs(o) >= half - 0.51;
        stamp(px, pz, angleRad, isEdge && kind === "core" ? "edge" : kind);
      }
    }
  }
  return [...cells.values()];
}

export function rasterizePlazaEllipse(
  center: XZ,
  radii: XZ
): StreetCell[] {
  const cells: StreetCell[] = [];
  const rx = Math.max(1, radii.x);
  const rz = Math.max(1, radii.z);
  for (let x = Math.floor(center.x - rx); x <= Math.ceil(center.x + rx); x += 1) {
    for (let z = Math.floor(center.z - rz); z <= Math.ceil(center.z + rz); z += 1) {
      const nx = (x - center.x) / rx;
      const nz = (z - center.z) / rz;
      if (nx * nx + nz * nz <= 1) {
        cells.push({ x, z, kind: "plaza", angleRad: 0 });
      }
    }
  }
  return cells;
}

export function nearestPointOnSegments(
  point: XZ,
  segments: Array<{ a: XZ; b: XZ }>
): { point: XZ; angleRad: number; distance: number; segmentIndex: number } | undefined {
  let best:
    | { point: XZ; angleRad: number; distance: number; segmentIndex: number }
    | undefined;
  for (let i = 0; i < segments.length; i += 1) {
    const { a, b } = segments[i]!;
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const len2 = abx * abx + abz * abz || 1;
    let t = ((point.x - a.x) * abx + (point.z - a.z) * abz) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = a.x + abx * t;
    const pz = a.z + abz * t;
    const distance = Math.sqrt(dist2(point, { x: px, z: pz }));
    const angleRad = Math.atan2(abz, abx);
    if (!best || distance < best.distance) {
      best = {
        point: { x: px, z: pz },
        angleRad,
        distance,
        segmentIndex: i,
      };
    }
  }
  return best;
}

export function segmentsFromPolylines(
  polylines: Array<{ points: XZ[] }>
): Array<{ a: XZ; b: XZ }> {
  const segments: Array<{ a: XZ; b: XZ }> = [];
  for (const line of polylines) {
    for (let i = 0; i < line.points.length - 1; i += 1) {
      segments.push({ a: line.points[i]!, b: line.points[i + 1]! });
    }
  }
  return segments;
}

/** Stub from gate to nearest street, joining at the street's local angle (crooked OK). */
export function stubPathCells(
  gate: XZ,
  streetSegments: Array<{ a: XZ; b: XZ }>,
  width = 2
): StreetCell[] {
  const nearest = nearestPointOnSegments(gate, streetSegments);
  if (!nearest) return [];
  return rasterizePolyline([gate, nearest.point], width, "stub");
}

export function lanternPostsAlongPolyline(
  points: XZ[],
  interval: number
): XZ[] {
  if (points.length < 2 || interval <= 0) return [];
  const posts: XZ[] = [];
  let traveled = 0;
  let nextAt = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const segLen = Math.sqrt(dist2(a, b));
    while (nextAt <= traveled + segLen) {
      const t = (nextAt - traveled) / (segLen || 1);
      posts.push({ x: lerp(a.x, b.x, t), z: lerp(a.z, b.z, t) });
      nextAt += interval;
    }
    traveled += segLen;
  }
  return posts.map((p) => ({ x: Math.round(p.x), z: Math.round(p.z) }));
}

/** Grade step: choose slab vs stair vs full block from dy between samples. */
export function streetGradeKind(
  dy: number,
  maxGrade: number
): "block" | "slab" | "stair" | "refuse" {
  const ady = Math.abs(dy);
  if (ady > maxGrade) return "refuse";
  if (ady <= 0.5) return "block";
  if (ady <= 1) return "slab";
  return "stair";
}
