import { createContext, useContext } from 'react'
import type { Analytics } from '../api/types'

export interface AnalyticsScopeValue {
  professions: string[]
  countries: string[]
  setProfessions: (value: string[]) => void
  setCountries: (value: string[]) => void
  setCountry: (value: string) => void
  toggleCountry: (value: string) => void
  toggleProfession: (value: string) => void
  clearScope: () => void
  clearCountries: () => void
  clearProfessions: () => void
  analytics?: Analytics
  isLoading: boolean
  isError: boolean
  error: Error | null
  countryOptions: string[]
}

export const AnalyticsScopeContext = createContext<AnalyticsScopeValue | null>(null)

export function useAnalyticsScope() {
  const value = useContext(AnalyticsScopeContext)
  if (!value) {
    throw new Error('useAnalyticsScope must be used within AnalyticsLayout')
  }
  return value
}
