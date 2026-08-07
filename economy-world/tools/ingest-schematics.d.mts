export function trueFootprintWithMargin(
  blocks: unknown[],
  width: number,
  length: number,
  margin?: number
): [number, number];

export function appendRegistryEntryIfMissing(
  registry: { structures?: Array<Record<string, unknown>> },
  id: string,
  padSize: [number, number]
): boolean;

export function ingestSchematics(): Promise<{
  converted: number;
  autoAddedIds?: string[];
}>;
