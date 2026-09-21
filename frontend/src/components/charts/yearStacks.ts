import type { Analytics } from '../../api/types'
import { titleCase } from '../../utils/format'
import type { StackedGroup } from './StackedBars'
import { colorScale } from './palette'

/** Build year stacks with a fixed profession order (same as the overall ranking / legend). */
export function yearProfessionStacks(analytics: Analytics): {
  colors: Map<string, string>
  groups: StackedGroup[]
} {
  const professions = analytics.byProfession.map((entry) => entry.label)
  const colors = colorScale(professions)
  const years = [...new Set(analytics.byYearAndProfession.map((entry) => entry.year))].sort(
    (a, b) => a - b,
  )

  const byYear = new Map<number, Map<string, number>>()
  for (const entry of analytics.byYearAndProfession) {
    const bucket = byYear.get(entry.year) ?? new Map<string, number>()
    bucket.set(entry.profession, entry.count)
    byYear.set(entry.year, bucket)
  }

  const groups: StackedGroup[] = years.map((year) => {
    const bucket = byYear.get(year) ?? new Map<string, number>()
    const segments = professions
      .map((profession) => ({
        key: titleCase(profession),
        value: bucket.get(profession) ?? 0,
        color: colors.get(profession) ?? '#3b82f6',
      }))
      .filter((segment) => segment.value > 0)

    return {
      label: String(year),
      total: segments.reduce((sum, segment) => sum + segment.value, 0),
      segments,
    }
  })

  return { colors, groups }
}

export function yearTotalsFromMonthRows(
  byMonth: { year: number; count: number }[],
): StackedGroup[] {
  const byYear = new Map<number, number>()
  for (const entry of byMonth) {
    byYear.set(entry.year, (byYear.get(entry.year) ?? 0) + entry.count)
  }
  return [...byYear.keys()]
    .sort((a, b) => a - b)
    .map((year) => ({
      label: String(year),
      total: byYear.get(year) ?? 0,
      segments: [
        {
          key: String(year),
          value: byYear.get(year) ?? 0,
          color: '#3b82f6',
        },
      ],
    }))
}
