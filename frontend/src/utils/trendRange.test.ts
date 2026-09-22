import { describe, expect, it } from 'vitest'
import {
  boundsFromMonths,
  filterMonthsByRange,
  monthOverlapsRange,
  rangeForPreset,
} from './trendRange'

const series = [
  { year: 2020, month: 1, count: 2 },
  { year: 2020, month: 2, count: 0 },
  { year: 2021, month: 3, count: 5 },
  { year: 2022, month: 6, count: 1 },
]

describe('boundsFromMonths', () => {
  it('uses the first and last month in the series', () => {
    expect(boundsFromMonths(series)).toEqual({
      earliest: '2020-01-01',
      latest: '2022-06-30',
    })
  })
})

describe('rangeForPreset', () => {
  it('uses the data span only for all', () => {
    expect(rangeForPreset('all', '2020-01-01', '2022-06-30', '2026-09-22')).toEqual({
      from: '2020-01-01',
      to: '2022-06-30',
    })
  })

  it('ends rolling windows on today', () => {
    expect(rangeForPreset('week', '2020-01-01', '2022-06-30', '2026-09-22')).toEqual({
      from: '2026-09-16',
      to: '2026-09-22',
    })
    expect(rangeForPreset('year', '2018-01-01', '2022-06-30', '2026-09-22')).toEqual({
      from: '2025-09-22',
      to: '2026-09-22',
    })
    expect(rangeForPreset('5y', '2020-01-01', '2022-06-30', '2026-09-22')).toEqual({
      from: '2021-09-22',
      to: '2026-09-22',
    })
  })
})

describe('filterMonthsByRange', () => {
  it('keeps months that overlap the selected window', () => {
    expect(filterMonthsByRange(series, '2021-01-01', '2021-12-31')).toEqual([
      { year: 2021, month: 3, count: 5 },
    ])
  })

  it('includes a month that only partially overlaps', () => {
    expect(monthOverlapsRange(2020, 1, '2020-01-15', '2020-01-20')).toBe(true)
    expect(filterMonthsByRange(series, '2020-01-15', '2020-01-20')).toEqual([
      { year: 2020, month: 1, count: 2 },
    ])
  })
})
