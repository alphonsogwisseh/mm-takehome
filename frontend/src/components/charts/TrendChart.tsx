import { useId, useState } from 'react'

export interface TrendPoint {
  label: string
  shortLabel: string
  value: number
}

interface TrendChartProps {
  points: TrendPoint[]
  caption: string
  color?: string
}

const WIDTH = 760
const HEIGHT = 260
const PAD = { top: 18, right: 16, bottom: 34, left: 44 }

function niceCeiling(value: number): number {
  if (value <= 5) return 5
  const magnitude = 10 ** Math.floor(Math.log10(value))
  return Math.ceil(value / magnitude) * magnitude
}

export function TrendChart({ points, caption, color = '#3b82f6' }: TrendChartProps) {
  const gradientId = useId()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (points.length === 0) {
    return <p className="chart-empty">No activity in this selection.</p>
  }

  const plotWidth = WIDTH - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const maxValue = niceCeiling(Math.max(...points.map((point) => point.value), 1))

  const x = (index: number) =>
    PAD.left + (points.length === 1 ? plotWidth / 2 : (index / (points.length - 1)) * plotWidth)
  const y = (value: number) => PAD.top + plotHeight - (value / maxValue) * plotHeight

  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${x(index)} ${y(point.value)}`).join(' ')
  const area = `${line} L ${x(points.length - 1)} ${PAD.top + plotHeight} L ${x(0)} ${PAD.top + plotHeight} Z`

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    value: Math.round(maxValue * ratio),
    y: PAD.top + plotHeight - ratio * plotHeight,
  }))

  // Label roughly six evenly spaced points so a long timeline stays legible.
  const labelStep = Math.max(1, Math.ceil(points.length / 6))
  const active = activeIndex === null ? null : points[activeIndex]

  function handleMove(event: React.PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = ((event.clientX - bounds.left) / bounds.width) * WIDTH
    const position = ((ratio - PAD.left) / plotWidth) * (points.length - 1)
    const index = Math.min(points.length - 1, Math.max(0, Math.round(position)))
    setActiveIndex(index)
  }

  return (
    <div className="trend">
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${caption}. Peak of ${Math.max(...points.map((point) => point.value))} in ${
          points.reduce((best, point) => (point.value > best.value ? point : best)).label
        }.`}
        onPointerMove={handleMove}
        onPointerLeave={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.22" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick.y}>
            <line
              className="trend__grid"
              x1={PAD.left}
              x2={WIDTH - PAD.right}
              y1={tick.y}
              y2={tick.y}
            />
            <text className="trend__axis" x={PAD.left - 10} y={tick.y + 4} textAnchor="end">
              {tick.value}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path className="trend__line" d={line} fill="none" stroke={color} />

        {points.map((point, index) =>
          index % labelStep === 0 ? (
            <text
              key={point.label}
              className="trend__axis"
              x={x(index)}
              y={HEIGHT - 12}
              textAnchor="middle"
            >
              {point.shortLabel}
            </text>
          ) : null,
        )}

        {active && activeIndex !== null ? (
          <g>
            <line
              className="trend__cursor"
              x1={x(activeIndex)}
              x2={x(activeIndex)}
              y1={PAD.top}
              y2={PAD.top + plotHeight}
            />
            <circle
              className="trend__dot"
              cx={x(activeIndex)}
              cy={y(active.value)}
              r="5"
              fill={color}
            />
          </g>
        ) : null}
      </svg>

      <p className="trend__readout" aria-live="polite">
        {active ? (
          <>
            <strong>{active.value.toLocaleString()}</strong> joined in {active.label}
          </>
        ) : (
          <span className="trend__hint">Hover the chart for monthly totals</span>
        )}
      </p>
    </div>
  )
}
