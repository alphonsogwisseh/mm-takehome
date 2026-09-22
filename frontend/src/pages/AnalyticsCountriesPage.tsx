import { useQuery } from '@tanstack/react-query'
import type { Analytics, LabelCount } from '../api/types'
import { fetchAnalytics } from '../api/client'
import { AnalyticsPageShell } from '../components/AnalyticsPageShell'
import { BarList } from '../components/charts/BarList'
import { ChartCard } from '../components/charts/ChartCard'
import { WorldChoropleth } from '../components/charts/WorldChoropleth'
import { useAnalyticsScope } from '../hooks/useAnalyticsScope'
import { titleCase } from '../utils/format'

function buildCountryComparisons(
  selected: string[],
  mapCountries: LabelCount[],
  analytics: Analytics,
) {
  const countByCountry = new Map(
    mapCountries.map((entry) => [entry.label.toLowerCase(), entry.count]),
  )

  const rows = selected
    .map((country) => {
      const key = country.toLowerCase()
      const users = countByCountry.get(key) ?? 0
      const topCity = analytics.byCity.find((entry) => entry.country.toLowerCase() === key)
      const topProfession = analytics.professionByCountry
        .filter((cell) => cell.country.toLowerCase() === key)
        .sort((a, b) => b.count - a.count)[0]

      return {
        id: country,
        label: titleCase(country),
        users,
        topCity: topCity ? titleCase(topCity.city) : '—',
        topCityCount: topCity?.count ?? 0,
        topProfession: topProfession ? titleCase(topProfession.profession) : '—',
        topProfessionCount: topProfession?.count ?? 0,
      }
    })
    .sort((a, b) => b.users - a.users)

  const selectionTotal = rows.reduce((sum, row) => sum + row.users, 0)

  return { rows, selectionTotal }
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
    <AnalyticsPageShell eyebrow="Countries" title="Geographic footprint">
      {({ analytics }) => {
        const mapCountries = mapQuery.data?.byCountry ?? analytics.byCountry
        const comparison =
          countries.length >= 2
            ? buildCountryComparisons(countries, mapCountries, analytics)
            : null

        return (
          <>
            <section className="kpi-row reveal-2" aria-label="Country headlines">
              <article className="kpi">
                <p className="kpi__label">Countries</p>
                <p className="kpi__value">{analytics.countryCount.toLocaleString()}</p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Cities</p>
                <p className="kpi__value">{analytics.cityCount.toLocaleString()}</p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Selected</p>
                <p className="kpi__value">{countries.length || 'All'}</p>
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
                    description="Selected countries ranked by users in the current profession scope."
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
                    description="Users, share of the selection, leading city, and leading profession for each country."
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
                              <span>users</span>
                            </p>
                            <dl className="country-compare__stats">
                              <div>
                                <dt>Of selection</dt>
                                <dd>{share.toFixed(1)}%</dd>
                              </div>
                              <div>
                                <dt>Top city</dt>
                                <dd>
                                  {row.topCity}
                                  {row.topCityCount > 0
                                    ? ` · ${row.topCityCount.toLocaleString()}`
                                    : ''}
                                </dd>
                              </div>
                              <div>
                                <dt>Top profession</dt>
                                <dd>
                                  {row.topProfession}
                                  {row.topProfessionCount > 0
                                    ? ` · ${row.topProfessionCount.toLocaleString()}`
                                    : ''}
                                </dd>
                              </div>
                            </dl>
                          </article>
                        )
                      })}
                    </div>
                  </ChartCard>
                </>
              )}

              <ChartCard
                title="Cities"
                description={
                  countries.length > 0
                    ? `Top cities inside ${countries.length === 1 ? titleCase(countries[0]) : `${countries.length} selected countries`}.`
                    : 'Top cities across the full directory. Select countries on the map to narrow this list.'
                }
                span="full"
              >
                <BarList
                  total={analytics.totalUsers}
                  items={analytics.byCity.slice(0, 20).map((entry) => ({
                    label:
                      countries.length === 1
                        ? titleCase(entry.city)
                        : `${titleCase(entry.city)} · ${titleCase(entry.country)}`,
                    value: entry.count,
                  }))}
                />
              </ChartCard>
            </div>
          </>
        )
      }}
    </AnalyticsPageShell>
  )
}
