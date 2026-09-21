import { useEffect, useRef } from 'react'
import type { FilterOptions } from '../api/types'
import { titleCase } from '../utils/format'
import { CloseIcon } from './icons'
import { MultiCombobox } from './MultiCombobox'

interface MemberToolbarProps {
  search: string
  professions: string[]
  countries: string[]
  dateCreatedFrom: string
  dateCreatedTo: string
  filterOptions?: FilterOptions
  onSearchChange: (value: string) => void
  onProfessionsChange: (values: string[]) => void
  onCountriesChange: (values: string[]) => void
  onDateCreatedFromChange: (value: string) => void
  onDateCreatedToChange: (value: string) => void
  onClearAll: () => void
}

export function MemberToolbar({
  search,
  professions,
  countries,
  dateCreatedFrom,
  dateCreatedTo,
  filterOptions,
  onSearchChange,
  onProfessionsChange,
  onCountriesChange,
  onDateCreatedFromChange,
  onDateCreatedToChange,
  onClearAll,
}: MemberToolbarProps) {
  const searchRef = useRef<HTMLInputElement>(null)
  const hasFilters = Boolean(
    search || professions.length > 0 || countries.length > 0 || dateCreatedFrom || dateCreatedTo,
  )

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const tag = (event.target as HTMLElement | null)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      event.preventDefault()
      searchRef.current?.focus()
    }
    document.addEventListener('keydown', focusSearch)
    return () => document.removeEventListener('keydown', focusSearch)
  }, [])

  return (
    <aside className="filters-panel reveal-2" aria-label="Filters">
      <div className="filters-panel__head">
        <h2 className="filters-panel__title">Filters</h2>
        {hasFilters ? (
          <button type="button" className="filters__clear" onClick={onClearAll}>
            Reset
          </button>
        ) : null}
      </div>

      <div className="filters-panel__fields">
        <div className="field">
          <label htmlFor="search">Search</label>
          <div className="search">
            <input
              id="search"
              ref={searchRef}
              type="search"
              placeholder="Name or email"
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
            />
            {search ? (
              <button
                type="button"
                className="search__clear"
                aria-label="Clear search"
                onClick={() => onSearchChange('')}
              >
                <CloseIcon />
              </button>
            ) : null}
          </div>
        </div>

        <div className="field">
          <label htmlFor="filter-profession">Profession</label>
          <MultiCombobox
            id="filter-profession"
            label="Professions"
            placeholder="All professions"
            values={professions}
            options={filterOptions?.professions ?? []}
            formatOption={titleCase}
            onChange={onProfessionsChange}
          />
        </div>

        <div className="field">
          <label htmlFor="filter-country">Country</label>
          <MultiCombobox
            id="filter-country"
            label="Countries"
            placeholder="All countries"
            values={countries}
            options={filterOptions?.countries ?? []}
            formatOption={titleCase}
            onChange={onCountriesChange}
          />
        </div>

        <div className="field">
          <label htmlFor="dateCreatedFrom">Created from</label>
          <input
            id="dateCreatedFrom"
            type="date"
            value={dateCreatedFrom}
            max={dateCreatedTo || undefined}
            onChange={(event) => onDateCreatedFromChange(event.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="dateCreatedTo">Created to</label>
          <input
            id="dateCreatedTo"
            type="date"
            value={dateCreatedTo}
            min={dateCreatedFrom || undefined}
            onChange={(event) => onDateCreatedToChange(event.target.value)}
          />
        </div>
      </div>
    </aside>
  )
}
