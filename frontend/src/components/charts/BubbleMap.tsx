import { useState } from 'react'

export interface BubbleItem {
  label: string
  value: number
  color: string
}

interface BubbleMapProps {
  items: BubbleItem[]
  caption: string
}

/** Deterministic pseudo-map so country bubbles stay put across renders. */
function seededPoint(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33 + seed.charCodeAt(i)) >>> 0
  }
  const x = 10 + (hash % 80)
  const y = 12 + ((hash >>> 9) % 70)
  return { x, y }
}

export function BubbleMap({ items, caption }: BubbleMapProps) {
  const [active, setActive] = useState<string | null>(null)

  if (items.length === 0) {
    return <p className="chart-empty">No geographic data in this selection.</p>
  }

  const peak = Math.max(...items.map((item) => item.value), 1)
  const activeItem = items.find((item) => item.label === active)

  return (
    <div className="bubble-map">
      <svg
        className="bubble-map__canvas"
        viewBox="0 0 100 100"
        role="img"
        aria-label={`${caption}. ${items
          .slice(0, 8)
          .map((item) => `${item.label}: ${item.value}`)
          .join(', ')}`}
      >
        <rect className="bubble-map__ocean" x="0" y="0" width="100" height="100" rx="4" />
        {[20, 40, 60, 80].map((y) => (
          <line key={y} className="bubble-map__grid" x1="4" x2="96" y1={y} y2={y} />
        ))}
        {[25, 50, 75].map((x) => (
          <line key={x} className="bubble-map__grid" x1={x} x2={x} y1="4" y2="96" />
        ))}

        {items.map((item) => {
          const point = seededPoint(item.label)
          const radius = 2.2 + Math.sqrt(item.value / peak) * 7.5
          const dimmed = active !== null && active !== item.label
          return (
            <g
              key={item.label}
              className="bubble-map__node"
              opacity={dimmed ? 0.22 : 1}
              onMouseEnter={() => setActive(item.label)}
              onMouseLeave={() => setActive(null)}
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={radius}
                fill={item.color}
                fillOpacity="0.78"
                stroke={item.color}
                strokeWidth="0.4"
              />
              {radius > 5.5 ? (
                <text
                  className="bubble-map__label"
                  x={point.x}
                  y={point.y + 0.8}
                  textAnchor="middle"
                >
                  {item.value}
                </text>
              ) : null}
            </g>
          )
        })}
      </svg>

      <p className="bubble-map__readout" aria-live="polite">
        {activeItem ? (
          <>
            <strong>{activeItem.label}</strong> — {activeItem.value.toLocaleString()} users
          </>
        ) : (
          <span className="trend__hint">Hover a bubble for country totals</span>
        )}
      </p>
    </div>
  )
}
