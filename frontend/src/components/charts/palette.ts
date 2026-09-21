/**
 * Chart series aligned with the blue dashboard accent — clear mid-tones.
 */
export const SERIES_COLORS = [
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
  '#8b5cf6', // violet
  '#14b8a6', // teal
  '#64748b', // slate
] as const

export function colorFor(index: number): string {
  return SERIES_COLORS[index % SERIES_COLORS.length]
}

/** Stable colour per series name so a profession keeps its hue across every chart. */
export function colorScale(keys: string[]): Map<string, string> {
  return new Map(keys.map((key, index) => [key, colorFor(index)]))
}
