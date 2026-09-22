import type { Analytics } from '../api/types'
import { AnalyticsPageShell } from '../components/AnalyticsPageShell'
import { BarList } from '../components/charts/BarList'
import { ChartCard } from '../components/charts/ChartCard'
import { DonutChart } from '../components/charts/DonutChart'
import { HeatmapGrid } from '../components/charts/HeatmapGrid'
import { StackedBars } from '../components/charts/StackedBars'
import { TrendChart } from '../components/charts/TrendChart'
import { yearProfessionStacks } from '../components/charts/yearStacks'
import { useAnalyticsScope } from '../hooks/useAnalyticsScope'
import { formatMonth, formatMonthShort, titleCase } from '../utils/format'

const TOP_COUNTRY_LIMIT = 12

function summarize(analytics: Analytics) {
  const { colors, groups } = yearProfessionStacks(analytics)
  const professions = analytics.byProfession.map((entry) => entry.label)

  const trend = analytics.byMonth.map((entry) => ({
    label: formatMonth(entry.year, entry.month),
    shortLabel: formatMonthShort(entry.year, entry.month),
    value: entry.count,
  }))

  const matrixCountries = analytics.byCountry
    .slice(0, 10)
    .map((entry) => entry.label)
    .filter((country) =>
      analytics.professionByCountry.some((cell) => cell.country === country),
    )

  const matrixLookup = new Map(
    analytics.professionByCountry.map((cell) => [`${cell.country}|${cell.profession}`, cell.count]),
  )

  const busiest = trend.reduce(
    (best, point) => (point.value > best.value ? point : best),
    { label: '—', shortLabel: '—', value: 0 },
  )

  return {
    colors,
    professions,
    trend,
    groups,
    matrixCountries,
    matrixLookup,
    busiest,
  }
}

export function AnalyticsHomePage() {
  const { professions, countries, toggleProfession, toggleCountry } = useAnalyticsScope()

  return (
    <AnalyticsPageShell eyebrow="Overview" title="Directory pulse">
      {({ analytics }) => {
        const view = summarize(analytics)
        return (
          <>
            <section className="kpi-row reveal-2" aria-label="Headline numbers">
              <article className="kpi">
                <p className="kpi__label">Users</p>
                <p className="kpi__value">{analytics.totalUsers.toLocaleString()}</p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Professions</p>
                <p className="kpi__value">{analytics.professionCount}</p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Countries</p>
                <p className="kpi__value">{analytics.countryCount.toLocaleString()}</p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Busiest month</p>
                <p className="kpi__value kpi__value--text">{view.busiest.label}</p>
              </article>
            </section>

            <div className="chart-grid reveal-3">
              <ChartCard
                title="Signups over time"
                description="Monthly joins across the whole date range, gaps included."
                span="full"
              >
                <TrendChart points={view.trend} caption="Monthly signups" />
              </ChartCard>

              <ChartCard
                title="Profession mix"
                description="Share of the directory held by each profession. Click a slice or legend item to filter."
              >
                <DonutChart
                  total={analytics.totalUsers}
                  caption="Users by profession"
                  selectedIds={professions}
                  onSelect={toggleProfession}
                  data={analytics.byProfession.map((entry) => ({
                    id: entry.label,
                    label: titleCase(entry.label),
                    value: entry.count,
                    color: view.colors.get(entry.label) ?? '#3b82f6',
                  }))}
                />
              </ChartCard>

              <ChartCard
                title="Intake by year"
                description="Same profession order in every bar (matches the legend). Hover a band for exact counts."
              >
                <StackedBars groups={view.groups} caption="Signups per year by profession" />
                <ul className="legend">
                  {view.professions.map((name) => (
                    <li
                      className={`legend__item is-clickable${professions.some((item) => item.toLowerCase() === name.toLowerCase()) ? ' is-selected' : ''}`}
                      key={name}
                      onClick={() => toggleProfession(name)}
                    >
                      <span
                        className="legend__swatch"
                        style={{ background: view.colors.get(name) }}
                        aria-hidden="true"
                      />
                      {titleCase(name)}
                    </li>
                  ))}
                </ul>
              </ChartCard>

              <ChartCard
                title="Geographic concentration"
                description={`Top ${TOP_COUNTRY_LIMIT} countries by user count. Click a row to toggle it in the country filter.`}
              >
                <BarList
                  total={analytics.totalUsers}
                  selectedIds={countries}
                  onSelect={toggleCountry}
                  items={analytics.byCountry.slice(0, TOP_COUNTRY_LIMIT).map((entry) => ({
                    id: entry.label,
                    label: titleCase(entry.label),
                    value: entry.count,
                  }))}
                />
              </ChartCard>

              <ChartCard
                title="Profession spread by country"
                description="Where each profession clusters, across the ten busiest countries."
              >
                <HeatmapGrid
                  rows={view.matrixCountries.map((name) => ({
                    key: name,
                    label: titleCase(name),
                  }))}
                  columns={view.professions.map((name) => ({
                    key: name,
                    label: titleCase(name),
                  }))}
                  valueAt={(row, column) => view.matrixLookup.get(`${row}|${column}`) ?? 0}
                />
              </ChartCard>
            </div>
          </>
        )
      }}
    </AnalyticsPageShell>
  )
}
