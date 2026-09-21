import { describe, expect, it } from 'vitest'
import {
  buildCountryCountLookup,
  fillForCount,
  normalizeCountryName,
  seedLabelForAtlasName,
} from './countryMap'

describe('normalizeCountryName', () => {
  it('strips case and punctuation', () => {
    expect(normalizeCountryName('AndorrA')).toBe('andorra')
    expect(normalizeCountryName('Moldova, Republic of')).toBe('moldova republic of')
  })
})

describe('buildCountryCountLookup', () => {
  const atlas = [
    'Andorra',
    'United States of America',
    'Czechia',
    'Canada',
    'Central African Rep.',
  ]

  it('maps seed labels onto atlas names', () => {
    const lookup = buildCountryCountLookup(
      [
        { label: 'AndorrA', count: 4 },
        { label: 'United States', count: 10 },
        { label: 'Czech Republic', count: 3 },
        { label: 'Canada', count: 6 },
        { label: 'Central African Republic', count: 2 },
      ],
      atlas,
    )

    expect(lookup.get('Andorra')).toBe(4)
    expect(lookup.get('United States of America')).toBe(10)
    expect(lookup.get('Czechia')).toBe(3)
    expect(lookup.get('Canada')).toBe(6)
    expect(lookup.get('Central African Rep.')).toBe(2)
  })

  it('resolves atlas clicks back to seed labels', () => {
    expect(
      seedLabelForAtlasName(
        'United States of America',
        ['United States', 'Canada'],
        ['United States of America', 'Canada'],
      ),
    ).toBe('United States')
  })
})

describe('fillForCount', () => {
  it('returns a muted fill for empty countries', () => {
    expect(fillForCount(0, 10)).toBe('#eff6ff')
  })

  it('uses a mid blue at peak rather than navy or pastel', () => {
    expect(fillForCount(10, 10)).toBe('hsl(217 84% 52%)')
  })
})
