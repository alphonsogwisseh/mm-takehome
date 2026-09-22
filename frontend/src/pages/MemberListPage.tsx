import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  createUser,
  deleteUser,
  fetchAllUsers,
  fetchFilterOptions,
  fetchUsers,
} from '../api/client'
import type { CreateUserPayload, User } from '../api/types'
import { AddMemberModal } from '../components/AddMemberModal'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { MemberTable, type SortField } from '../components/MemberTable'
import { MemberToolbar } from '../components/MemberToolbar'
import { PageTitle } from '../components/PageTitle'
import { Pagination } from '../components/Pagination'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { downloadCsv, usersToCsv, buildExportFilename } from '../utils/csv'

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, -1] as const

function pageFromSearchParams(params: URLSearchParams): number {
  const raw = Number.parseInt(params.get('page') ?? '1', 10)
  if (!Number.isFinite(raw) || raw < 1) return 0
  return raw - 1
}

export function MemberListPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [professions, setProfessions] = useState<string[]>([])
  const [countries, setCountries] = useState<string[]>([])
  const [dateCreatedFrom, setDateCreatedFrom] = useState('')
  const [dateCreatedTo, setDateCreatedTo] = useState('')
  const [pageSize, setPageSize] = useState(20)
  const [sortField, setSortField] = useState<SortField>('id')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [showAdd, setShowAdd] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<User | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const page = pageFromSearchParams(searchParams)
  const debouncedSearch = useDebouncedValue(search, 300)
  const sort = `${sortField},${sortDirection}`

  function setPage(next: number) {
    setSearchParams((current) => {
      const params = new URLSearchParams(current)
      if (next <= 0) {
        params.delete('page')
      } else {
        params.set('page', String(next + 1))
      }
      return params
    })
  }

  const filtersQuery = useQuery({
    queryKey: ['filters'],
    queryFn: fetchFilterOptions,
  })

  const usersQuery = useQuery({
    queryKey: [
      'users',
      debouncedSearch,
      professions,
      countries,
      dateCreatedFrom,
      dateCreatedTo,
      page,
      pageSize,
      sort,
    ],
    queryFn: () =>
      fetchUsers({
        search: debouncedSearch || undefined,
        professions: professions.length > 0 ? professions : undefined,
        countries: countries.length > 0 ? countries : undefined,
        dateCreatedFrom: dateCreatedFrom || undefined,
        dateCreatedTo: dateCreatedTo || undefined,
        page,
        size: pageSize,
        sort,
      }),
  })

  useEffect(() => {
    const totalPages = usersQuery.data?.totalPages ?? 0
    if (totalPages > 0 && page >= totalPages) {
      setPage(totalPages - 1)
    }
  }, [usersQuery.data?.totalPages, page])

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['filters'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteUser(id),
    onSuccess: async () => {
      setPendingDelete(null)
      await queryClient.invalidateQueries({ queryKey: ['users'] })
      await queryClient.invalidateQueries({ queryKey: ['filters'] })
    },
  })

  function handleSort(field: SortField) {
    if (field === sortField) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(0)
  }

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(0)
  }

  function handleProfessionsChange(values: string[]) {
    setProfessions(values)
    setPage(0)
  }

  function handleCountriesChange(values: string[]) {
    setCountries(values)
    setPage(0)
  }

  function handleDateCreatedFromChange(value: string) {
    setDateCreatedFrom(value)
    setPage(0)
  }

  function handleDateCreatedToChange(value: string) {
    setDateCreatedTo(value)
    setPage(0)
  }

  function handlePageSizeChange(size: number) {
    setPageSize(size)
    setPage(0)
  }

  function clearFilters() {
    setSearch('')
    setProfessions([])
    setCountries([])
    setDateCreatedFrom('')
    setDateCreatedTo('')
    setPage(0)
  }

  async function handleCreate(payload: CreateUserPayload) {
    await createMutation.mutateAsync(payload)
  }

  async function handleExport() {
    setExportError(null)
    setExporting(true)
    try {
      const filters = {
        search: debouncedSearch || undefined,
        professions: professions.length > 0 ? professions : undefined,
        countries: countries.length > 0 ? countries : undefined,
        dateCreatedFrom: dateCreatedFrom || undefined,
        dateCreatedTo: dateCreatedTo || undefined,
      }
      const users = await fetchAllUsers({ ...filters, sort })
      downloadCsv(buildExportFilename(filters), usersToCsv(users))
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const totalElements = usersQuery.data?.totalElements ?? 0
  const hasFilters = Boolean(
    search || professions.length > 0 || countries.length > 0 || dateCreatedFrom || dateCreatedTo,
  )
  const canExport = totalElements > 0 && !usersQuery.isLoading && !usersQuery.isError

  return (
    <>
      <PageTitle
        title="Users"
        meta={`${totalElements.toLocaleString()} ${hasFilters ? 'matching' : 'total'}`}
        actions={
          <>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleExport}
              disabled={!canExport || exporting}
            >
              {exporting ? 'Exporting…' : 'Export CSV'}
            </button>
            <button type="button" className="btn btn--primary" onClick={() => setShowAdd(true)}>
              Add user
            </button>
          </>
        }
      />

      {exportError ? (
        <p className="inline-alert" role="alert">
          {exportError}
        </p>
      ) : null}

      <div className="directory-layout">
        <MemberToolbar
          search={search}
          professions={professions}
          countries={countries}
          dateCreatedFrom={dateCreatedFrom}
          dateCreatedTo={dateCreatedTo}
          filterOptions={filtersQuery.data}
          onSearchChange={handleSearchChange}
          onProfessionsChange={handleProfessionsChange}
          onCountriesChange={handleCountriesChange}
          onDateCreatedFromChange={handleDateCreatedFromChange}
          onDateCreatedToChange={handleDateCreatedToChange}
          onClearAll={clearFilters}
        />

        <section className="table-shell reveal-3">
          {usersQuery.isLoading ? (
            <div className="status-block">Loading…</div>
          ) : usersQuery.isError ? (
            <div className="status-block status-block--error">
              {usersQuery.error instanceof Error
                ? usersQuery.error.message
                : 'Unable to load users'}
            </div>
          ) : usersQuery.data && usersQuery.data.content.length === 0 ? (
            <div className="status-block">
              No users found
              {hasFilters ? (
                <div style={{ marginTop: 16 }}>
                  <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                    Clear all
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <MemberTable
                users={usersQuery.data?.content ?? []}
                sortField={sortField}
                sortDirection={sortDirection}
                onSort={handleSort}
                onDelete={setPendingDelete}
              />
              <Pagination
                page={page}
                totalPages={usersQuery.data?.totalPages ?? 0}
                totalElements={totalElements}
                size={pageSize}
                pageSizeOptions={PAGE_SIZE_OPTIONS}
                onPageChange={setPage}
                onPageSizeChange={handlePageSizeChange}
              />
            </>
          )}
        </section>
      </div>

      {showAdd ? (
        <AddMemberModal
          onClose={() => setShowAdd(false)}
          onSubmit={handleCreate}
          filterOptions={filtersQuery.data}
        />
      ) : null}

      {pendingDelete ? (
        <ConfirmDialog
          title="Delete user"
          message={`${pendingDelete.firstName} ${pendingDelete.lastName} will be permanently removed.`}
          busy={deleteMutation.isPending}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => deleteMutation.mutate(pendingDelete.id)}
        />
      ) : null}
    </>
  )
}
