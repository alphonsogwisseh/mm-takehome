import type { MonthCount } from '../api/types'

export type TrendPreset = 'week' | 'month' | 'year' | '3y' | '5y' | 'all' | 'custom'

export const TREND_PRESETS: { id: Exclude<TrendPreset, 'custom'>; label: string }[] = [
  { id: 'week', label: '1W' },
  { id: 'month', label: '1M' },
  { id: 'year', label: '1Y' },
  { id: '3y', label: '3Y' },
  { id: '5y', label: '5Y' },
  { id: 'all', label: 'All' },
]

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function parseIso(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function toIso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function addDays(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function addMonths(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

function addYears(date: Date, amount: number): Date {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + amount)
  return next
}

export function todayIso(now: Date = new Date()): string {
  return toIso(now)
}

/** First day of the first month → last day of the last month in the series. */
export function boundsFromMonths(
  byMonth: MonthCount[],
): { earliest: string; latest: string } | null {
  if (byMonth.length === 0) return null
  const first = byMonth[0]
  const last = byMonth[byMonth.length - 1]
  return {
    earliest: `${first.year}-${pad(first.month)}-01`,
    latest: `${last.year}-${pad(last.month)}-${pad(daysInMonth(last.year, last.month))}`,
  }
}

/**
 * Rolling presets end on `today`.
 * `all` uses the data span (earliest → latest in the series) for the default view.
 */
export function rangeForPreset(
  preset: Exclude<TrendPreset, 'custom'>,
  earliest: string,
  latest: string,
  today: string = todayIso(),
): { from: string; to: string } {
  if (preset === 'all') {
    return { from: earliest, to: latest }
  }

  const end = parseIso(today)
  let start: Date
  switch (preset) {
    case 'week':
      start = addDays(end, -6)
      break
    case 'month':
      start = addMonths(end, -1)
      break
    case 'year':
      start = addYears(end, -1)
      break
    case '3y':
      start = addYears(end, -3)
      break
    case '5y':
      start = addYears(end, -5)
      break
  }

  return {
    from: toIso(start),
    to: today,
  }
}

export function monthOverlapsRange(
  year: number,
  month: number,
  from: string,
  to: string,
): boolean {
  const monthStart = `${year}-${pad(month)}-01`
  const monthEnd = `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`
  return monthStart <= to && monthEnd >= from
}

export function filterMonthsByRange<T extends { year: number; month: number }>(
  months: T[],
  from: string,
  to: string,
): T[] {
  if (!from || !to) return months
  const start = from <= to ? from : to
  const end = from <= to ? to : from
  return months.filter((entry) => monthOverlapsRange(entry.year, entry.month, start, end))
}
