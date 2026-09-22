import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, useEffect, type ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api/client'
import type { PagedResponse, User } from '../api/types'
import { MemberListPage } from '../pages/MemberListPage'

vi.mock('../api/client')

const mockedApi = vi.mocked(api)

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 100,
    firstName: 'Andree',
    lastName: 'Flita',
    email: 'Andree.Flita@gmail.com',
    profession: 'worker',
    dateCreated: '2020-08-31',
    country: 'Canada',
    city: 'Toronto',
    ...overrides,
  }
}

function pageOf(users: User[], page = 0): PagedResponse<User> {
  return {
    content: users,
    page,
    size: 20,
    totalElements: users.length,
    totalPages: 1,
  }
}

function LocationProbe({ onChange }: { onChange: (search: string) => void }) {
  const location = useLocation()
  useEffect(() => {
    onChange(location.search)
  }, [location.search, onChange])
  return null
}

function renderPage(initialUrl = '/', onSearchChange?: (search: string) => void) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client },
      createElement(
        MemoryRouter,
        { initialEntries: [initialUrl] },
        onSearchChange
          ? createElement(LocationProbe, { onChange: onSearchChange })
          : null,
        children,
      ),
    )
  }

  return render(createElement(MemberListPage), { wrapper: Wrapper })
}

describe('MemberListPage', () => {
  beforeEach(() => {
    mockedApi.fetchFilterOptions.mockResolvedValue({
      professions: ['doctor', 'worker'],
      countries: ['Canada', 'United Kingdom'],
    })
    mockedApi.fetchUsers.mockResolvedValue(pageOf([makeUser()]))
  })

  it('renders members and sorts by column header', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(await screen.findByRole('link', { name: /Andree Flita/i })).toBeInTheDocument()
    expect(mockedApi.fetchUsers).toHaveBeenCalledWith(
      expect.objectContaining({ sort: 'id,asc', page: 0 }),
    )

    await user.click(screen.getByRole('button', { name: /^name$/i }))

    await waitFor(() => {
      expect(mockedApi.fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'firstName,asc' }),
      )
    })
  })

  it('paginates with next and updates the url', async () => {
    mockedApi.fetchUsers.mockImplementation(async (query) => {
      const page = query.page ?? 0
      return {
        content: [
          makeUser({
            id: 100 + page,
            firstName: page === 0 ? 'Andree' : 'Di',
            lastName: page === 0 ? 'Flita' : 'Lauraine',
            email: page === 0 ? 'Andree.Flita@gmail.com' : 'Di.Lauraine@gmail.com',
          }),
        ],
        page,
        size: 20,
        totalElements: 40,
        totalPages: 2,
      }
    })

    const searches: string[] = []
    const user = userEvent.setup()
    renderPage('/', (search) => {
      searches.push(search)
    })

    expect(await screen.findByRole('link', { name: /Andree Flita/i })).toBeInTheDocument()

    const pagination = screen.getByText(/1–20 of 40/i).closest('.pagination')
    expect(pagination).not.toBeNull()

    await user.click(within(pagination as HTMLElement).getByRole('button', { name: /next/i }))

    expect(await screen.findByRole('link', { name: /Di Lauraine/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(mockedApi.fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1 }),
      )
      expect(searches.at(-1)).toBe('?page=2')
    })
  })

  it('loads the page from the url', async () => {
    mockedApi.fetchUsers.mockImplementation(async (query) => {
      const page = query.page ?? 0
      return {
        content: [
          makeUser({
            id: 100 + page,
            firstName: page === 0 ? 'Andree' : 'Di',
            lastName: page === 0 ? 'Flita' : 'Lauraine',
          }),
        ],
        page,
        size: 20,
        totalElements: 40,
        totalPages: 2,
      }
    })

    renderPage('/?page=2')

    expect(await screen.findByRole('link', { name: /Di Lauraine/i })).toBeInTheDocument()
    expect(mockedApi.fetchUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 }),
    )
  })

  it('jumps to a typed page number', async () => {
    mockedApi.fetchUsers.mockImplementation(async (query) => {
      const page = query.page ?? 0
      return {
        content: [
          makeUser({
            id: 100 + page,
            firstName: ['Andree', 'Di', 'Casey'][page] ?? 'Andree',
            lastName: ['Flita', 'Lauraine', 'Ng'][page] ?? 'Flita',
          }),
        ],
        page,
        size: 20,
        totalElements: 60,
        totalPages: 3,
      }
    })

    const searches: string[] = []
    const user = userEvent.setup()
    renderPage('/', (search) => {
      searches.push(search)
    })

    await screen.findByRole('link', { name: /Andree Flita/i })

    const input = screen.getByRole('textbox', { name: /page number/i })
    await user.clear(input)
    await user.type(input, '3{Enter}')

    expect(await screen.findByRole('link', { name: /Casey Ng/i })).toBeInTheDocument()
    await waitFor(() => {
      expect(mockedApi.fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2 }),
      )
      expect(searches.at(-1)).toBe('?page=3')
    })
  })

  it('changes rows per page', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('link', { name: /Andree Flita/i })

    await user.selectOptions(screen.getByLabelText(/rows per page/i), '50')

    await waitFor(() => {
      expect(mockedApi.fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ size: 50, page: 0 }),
      )
    })
  })

  it('can show all matching rows on one page', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('link', { name: /Andree Flita/i })

    await user.selectOptions(screen.getByLabelText(/rows per page/i), 'All')

    await waitFor(() => {
      expect(mockedApi.fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({ size: -1, page: 0 }),
      )
    })
  })

  it('filters by created date range', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('link', { name: /Andree Flita/i })

    await user.type(screen.getByLabelText(/created from/i), '2020-01-01')
    await user.type(screen.getByLabelText(/created to/i), '2020-12-31')

    await waitFor(() => {
      expect(mockedApi.fetchUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          dateCreatedFrom: '2020-01-01',
          dateCreatedTo: '2020-12-31',
          page: 0,
        }),
      )
    })
  })

  it('exports filtered results as csv', async () => {
    mockedApi.fetchAllUsers.mockResolvedValue([makeUser()])
    const createObjectURL = vi.fn(() => 'blob:users')
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL,
    })

    const click = vi.fn()
    const originalCreateElement = document.createElement.bind(document)
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const el = originalCreateElement(tagName)
      if (tagName === 'a') {
        Object.defineProperty(el, 'click', { value: click })
      }
      return el
    })

    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('link', { name: /Andree Flita/i })
    await user.click(screen.getByRole('button', { name: /export csv/i }))

    await waitFor(() => {
      expect(mockedApi.fetchAllUsers).toHaveBeenCalledWith(
        expect.objectContaining({ sort: 'id,asc' }),
      )
      expect(click).toHaveBeenCalled()
    })

    vi.restoreAllMocks()
  })
})
