import { AnalyticsPageShell } from '../components/AnalyticsPageShell'
import { ChartCard } from '../components/charts/ChartCard'
import { StackedBars } from '../components/charts/StackedBars'
import { TrendChart } from '../components/charts/TrendChart'
import { yearProfessionStacks, yearTotalsFromMonthRows } from '../components/charts/yearStacks'
import { formatMonth, formatMonthShort, titleCase } from '../utils/format'

export function AnalyticsTimelinePage() {
  return (
    <AnalyticsPageShell eyebrow="Timeline" title="Joining patterns">
      {({ analytics }) => {
        const trend = analytics.byMonth.map((entry) => ({
          label: formatMonth(entry.year, entry.month),
          shortLabel: formatMonthShort(entry.year, entry.month),
          value: entry.count,
        }))

        const yearBars = yearTotalsFromMonthRows(analytics.byMonth)
        const { colors, groups: stacked } = yearProfessionStacks(analytics)

        const byYearMap = new Map(yearBars.map((group) => [Number(group.label), group.total]))
        const years = yearBars.map((group) => Number(group.label))

        const busiest = trend.reduce(
          (best, point) => (point.value > best.value ? point : best),
          { label: '—', shortLabel: '—', value: 0 },
        )
        const peakYear = years.reduce(
          (best, year) =>
            (byYearMap.get(year) ?? 0) > (byYearMap.get(best) ?? 0) ? year : best,
          years[0] ?? 0,
        )
        const quietest = trend
          .filter((point) => point.value > 0)
          .reduce(
            (best, point) => (point.value < best.value ? point : best),
            busiest,
          )

        return (
          <>
            <section className="kpi-row reveal-2" aria-label="Timeline headlines">
              <article className="kpi">
                <p className="kpi__label">Peak month</p>
                <p className="kpi__value kpi__value--text">{busiest.label}</p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Peak year</p>
                <p className="kpi__value">{peakYear || '—'}</p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Quietest active month</p>
                <p className="kpi__value kpi__value--text">{quietest.label}</p>
              </article>
            </section>

            <div className="chart-grid reveal-3">
              <ChartCard
                title="Monthly join line"
                description="Continuous timeline with empty months filled as zeros."
                span="full"
              >
                <TrendChart points={trend} caption="Monthly signups" />
              </ChartCard>

              <ChartCard
                title="Joins per year"
                description="Annual volume — useful for year-over-year planning."
              >
                <StackedBars groups={yearBars} caption="Joins per year" />
              </ChartCard>

              <ChartCard
                title="Yearly mix by profession"
                description="Same profession order in every bar. Hover a band for exact counts."
              >
                <StackedBars groups={stacked} caption="Yearly profession mix" />
                <ul className="legend">
                  {analytics.byProfession.map((entry) => (
                    <li className="legend__item" key={entry.label}>
                      <span
                        className="legend__swatch"
                        style={{ background: colors.get(entry.label) }}
                        aria-hidden="true"
                      />
                      {titleCase(entry.label)}
                    </li>
                  ))}
                </ul>
              </ChartCard>
            </div>
          </>
        )
      }}
    </AnalyticsPageShell>
  )
}
