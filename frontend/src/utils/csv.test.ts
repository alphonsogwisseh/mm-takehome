import { describe, expect, it } from 'vitest'
import type { User } from '../api/types'
import { buildExportFilename, usersToCsv } from './csv'

const sample: User = {
  id: 100,
  firstName: 'Andree',
  lastName: 'Flita',
  email: 'Andree.Flita@gmail.com',
  profession: 'worker',
  dateCreated: '2020-08-31',
  country: 'Canada',
  city: 'Toronto',
}

describe('usersToCsv', () => {
  it('builds a csv with headers and formatted dates', () => {
    expect(usersToCsv([sample])).toBe(
      [
        'ID,First Name,Last Name,Email,Profession,Date Created,Country,City',
        '100,Andree,Flita,Andree.Flita@gmail.com,worker,"Aug. 31st, 2020",Canada,Toronto',
      ].join('\n'),
    )
  })

  it('escapes commas and quotes in values', () => {
    const csv = usersToCsv([
      {
        ...sample,
        city: 'St. John\'s, NL',
        lastName: 'O"Brien',
      },
    ])
    expect(csv).toContain('"O""Brien"')
    expect(csv).toContain('"St. John\'s, NL"')
  })
})

describe('buildExportFilename', () => {
  const now = new Date(2026, 8, 21, 15, 58, 21)

  it('uses all when no filters are set and includes a timestamp', () => {
    expect(buildExportFilename({}, now)).toBe('users-export-all-2026-09-21_155821.csv')
  })

  it('names the file after the selected filter values', () => {
    expect(
      buildExportFilename(
        {
          search: 'Andree',
          professions: ['Doctor', 'Developer'],
          countries: ['Afghanistan', 'Albania'],
          dateCreatedFrom: '2020-01-01',
          dateCreatedTo: '2020-12-31',
        },
        now,
      ),
    ).toBe(
      'users-export-search-andree-professions-doctor-developer-countries-afghanistan-albania-from-2020-01-01-to-2020-12-31-2026-09-21_155821.csv',
    )
  })
})
