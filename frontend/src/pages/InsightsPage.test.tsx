import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api/client'
import type { Analytics } from '../api/types'
import { AnalyticsLayout } from '../components/AnalyticsLayout'
import { AnalyticsHomePage } from './AnalyticsHomePage'

vi.mock('../api/client')

const mockedApi = vi.mocked(api)

const analytics: Analytics = {
  totalUsers: 9,
  professionCount: 2,
  countryCount: 2,
  cityCount: 3,
  byProfession: [
    { label: 'doctor', count: 5 },
    { label: 'developer', count: 4 },
  ],
  byCountry: [
    { label: 'Canada', count: 6 },
    { label: 'Chile', count: 3 },
  ],
  byCity: [
    { city: 'Toronto', country: 'Canada', count: 4 },
    { city: 'Vancouver', country: 'Canada', count: 2 },
    { city: 'Santiago', country: 'Chile', count: 3 },
  ],
  byMonth: [
    { year: 2020, month: 1, count: 4 },
    { year: 2020, month: 2, count: 0 },
    { year: 2021, month: 3, count: 5 },
  ],
  byYearAndProfession: [
    { year: 2020, profession: 'doctor', count: 4 },
    { year: 2021, profession: 'developer', count: 4 },
    { year: 2021, profession: 'doctor', count: 1 },
  ],
  professionByCountry: [
    { country: 'Canada', profession: 'doctor', count: 4 },
    { country: 'Canada', profession: 'developer', count: 2 },
    { country: 'Chile', profession: 'developer', count: 2 },
  ],
}

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })

  return render(
    createElement(
      QueryClientProvider,
      { client },
      createElement(
        MemoryRouter,
        { initialEntries: ['/analytics'] },
        createElement(
          Routes,
          null,
          createElement(
            Route,
            { path: '/analytics', element: createElement(AnalyticsLayout) },
            createElement(Route, {
              index: true,
              element: createElement(AnalyticsHomePage),
            }),
          ),
        ),
      ),
    ),
  )
}

describe('AnalyticsHomePage', () => {
  beforeEach(() => {
    mockedApi.fetchFilterOptions.mockResolvedValue({
      professions: ['developer', 'doctor'],
      countries: ['Canada', 'Chile'],
    })
    mockedApi.fetchAnalytics.mockResolvedValue(analytics)
  })

  it('renders headline numbers and the busiest month', async () => {
    renderPage()

    const headline = await screen.findByRole('region', { name: /headline numbers/i })

    expect(within(headline).getByText('9')).toBeInTheDocument()
    expect(within(headline).getByText('Mar 2021')).toBeInTheDocument()
  })

  it('renders each chart with an accessible summary', async () => {
    renderPage()

    expect(
      await screen.findByRole('img', { name: /Users by profession/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Monthly signups/i })).toBeInTheDocument()
    expect(
      screen.getByRole('img', { name: /Signups per year by profession/i }),
    ).toBeInTheDocument()
  })

  it('builds the profession by country matrix', async () => {
    renderPage()

    const matrix = await screen.findByRole('table')
    const canadaRow = within(matrix).getByRole('row', { name: /Canada/i })

    expect(within(canadaRow).getByRole('rowheader')).toHaveTextContent('Canada')
    expect(within(canadaRow).getAllByRole('cell').at(-1)).toHaveTextContent('6')
  })

  it('re-queries analytics when the scope changes', async () => {
    const user = userEvent.setup()
    renderPage()

    await screen.findByRole('img', { name: /Users by profession/i })

    await user.click(screen.getByRole('combobox', { name: /Professions/i }))
    await user.click(await screen.findByRole('option', { name: /^Doctor$/i }))

    await waitFor(() => {
      expect(mockedApi.fetchAnalytics).toHaveBeenCalledWith({
        professions: ['doctor'],
        countries: undefined,
      })
    })
  })
})
