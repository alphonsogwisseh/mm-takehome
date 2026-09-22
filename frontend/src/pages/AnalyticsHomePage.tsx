import { useEffect, useMemo, useState } from 'react'
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
import {
  TREND_PRESETS,
  boundsFromMonths,
  filterMonthsByRange,
  rangeForPreset,
  todayIso,
  type TrendPreset,
} from '../utils/trendRange'

const TOP_COUNTRY_LIMIT = 12

function summarize(analytics: Analytics) {
  const { colors, groups } = yearProfessionStacks(analytics)
  const professions = analytics.byProfession.map((entry) => entry.label)

  const matrixCountries = analytics.byCountry
    .slice(0, 10)
    .map((entry) => entry.label)
    .filter((country) =>
      analytics.professionByCountry.some((cell) => cell.country === country),
    )

  const matrixLookup = new Map(
    analytics.professionByCountry.map((cell) => [`${cell.country}|${cell.profession}`, cell.count]),
  )

  const trendAll = analytics.byMonth.map((entry) => ({
    label: formatMonth(entry.year, entry.month),
    shortLabel: formatMonthShort(entry.year, entry.month),
    value: entry.count,
  }))

  const busiest = trendAll.reduce(
    (best, point) => (point.value > best.value ? point : best),
    { label: '—', shortLabel: '—', value: 0 },
  )

  return {
    colors,
    professions,
    groups,
    matrixCountries,
    matrixLookup,
    busiest,
  }
}

function OverviewBody({ analytics }: { analytics: Analytics }) {
  const { professions, countries, toggleProfession, toggleCountry } = useAnalyticsScope()
  const [preset, setPreset] = useState<TrendPreset>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const view = useMemo(() => summarize(analytics), [analytics])
  const bounds = useMemo(() => boundsFromMonths(analytics.byMonth), [analytics.byMonth])
  const today = useMemo(() => todayIso(), [])

  useEffect(() => {
    if (!bounds) {
      setFrom('')
      setTo('')
      return
    }
    if (preset === 'custom') {
      setFrom((current) => {
        const value = current || bounds.earliest
        if (value < bounds.earliest) return bounds.earliest
        if (value > today) return today
        return value
      })
      setTo((current) => {
        const value = current || today
        if (value < bounds.earliest) return bounds.earliest
        if (value > today) return today
        return value
      })
      return
    }
    const next = rangeForPreset(preset, bounds.earliest, bounds.latest, today)
    setFrom(next.from)
    setTo(next.to)
  }, [bounds, preset, today])

  const trend = useMemo(() => {
    const months = filterMonthsByRange(analytics.byMonth, from, to)
    return months.map((entry) => ({
      label: formatMonth(entry.year, entry.month),
      shortLabel: formatMonthShort(entry.year, entry.month),
      value: entry.count,
    }))
  }, [analytics.byMonth, from, to])

  const rangeLabel =
    from && to
      ? `${formatMonth(Number(from.slice(0, 4)), Number(from.slice(5, 7)))} – ${formatMonth(Number(to.slice(0, 4)), Number(to.slice(5, 7)))}`
      : 'full history'

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
          description={`Monthly joins for ${rangeLabel}. Empty months stay filled as zeros.`}
          span="full"
          actions={
            bounds ? (
              <div className="trend-range">
                <div className="trend-range__presets" role="group" aria-label="Trend range">
                  {TREND_PRESETS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      className={`trend-range__preset${preset === option.id ? ' is-active' : ''}`}
                      onClick={() => setPreset(option.id)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <div className="trend-range__custom">
                  <label className="trend-range__field">
                    <span className="sr-only">From</span>
                    <input
                      type="date"
                      value={from}
                      min={bounds.earliest}
                      max={to && to < today ? to : today}
                      onChange={(event) => {
                        setPreset('custom')
                        setFrom(event.target.value)
                      }}
                    />
                  </label>
                  <span className="trend-range__sep" aria-hidden="true">
                    –
                  </span>
                  <label className="trend-range__field">
                    <span className="sr-only">To</span>
                    <input
                      type="date"
                      value={to}
                      min={from && from > bounds.earliest ? from : bounds.earliest}
                      max={today}
                      onChange={(event) => {
                        setPreset('custom')
                        setTo(event.target.value)
                      }}
                    />
                  </label>
                </div>
              </div>
            ) : null
          }
        >
          <TrendChart points={trend} caption="Monthly signups" />
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
}

export function AnalyticsHomePage() {
  return (
    <AnalyticsPageShell title="Overview">
      {({ analytics }) => <OverviewBody analytics={analytics} />}
    </AnalyticsPageShell>
  )
}
