import type { CSSProperties } from 'react'

export interface HeatmapAxis {
  key: string
  label: string
}

interface HeatmapGridProps {
  rows: HeatmapAxis[]
  columns: HeatmapAxis[]
  valueAt: (rowKey: string, columnKey: string) => number
}

function readCssColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function parseRgbChannels(color: string): [number, number, number] {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const full =
      hex.length === 3
        ? hex
            .split('')
            .map((ch) => ch + ch)
            .join('')
        : hex.slice(0, 6)
    return [
      Number.parseInt(full.slice(0, 2), 16),
      Number.parseInt(full.slice(2, 4), 16),
      Number.parseInt(full.slice(4, 6), 16),
    ]
  }

  const match = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i)
  if (match) {
    return [Number(match[1]), Number(match[2]), Number(match[3])]
  }

  return [59, 130, 246]
}

function mixRgb(
  from: [number, number, number],
  to: [number, number, number],
  amount: number,
): string {
  const t = Math.min(1, Math.max(0, amount))
  const channel = (a: number, b: number) => Math.round(a + (b - a) * t)
  return `rgb(${channel(from[0], to[0])}, ${channel(from[1], to[1])}, ${channel(from[2], to[2])})`
}

function heatStyles(intensity: number): CSSProperties {
  const accent = parseRgbChannels(readCssColor('--accent', '#3b82f6'))
  const tint = parseRgbChannels(readCssColor('--accent-tint', '#eff6ff'))
  const ink = parseRgbChannels(readCssColor('--ink', '#0f172a'))
  const amount = 0.22 + intensity * 0.58
  return {
    ['--heat-bg' as string]: mixRgb(tint, accent, amount),
    ['--heat-fg' as string]: mixRgb(ink, [255, 255, 255], 0.55 + intensity * 0.45),
  }
}

export function HeatmapGrid({ rows, columns, valueAt }: HeatmapGridProps) {
  if (rows.length === 0 || columns.length === 0) {
    return <p className="chart-empty">Not enough data to build a matrix.</p>
  }

  const peak = Math.max(
    ...rows.flatMap((row) => columns.map((column) => valueAt(row.key, column.key))),
    1,
  )

  return (
    <div className="heatmap">
      <table className="heatmap__table">
        <thead>
          <tr>
            <th scope="col">Country</th>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
            <th scope="col" className="heatmap__total">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const values = columns.map((column) => valueAt(row.key, column.key))
            return (
              <tr key={row.key}>
                <th scope="row">{row.label}</th>
                {values.map((value, index) => (
                  <td key={columns[index].key}>
                    <span
                      className={`heatmap__cell${value === 0 ? ' is-empty' : ''}`}
                      style={value === 0 ? undefined : heatStyles(value / peak)}
                    >
                      {value}
                    </span>
                  </td>
                ))}
                <td className="heatmap__total">
                  {values.reduce((sum, value) => sum + value, 0)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
