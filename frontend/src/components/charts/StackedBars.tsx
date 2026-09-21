import { useState } from 'react'

export interface StackedGroup {
  label: string
  total: number
  segments: { key: string; value: number; color: string }[]
}

interface StackedBarsProps {
  groups: StackedGroup[]
  caption: string
}

export function StackedBars({ groups, caption }: StackedBarsProps) {
  const [active, setActive] = useState<{
    year: string
    key: string
    value: number
    total: number
  } | null>(null)

  if (groups.length === 0) {
    return <p className="chart-empty">No activity in this selection.</p>
  }

  const tallest = Math.max(...groups.map((group) => group.total), 1)

  return (
    <div className="stack-wrap">
      <div
        className="stack"
        role="img"
        aria-label={`${caption}. ${groups
          .map((group) => `${group.label}: ${group.total}`)
          .join(', ')}`}
      >
        {groups.map((group) => (
          <div className="stack__column" key={group.label}>
            <span className="stack__total">{group.total.toLocaleString()}</span>
            <div className="stack__bar" style={{ height: `${(group.total / tallest) * 100}%` }}>
              {group.segments.map((segment) => {
                const share = group.total === 0 ? 0 : (segment.value / group.total) * 100
                const isActive =
                  active?.year === group.label && active.key === segment.key

                return (
                  <div
                    key={segment.key}
                    className={`stack__segment${isActive ? ' is-active' : ''}`}
                    style={{
                      height: `${share}%`,
                      background: segment.color,
                      opacity: active && !isActive ? 0.35 : 1,
                    }}
                    onMouseEnter={() =>
                      setActive({
                        year: group.label,
                        key: segment.key,
                        value: segment.value,
                        total: group.total,
                      })
                    }
                    onMouseLeave={() => setActive(null)}
                    title={`${segment.key}: ${segment.value.toLocaleString()} in ${group.label}`}
                  />
                )
              })}
            </div>
            <span className="stack__label">{group.label}</span>
          </div>
        ))}
      </div>

      <p className="stack__readout" aria-live="polite">
        {active ? (
          <>
            <strong>{active.key}</strong>
            {' · '}
            {active.value.toLocaleString()} joined in {active.year}
            {' · '}
            {active.total === 0
              ? '0%'
              : `${((active.value / active.total) * 100).toFixed(1)}% of that year`}
          </>
        ) : (
          <span className="trend__hint">Hover a segment to see profession counts by year</span>
        )}
      </p>
    </div>
  )
}
