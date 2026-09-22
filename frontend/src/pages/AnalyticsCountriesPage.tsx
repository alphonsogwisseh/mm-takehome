import { useQuery } from '@tanstack/react-query'
import type { Analytics, LabelCount } from '../api/types'
import { fetchAnalytics } from '../api/client'
import { AnalyticsPageShell } from '../components/AnalyticsPageShell'
import { BarList } from '../components/charts/BarList'
import { ChartCard } from '../components/charts/ChartCard'
import { WorldChoropleth } from '../components/charts/WorldChoropleth'
import { useAnalyticsScope } from '../hooks/useAnalyticsScope'
import { titleCase } from '../utils/format'

interface BreakdownRow {
  label: string
  count: number
}

interface CountryComparison {
  id: string
  label: string
  users: number
  professions: BreakdownRow[]
  cities: BreakdownRow[]
}

function buildCountryComparisons(
  selected: string[],
  mapCountries: LabelCount[],
  analytics: Analytics,
): { rows: CountryComparison[]; selectionTotal: number } {
  const countByCountry = new Map(
    mapCountries.map((entry) => [entry.label.toLowerCase(), entry.count]),
  )

  const rows = selected
    .map((country) => {
      const key = country.toLowerCase()
      const users = countByCountry.get(key) ?? 0

      const professions = analytics.professionByCountry
        .filter((cell) => cell.country.toLowerCase() === key)
        .map((cell) => ({
          label: titleCase(cell.profession),
          count: cell.count,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

      const cities = analytics.byCity
        .filter((entry) => entry.country.toLowerCase() === key)
        .map((entry) => ({
          label: titleCase(entry.city),
          count: entry.count,
        }))
        .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))

      return {
        id: country,
        label: titleCase(country),
        users,
        professions,
        cities,
      }
    })
    .sort((a, b) => b.users - a.users)

  const selectionTotal = rows.reduce((sum, row) => sum + row.users, 0)
  return { rows, selectionTotal }
}

function BreakdownList({
  title,
  rows,
  total,
}: {
  title: string
  rows: BreakdownRow[]
  total: number
}) {
  if (rows.length === 0) {
    return (
      <div className="country-compare__section">
        <h4 className="country-compare__section-title">{title}</h4>
        <p className="country-compare__empty">None in this report</p>
      </div>
    )
  }

  const peak = Math.max(...rows.map((row) => row.count), 1)

  return (
    <div className="country-compare__section">
      <h4 className="country-compare__section-title">{title}</h4>
      <ul className="country-compare__breakdown">
        {rows.map((row) => {
          const share = total === 0 ? 0 : (row.count / total) * 100
          return (
            <li key={row.label} className="country-compare__breakdown-row">
              <div className="country-compare__breakdown-meta">
                <span className="country-compare__breakdown-label">{row.label}</span>
                <span className="country-compare__breakdown-value">
                  {row.count.toLocaleString()}
                  <span>{share.toFixed(1)}%</span>
                </span>
              </div>
              <span className="country-compare__breakdown-track" aria-hidden="true">
                <span
                  className="country-compare__breakdown-fill"
                  style={{ width: `${(row.count / peak) * 100}%` }}
                />
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function AnalyticsCountriesPage() {
  const { professions, countries, toggleCountry } = useAnalyticsScope()

  const mapQuery = useQuery({
    queryKey: ['analytics', 'countries-map', professions],
    queryFn: () =>
      fetchAnalytics({
        professions: professions.length > 0 ? professions : undefined,
      }),
  })

  return (
    <AnalyticsPageShell eyebrow="Countries" title="Country report">
      {({ analytics }) => {
        const mapCountries = mapQuery.data?.byCountry ?? analytics.byCountry
        const comparison =
          countries.length >= 2
            ? buildCountryComparisons(countries, mapCountries, analytics)
            : null

        return (
          <>
            <section className="kpi-row kpi-row--2 reveal-2" aria-label="Country report headlines">
              <article className="kpi">
                <p className="kpi__label">Countries</p>
                <p className="kpi__value">{analytics.countryCount.toLocaleString()}</p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Cities</p>
                <p className="kpi__value">{analytics.cityCount.toLocaleString()}</p>
              </article>
            </section>

            <div className="chart-grid reveal-3">
              <ChartCard
                title="World map"
                description="Click countries to add or remove them from the selection. Map stays global so you can keep comparing."
                span="full"
              >
                <WorldChoropleth
                  caption="Users by country"
                  selectedCountries={countries}
                  onCountryToggle={toggleCountry}
                  items={mapCountries.map((entry) => ({
                    label: entry.label,
                    count: entry.count,
                  }))}
                />
              </ChartCard>

              {comparison && (
                <>
                  <ChartCard
                    title="Headcount comparison"
                    description="Selected countries ranked by users in the current report filters."
                    span="full"
                  >
                    <BarList
                      total={comparison.selectionTotal}
                      selectedIds={countries}
                      onSelect={toggleCountry}
                      items={comparison.rows.map((row) => ({
                        id: row.id,
                        label: row.label,
                        value: row.users,
                      }))}
                    />
                  </ChartCard>

                  <ChartCard
                    title="Side-by-side"
                    description="Full profession and city breakdown for each selected country."
                    span="full"
                  >
                    <div className="country-compare" role="list">
                      {comparison.rows.map((row, index) => {
                        const share =
                          comparison.selectionTotal === 0
                            ? 0
                            : (row.users / comparison.selectionTotal) * 100
                        return (
                          <article
                            key={row.id}
                            className="country-compare__card"
                            role="listitem"
                          >
                            <header className="country-compare__head">
                              <span className="country-compare__rank">#{index + 1}</span>
                              <h3 className="country-compare__name">{row.label}</h3>
                            </header>
                            <p className="country-compare__users">
                              {row.users.toLocaleString()}
                              <span>users · {share.toFixed(1)}% of selection</span>
                            </p>
                            <BreakdownList
                              title={`Professions (${row.professions.length})`}
                              rows={row.professions}
                              total={row.users}
                            />
                            <BreakdownList
                              title={`Cities (${row.cities.length})`}
                              rows={row.cities}
                              total={row.users}
                            />
                          </article>
                        )
                      })}
                    </div>
                  </ChartCard>
                </>
              )}
            </div>
          </>
        )
      }}
    </AnalyticsPageShell>
  )
}
