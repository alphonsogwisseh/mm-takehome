import { useState } from 'react'

export interface PieSlice {
  id: string
  label: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieSlice[]
  caption: string
  selectedId?: string
  selectedIds?: string[]
  onSelect?: (id: string) => void
}

const SIZE = 220
const CENTER = SIZE / 2
const RADIUS = 92

function polar(radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180
  return {
    x: CENTER + radius * Math.cos(radians),
    y: CENTER + radius * Math.sin(radians),
  }
}

function wedgePath(start: number, end: number) {
  if (end - start >= 359.999) {
    return ''
  }
  const largeArc = end - start > 180 ? 1 : 0
  const startPoint = polar(RADIUS, end)
  const endPoint = polar(RADIUS, start)
  return [
    `M ${CENTER} ${CENTER}`,
    `L ${startPoint.x} ${startPoint.y}`,
    `A ${RADIUS} ${RADIUS} 0 ${largeArc} 0 ${endPoint.x} ${endPoint.y}`,
    'Z',
  ].join(' ')
}

export function PieChart({ data, caption, selectedId, selectedIds, onSelect }: PieChartProps) {
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
  const wedges = data.map((slice) => {
    const sweep = sum === 0 ? 0 : (slice.value / sum) * 360
    const start = cursor
    cursor += sweep
    return { slice, start, end: cursor }
  })

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
          {data.length === 1 ? (
            <circle
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill={data[0].color}
              style={interactive ? { cursor: 'pointer' } : undefined}
              onClick={() => onSelect?.(data[0].id)}
              onMouseEnter={() => setActive(data[0].id)}
              onMouseLeave={() => setActive(null)}
            />
          ) : (
            wedges.map(({ slice, start, end }) => {
              const isSelected = selectedSet.has(slice.id.toLowerCase())
              const dimmed =
                (active !== null && active !== slice.id) ||
                (hasSelection && !isSelected && active === null)
              return (
                <path
                  key={slice.id}
                  className="donut__arc"
                  d={wedgePath(start, end)}
                  fill={slice.color}
                  opacity={dimmed ? 0.28 : 1}
                  style={interactive ? { cursor: 'pointer' } : undefined}
                  onMouseEnter={() => setActive(slice.id)}
                  onMouseLeave={() => setActive(null)}
                  onClick={() => onSelect?.(slice.id)}
                />
              )
            })
          )}
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

      {activeSlice ? (
        <p className="pie__readout">
          <strong>{activeSlice.label}</strong> · {percentOf(activeSlice.value).toFixed(1)}%
        </p>
      ) : null}
    </div>
  )
}
