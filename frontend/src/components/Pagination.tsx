import { useEffect, useState } from 'react'

interface PaginationProps {
  page: number
  totalPages: number
  totalElements: number
  size: number
  pageSizeOptions?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  size,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const start = totalElements === 0 ? 0 : page * size + 1
  const end = Math.min((page + 1) * size, totalElements)
  const displayPage = totalPages === 0 ? 0 : page + 1
  const [draft, setDraft] = useState(String(displayPage))

  useEffect(() => {
    setDraft(String(displayPage))
  }, [displayPage])

  function commitPage() {
    if (totalPages === 0) {
      setDraft('0')
      return
    }

    const parsed = Number.parseInt(draft, 10)
    if (!Number.isFinite(parsed)) {
      setDraft(String(displayPage))
      return
    }

    const nextDisplay = Math.min(Math.max(parsed, 1), totalPages)
    setDraft(String(nextDisplay))
    if (nextDisplay - 1 !== page) {
      onPageChange(nextDisplay - 1)
    }
  }

  return (
    <div className="pagination">
      <div className="pagination__meta">
        <span>
          {start}–{end} of {totalElements}
        </span>
        {onPageSizeChange ? (
          <label className="page-size">
            <span>Show</span>
            <select
              value={size}
              aria-label="Rows per page"
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <span>per page</span>
          </label>
        ) : null}
      </div>

      <div className="pagination__controls">
        <button
          type="button"
          className="btn btn--secondary"
          disabled={page <= 0}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        <label className="page-jump">
          <span>Page</span>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            aria-label="Page number"
            value={draft}
            disabled={totalPages === 0}
            onChange={(event) => setDraft(event.target.value.replace(/\D/g, ''))}
            onBlur={commitPage}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                commitPage()
                ;(event.target as HTMLInputElement).blur()
              }
            }}
          />
          <span>of {totalPages}</span>
        </label>

        <button
          type="button"
          className="btn btn--secondary"
          disabled={page + 1 >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
