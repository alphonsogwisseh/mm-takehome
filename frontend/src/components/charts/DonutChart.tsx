import { useState } from 'react'

export interface DonutSlice {
  id: string
  label: string
  value: number
  color: string
}

interface DonutChartProps {
  data: DonutSlice[]
  total: number
  caption: string
  selectedId?: string
  selectedIds?: string[]
  onSelect?: (id: string) => void
}

const SIZE = 220
const CENTER = SIZE / 2
const OUTER = 92
const INNER = 62

function polar(radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  }
}

function arcPath(start: number, end: number, outer: number, inner: number) {
  const largeArc = end - start > 180 ? 1 : 0
  const outerEnd = polar(outer, end)
  const outerStart = polar(outer, start)
  const innerStart = polar(inner, start)
  const innerEnd = polar(inner, end)

  return [
    `M ${outerEnd.x} ${outerEnd.y}`,
    `A ${outer} ${outer} 0 ${largeArc} 0 ${outerStart.x} ${outerStart.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${inner} ${inner} 0 ${largeArc} 1 ${innerEnd.x} ${innerEnd.y}`,
    'Z',
  ].join(' ')
}

export function DonutChart({
  data,
  total,
  caption,
  selectedId,
  selectedIds,
  onSelect,
}: DonutChartProps) {
  const [active, setActive] = useState<string | null>(null)

  const sum = data.reduce((acc, slice) => acc + slice.value, 0)
  const activeSlice = data.find((slice) => slice.id === active)
  const percentOf = (value: number) => (sum === 0 ? 0 : (value / sum) * 100)
  const interactive = Boolean(onSelect)
  const selectedSet = new Set(
    (selectedIds ?? (selectedId !== undefined ? [selectedId] : [])).map((id) => id.toLowerCase()),
  )
  const hasSelection = selectedSet.size > 0

  let cursor = 0
  const arcs = data.map((slice) => {
    const sweep = sum === 0 ? 0 : (slice.value / sum) * 360
    const start = cursor
    cursor += sweep
    return { slice, start, end: cursor }
  })

  const singleSlice = data.length === 1

  return (
    <div className="donut">
      <div className="donut__figure">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label={`${caption}. ${data
            .map((slice) => `${slice.label}: ${slice.value}`)
            .join(', ')}`}
        >
          {singleSlice ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={(OUTER + INNER) / 2}
              fill="none"
              stroke={data[0].color}
              strokeWidth={OUTER - INNER}
              className={interactive ? 'donut__arc' : undefined}
              style={interactive ? { cursor: 'pointer' } : undefined}
              onClick={() => onSelect?.(data[0].id)}
              onMouseEnter={() => setActive(data[0].id)}
              onMouseLeave={() => setActive(null)}
            />
          ) : (
            arcs.map(({ slice, start, end }) => {
              const isSelected = selectedSet.has(slice.id.toLowerCase())
              const highlighted = active === slice.id || isSelected
              const dimmed =
                (active !== null && active !== slice.id) ||
                (hasSelection && !isSelected && active === null)
              return (
                <path
                  key={slice.id}
                  className="donut__arc"
                  d={arcPath(start, end, highlighted ? OUTER + 5 : OUTER, INNER)}
                  fill={slice.color}
                  opacity={dimmed ? 0.24 : 1}
                  style={interactive ? { cursor: 'pointer' } : undefined}
                  onMouseEnter={() => setActive(slice.id)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => onSelect?.(slice.id)}
                />
              )
            })
          )}

          <text className="donut__value" x={CENTER} y={CENTER - 2} textAnchor="middle">
            {(activeSlice ? activeSlice.value : total).toLocaleString()}
          </text>
          <text className="donut__caption" x={CENTER} y={CENTER + 18} textAnchor="middle">
            {activeSlice ? `${percentOf(activeSlice.value).toFixed(1)}%` : 'users'}
          </text>
        </svg>
      </div>

      <ul className="donut__legend">
        {data.map((slice) => (
          <li
            key={slice.id}
            className={`donut__legend-item${active === slice.id || selectedSet.has(slice.id.toLowerCase()) ? ' is-active' : ''}${interactive ? ' is-clickable' : ''}`}
            onMouseEnter={() => setActive(slice.id)}
            onMouseLeave={() => setActive(null)}
            onClick={() => onSelect?.(slice.id)}
          >
            <span className="donut__swatch" style={{ background: slice.color }} aria-hidden="true" />
            <span className="donut__label">{slice.label}</span>
            <span className="donut__count">{slice.value.toLocaleString()}</span>
            <span className="donut__percent">{percentOf(slice.value).toFixed(1)}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
