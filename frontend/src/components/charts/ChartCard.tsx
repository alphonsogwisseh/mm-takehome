import type { ReactNode } from 'react'

interface ChartCardProps {
  title: string
  description: string
  span?: 'full' | 'half'
  actions?: ReactNode
  children: ReactNode
}

export function ChartCard({ title, description, span = 'half', actions, children }: ChartCardProps) {
  return (
    <section className={`chart-card chart-card--${span}`}>
      <header className={`chart-card__head${actions ? ' chart-card__head--split' : ''}`}>
        <div className="chart-card__intro">
          <h2 className="chart-card__title">{title}</h2>
          <p className="chart-card__description">{description}</p>
        </div>
        {actions ? <div className="chart-card__actions">{actions}</div> : null}
      </header>
      <div className="chart-card__body">{children}</div>
    </section>
  )
}
