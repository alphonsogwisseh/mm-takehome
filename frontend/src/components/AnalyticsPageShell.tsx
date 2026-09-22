import type { ReactNode } from 'react'
import { useAnalyticsScope } from '../hooks/useAnalyticsScope'
import { PageTitle } from './PageTitle'
import { titleCase } from '../utils/format'

interface AnalyticsPageShellProps {
  eyebrow?: string
  title: string
  children: (args: {
    analytics: NonNullable<ReturnType<typeof useAnalyticsScope>['analytics']>
  }) => ReactNode
}

export function AnalyticsPageShell({ eyebrow, title, children }: AnalyticsPageShellProps) {
  const {
    analytics,
    isLoading,
    isError,
    error,
    professions,
    countries,
    clearScope,
    clearCountries,
    clearProfessions,
  } = useAnalyticsScope()

  const hasScope = Boolean(professions.length > 0 || countries.length > 0)

  return (
    <>
      <PageTitle
        eyebrow={eyebrow}
        title={title}
        meta={
          analytics
            ? `${analytics.totalUsers.toLocaleString()} users${hasScope ? ' in current scope' : ' across the full directory'}`
            : 'Loading aggregates…'
        }
      />

      {hasScope ? (
        <div className="scope-banner reveal-2" role="status" aria-label="Active filters">
          <div className="scope-banner__copy">
            <p className="scope-banner__label">Filtered to</p>
            <ul className="scope-banner__chips">
              {professions.map((profession) => (
                <li className="scope-chip" key={profession}>
                  <span className="scope-chip__key">Profession</span>
                  <span className="scope-chip__value">{titleCase(profession)}</span>
                </li>
              ))}
              {countries.map((country) => (
                <li className="scope-chip" key={country}>
                  <span className="scope-chip__key">Country</span>
                  <span className="scope-chip__value">{titleCase(country)}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="scope-banner__actions">
            {professions.length > 0 ? (
              <button
                type="button"
                className="btn btn--secondary scope-banner__reset"
                onClick={clearProfessions}
              >
                Clear professions
              </button>
            ) : null}
            {countries.length > 0 ? (
              <button
                type="button"
                className="btn btn--secondary scope-banner__reset"
                onClick={clearCountries}
              >
                Clear countries
              </button>
            ) : null}
            <button type="button" className="btn btn--secondary scope-banner__reset" onClick={clearScope}>
              Clear filters
            </button>
          </div>
        </div>
      ) : null}

      {isLoading ? (
        <div className="status-block">Loading…</div>
      ) : isError || !analytics ? (
        <div className="status-block status-block--error">
          {error?.message ?? 'Unable to load analytics'}
        </div>
      ) : analytics.totalUsers === 0 ? (
        <div className="status-block">No users match this scope.</div>
      ) : (
        children({ analytics })
      )}
    </>
  )
}
