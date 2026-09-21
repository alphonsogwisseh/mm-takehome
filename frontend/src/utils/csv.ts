import type { User } from '../api/types'
import { formatDate } from './format'

const HEADERS = [
  'ID',
  'First Name',
  'Last Name',
  'Email',
  'Profession',
  'Date Created',
  'Country',
  'City',
] as const

export interface ExportFilters {
  search?: string
  professions?: string[]
  countries?: string[]
  dateCreatedFrom?: string
  dateCreatedTo?: string
}

function escapeCell(value: string | number): string {
  const text = String(value)
  if (/[",\n\r]/.test(text)) {
    return `"${text.replaceAll('"', '""')}"`
  }
  return text
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

function formatExportTimestamp(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') +
    '_' +
    [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join('')
}

function joinSlugs(values: string[], limit = 6): string {
  const slugs = values.map(slug).filter(Boolean)
  if (slugs.length === 0) return ''
  if (slugs.length <= limit) return slugs.join('-')
  return `${slugs.slice(0, limit).join('-')}-and-${slugs.length - limit}-more`
}

export function buildExportFilename(
  filters: ExportFilters = {},
  now: Date = new Date(),
): string {
  const parts = ['users', 'export']

  if (filters.search) parts.push(`search-${slug(filters.search)}`)
  if (filters.professions && filters.professions.length > 0) {
    parts.push(`professions-${joinSlugs(filters.professions)}`)
  }
  if (filters.countries && filters.countries.length > 0) {
    parts.push(`countries-${joinSlugs(filters.countries)}`)
  }
  if (filters.dateCreatedFrom) parts.push(`from-${filters.dateCreatedFrom}`)
  if (filters.dateCreatedTo) parts.push(`to-${filters.dateCreatedTo}`)

  if (parts.length === 2) parts.push('all')

  parts.push(formatExportTimestamp(now))

  return `${parts.join('-')}.csv`
}

export function usersToCsv(users: User[]): string {
  const rows = users.map((user) =>
    [
      user.id,
      user.firstName,
      user.lastName,
      user.email,
      user.profession,
      formatDate(user.dateCreated),
      user.country,
      user.city,
    ]
      .map(escapeCell)
      .join(','),
  )
  return [HEADERS.join(','), ...rows].join('\n')
}

export function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
