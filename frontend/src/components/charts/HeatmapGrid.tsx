export interface HeatmapAxis {
  key: string
  label: string
}

interface HeatmapGridProps {
  rows: HeatmapAxis[]
  columns: HeatmapAxis[]
  valueAt: (rowKey: string, columnKey: string) => number
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
                      style={{ '--intensity': value / peak } as React.CSSProperties}
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
