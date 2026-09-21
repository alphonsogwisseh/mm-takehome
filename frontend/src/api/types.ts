export interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  profession: string
  dateCreated: string
  country: string
  city: string
}

export interface PagedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface FilterOptions {
  professions: string[]
  countries: string[]
}

export interface CreateUserPayload {
  firstName: string
  lastName: string
  email: string
  profession: string
  dateCreated?: string
  country: string
  city: string
}

export interface UserQuery {
  search?: string
  professions?: string[]
  countries?: string[]
  dateCreatedFrom?: string
  dateCreatedTo?: string
  page?: number
  size?: number
  sort?: string
}

export interface LabelCount {
  label: string
  count: number
}

export interface MonthCount {
  year: number
  month: number
  count: number
}

export interface YearProfessionCount {
  year: number
  profession: string
  count: number
}

export interface MatrixCell {
  country: string
  profession: string
  count: number
}

export interface CityCount {
  city: string
  country: string
  count: number
}

export interface Analytics {
  totalUsers: number
  professionCount: number
  countryCount: number
  cityCount: number
  byProfession: LabelCount[]
  byCountry: LabelCount[]
  byCity: CityCount[]
  byMonth: MonthCount[]
  byYearAndProfession: YearProfessionCount[]
  professionByCountry: MatrixCell[]
}

export interface AnalyticsQuery {
  professions?: string[]
  countries?: string[]
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}
