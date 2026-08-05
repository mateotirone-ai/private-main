/**
 * World-state adapter: persists JSON state blobs to world dynamic properties.
 * Bedrock caps a single dynamic property at ~32KB, so blobs are chunked.
 * Pure serialization logic is exported for tests; the world binding is thin.
 */
import { world } from "@minecraft/server";

const CHUNK = 30000; // stay under the property size cap

export function saveBlob(key: string, value: unknown): void {
  const json = JSON.stringify(value);
  const parts = Math.ceil(json.length / CHUNK) || 1;
  world.setDynamicProperty(`${key}:n`, parts);
  for (let i = 0; i < parts; i++) {
    world.setDynamicProperty(`${key}:${i}`, json.slice(i * CHUNK, (i + 1) * CHUNK));
  }
}

export function loadBlob<T>(key: string): T | undefined {
  const parts = world.getDynamicProperty(`${key}:n`);
  if (typeof parts !== "number") return undefined;
  let json = "";
  for (let i = 0; i < parts; i++) {
    const p = world.getDynamicProperty(`${key}:${i}`);
    if (typeof p !== "string") return undefined;
    json += p;
  }
  return JSON.parse(json) as T;
}
