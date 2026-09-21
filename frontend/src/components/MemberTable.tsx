import { Link } from 'react-router-dom'
import type { User } from '../api/types'
import { formatDate, titleCase } from '../utils/format'

export type SortField =
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'profession'
  | 'dateCreated'
  | 'country'
  | 'city'

interface MemberTableProps {
  users: User[]
  sortField: SortField
  sortDirection: 'asc' | 'desc'
  onSort: (field: SortField) => void
  onDelete: (user: User) => void
}

const columns: { field: SortField; label: string }[] = [
  { field: 'id', label: 'ID' },
  { field: 'firstName', label: 'Name' },
  { field: 'profession', label: 'Profession' },
  { field: 'country', label: 'Location' },
  { field: 'dateCreated', label: 'Created' },
]

function initials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function MemberTable({
  users,
  sortField,
  sortDirection,
  onSort,
  onDelete,
}: MemberTableProps) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => {
              const active = sortField === column.field
              return (
              <th key={column.field} scope="col" aria-sort={active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}>
                <button
                  type="button"
                  className={`sort-btn${active ? ' sort-btn--active' : ''}`}
                  onClick={() => onSort(column.field)}
                >
                  {column.label}
                  {active ? (
                    <span
                      className={`sort-indicator sort-indicator--${sortDirection}`}
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              </th>
              )
            })}
            <th scope="col"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="cell-id">{user.id}</td>
              <td>
                <div className="person">
                  <span className="person__avatar" aria-hidden="true">
                    {initials(user.firstName, user.lastName)}
                  </span>
                  <span className="person__copy">
                    <Link to={`/members/${user.id}`} className="person__name">
                      {user.firstName} {user.lastName}
                    </Link>
                    <span className="person__email">{user.email}</span>
                  </span>
                </div>
              </td>
              <td>
                <span className="profession">{titleCase(user.profession)}</span>
              </td>
              <td>
                <span className="location">
                  <span className="location__city">{titleCase(user.city)}</span>
                  <span className="location__country">{titleCase(user.country)}</span>
                </span>
              </td>
              <td>{formatDate(user.dateCreated)}</td>
              <td className="cell-actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => onDelete(user)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
