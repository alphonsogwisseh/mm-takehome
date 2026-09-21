import { useQuery } from '@tanstack/react-query'
import { fetchAnalytics } from '../api/client'
import { AnalyticsPageShell } from '../components/AnalyticsPageShell'
import { BarList } from '../components/charts/BarList'
import { ChartCard } from '../components/charts/ChartCard'
import { WorldChoropleth } from '../components/charts/WorldChoropleth'
import { useAnalyticsScope } from '../hooks/useAnalyticsScope'
import { titleCase } from '../utils/format'

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

        return (
          <>
            <section className="kpi-row reveal-2" aria-label="Country headlines">
              <article className="kpi">
                <p className="kpi__label">Countries</p>
                <p className="kpi__value">{analytics.countryCount.toLocaleString()}</p>
                <p className="kpi__note">
                  {countries.length > 0 ? 'in selection' : 'represented'}
                </p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Cities</p>
                <p className="kpi__value">{analytics.cityCount.toLocaleString()}</p>
                <p className="kpi__note">
                  {countries.length > 0 ? 'across selected countries' : 'across the directory'}
                </p>
              </article>
              <article className="kpi">
                <p className="kpi__label">Selected</p>
                <p className="kpi__value">{countries.length || 'All'}</p>
                <p className="kpi__note">
                  {countries.length > 0 ? 'countries on the map' : 'no country filter'}
                </p>
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
