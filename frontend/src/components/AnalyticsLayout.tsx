import { useQuery } from "@tanstack/react-query";
import { NavLink, Outlet } from "react-router-dom";
import { useMemo, useState } from "react";
import { fetchAnalytics, fetchFilterOptions } from "../api/client";
import { MultiCombobox } from "./MultiCombobox";
import { AnalyticsScopeContext } from "../hooks/useAnalyticsScope";
import { titleCase } from "../utils/format";

const NAV = [
  {
    to: "/report",
    end: true,
    label: "Overview",
    hint: "Report KPIs and headline charts",
  },
  {
    to: "/report/professions",
    end: false,
    label: "Professions",
    hint: "Profession mix in this report",
  },
  {
    to: "/report/countries",
    end: false,
    label: "Countries",
    hint: "Map and country comparison",
  },
] as const;

function toggleInList(current: string[], value: string): string[] {
  const exists = current.some(
    (item) => item.toLowerCase() === value.toLowerCase(),
  );
  return exists
    ? current.filter((item) => item.toLowerCase() !== value.toLowerCase())
    : [...current, value];
}

export function AnalyticsLayout() {
  const [professions, setProfessions] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);

  const filtersQuery = useQuery({
    queryKey: ["filters"],
    queryFn: fetchFilterOptions,
  });

  const analyticsQuery = useQuery({
    queryKey: ["analytics", professions, countries],
    queryFn: () =>
      fetchAnalytics({
        professions: professions.length > 0 ? professions : undefined,
        countries: countries.length > 0 ? countries : undefined,
      }),
  });

  const scopeValue = useMemo(
    () => ({
      professions,
      countries,
      setProfessions,
      setCountries,
      setCountry: (value: string) => {
        setCountries(value ? [value] : []);
      },
      toggleCountry: (value: string) => {
        setCountries((current) => toggleInList(current, value));
      },
      toggleProfession: (value: string) => {
        setProfessions((current) => toggleInList(current, value));
      },
      clearScope: () => {
        setProfessions([]);
        setCountries([]);
      },
      clearCountries: () => setCountries([]),
      clearProfessions: () => setProfessions([]),
      analytics: analyticsQuery.data,
      isLoading: analyticsQuery.isLoading,
      isError: analyticsQuery.isError,
      error:
        analyticsQuery.error instanceof Error ? analyticsQuery.error : null,
      countryOptions: filtersQuery.data?.countries ?? [],
    }),
    [
      professions,
      countries,
      analyticsQuery.data,
      analyticsQuery.isLoading,
      analyticsQuery.isError,
      analyticsQuery.error,
      filtersQuery.data?.countries,
    ],
  );

  const hasFilters = Boolean(professions.length > 0 || countries.length > 0);

  return (
    <AnalyticsScopeContext.Provider value={scopeValue}>
      <div className="analytics-layout">
        <aside className="analytics-nav" aria-label="Report sections">
          <p className="analytics-nav__eyebrow">Report</p>
          <nav className="analytics-nav__list">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `analytics-nav__link${isActive ? " is-active" : ""}`
                }
              >
                <span className="analytics-nav__label">{item.label}</span>
                <span className="analytics-nav__hint">{item.hint}</span>
              </NavLink>
            ))}
          </nav>

          <div className="analytics-nav__scope">
            <div className="analytics-nav__scope-head">
              <p className="analytics-nav__scope-title">Report filters</p>
              {hasFilters ? (
                <button
                  type="button"
                  className="filters__clear"
                  onClick={scopeValue.clearScope}
                >
                  Reset
                </button>
              ) : null}
            </div>
            <div className="field">
              <label htmlFor="report-profession">Profession</label>
              <MultiCombobox
                id="report-profession"
                label="Professions"
                placeholder="All professions"
                values={professions}
                options={filtersQuery.data?.professions ?? []}
                formatOption={titleCase}
                onChange={setProfessions}
              />
            </div>
            <div className="field">
              <label htmlFor="report-country">Country</label>
              <MultiCombobox
                id="report-country"
                label="Countries"
                placeholder="All countries"
                values={countries}
                options={filtersQuery.data?.countries ?? []}
                formatOption={titleCase}
                onChange={setCountries}
              />
            </div>
          </div>
        </aside>

        <div className="analytics-main">
          <Outlet />
        </div>
      </div>
    </AnalyticsScopeContext.Provider>
  );
}
