import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  description: string
  span?: 'full' | 'half'
  children: ReactNode
}

export function ChartCard({ title, description, span = 'half', children }: ChartCardProps) {
  return (
    <section className={`chart-card chart-card--${span}`}>
      <header className="chart-card__head">
        <h2 className="chart-card__title">{title}</h2>
        <p className="chart-card__description">{description}</p>
      </header>
      <div className="chart-card__body">{children}</div>
    </section>
  )
}
