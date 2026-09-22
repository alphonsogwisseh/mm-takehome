import type {
  Analytics,
  AnalyticsQuery,
  CreateUserPayload,
  FilterOptions,
  PagedResponse,
  User,
  UserQuery,
} from './types'
import { ApiError } from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = (await response.json()) as { detail?: string; title?: string }
      message = body.detail ?? body.title ?? message
    } catch {
      // ignore JSON parse errors
    }
    throw new ApiError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

function toQueryString(query: UserQuery): string {
  const params = new URLSearchParams()
  if (query.search) params.set('search', query.search)
  for (const profession of query.professions ?? []) {
    if (profession) params.append('profession', profession)
  }
  for (const country of query.countries ?? []) {
    if (country) params.append('country', country)
  }
  if (query.dateCreatedFrom) params.set('dateCreatedFrom', query.dateCreatedFrom)
  if (query.dateCreatedTo) params.set('dateCreatedTo', query.dateCreatedTo)
  if (query.page !== undefined) params.set('page', String(query.page))
  if (query.size !== undefined) params.set('size', String(query.size))
  if (query.sort) params.set('sort', query.sort)
  const value = params.toString()
  return value ? `?${value}` : ''
}

export function fetchUsers(query: UserQuery): Promise<PagedResponse<User>> {
  return request(`/api/users${toQueryString(query)}`)
}

/** Fetches every matching row in one request (`size=-1`). */
export async function fetchAllUsers(
  query: Omit<UserQuery, 'page' | 'size'>,
): Promise<User[]> {
  const result = await fetchUsers({ ...query, page: 0, size: -1 })
  return result.content
}

export function fetchUser(id: number): Promise<User> {
  return request(`/api/users/${id}`)
}

export function fetchFilterOptions(): Promise<FilterOptions> {
  return request('/api/users/filters')
}

export function fetchAnalytics(query: AnalyticsQuery = {}): Promise<Analytics> {
  const params = new URLSearchParams()
  for (const profession of query.professions ?? []) {
    if (profession) params.append('profession', profession)
  }
  for (const country of query.countries ?? []) {
    if (country) params.append('country', country)
  }
  const qs = params.toString()
  return request(`/api/users/analytics${qs ? `?${qs}` : ''}`)
}

export function createUser(payload: CreateUserPayload): Promise<User> {
  return request('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function deleteUser(id: number): Promise<void> {
  return request(`/api/users/${id}`, { method: 'DELETE' })
}
