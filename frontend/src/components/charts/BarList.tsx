export interface BarListItem {
  id?: string
  label: string
  value: number
  href?: string
}

interface BarListProps {
  items: BarListItem[]
  total: number
  selectedId?: string
  selectedIds?: string[]
  onSelect?: (id: string) => void
}

export function BarList({ items, total, selectedId, selectedIds, onSelect }: BarListProps) {
  if (items.length === 0) {
    return <p className="chart-empty">Nothing to rank in this selection.</p>
  }

  const largest = Math.max(...items.map((item) => item.value), 1)
  const interactive = Boolean(onSelect)
  const selectedSet = new Set(
    (selectedIds ?? (selectedId !== undefined ? [selectedId] : [])).map((id) => id.toLowerCase()),
  )

  return (
    <ol className="bar-list">
      {items.map((item, index) => {
        const id = item.id ?? item.label
        const selected = selectedSet.has(id.toLowerCase())
        return (
          <li
            className={`bar-list__row${selected ? ' is-selected' : ''}${interactive ? ' is-clickable' : ''}`}
            key={id}
            onClick={() => onSelect?.(id)}
          >
            <span className="bar-list__rank">{index + 1}</span>
            <span className="bar-list__label">{item.label}</span>
            <span className="bar-list__track">
              <span
                className="bar-list__fill"
                style={{ width: `${(item.value / largest) * 100}%` }}
              />
            </span>
            <span className="bar-list__value">{item.value.toLocaleString()}</span>
            <span className="bar-list__share">
              {total === 0 ? '0%' : `${((item.value / total) * 100).toFixed(1)}%`}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
