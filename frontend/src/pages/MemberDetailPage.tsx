import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { fetchUser } from '../api/client'
import { PageTitle } from '../components/PageTitle'
import { formatDate, titleCase } from '../utils/format'

export function MemberDetailPage() {
  const { id } = useParams()
  const userId = Number(id)

  const userQuery = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    enabled: Number.isFinite(userId),
  })

  if (!Number.isFinite(userId)) {
    return <div className="status-block status-block--error">Invalid user id</div>
  }

  if (userQuery.isLoading) {
    return <div className="status-block">Loading…</div>
  }

  if (userQuery.isError || !userQuery.data) {
    return (
      <div className="status-block status-block--error">
        {userQuery.error instanceof Error
          ? userQuery.error.message
          : 'User not found'}
      </div>
    )
  }

  const user = userQuery.data
  const initial = user.firstName.charAt(0).toUpperCase()

  return (
    <>
      <PageTitle eyebrow="User" title={`${user.firstName} ${user.lastName}`} />

      <div className="detail-layout reveal-2">
        <section className="detail-card">
          <div className="detail-card__nav">
            <Link to="/" className="btn btn--link">
              ← Back to users
            </Link>
          </div>

          <dl className="definition-list">
            <div>
              <dt>ID</dt>
              <dd>{user.id}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt>Profession</dt>
              <dd>
                <span className="profession">{titleCase(user.profession)}</span>
              </dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{titleCase(user.country)}</dd>
            </div>
            <div>
              <dt>City</dt>
              <dd>{titleCase(user.city)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDate(user.dateCreated)}</dd>
            </div>
          </dl>
        </section>

        <aside aria-hidden="true">
          <div className="detail-aside__mark">{initial}</div>
        </aside>
      </div>
    </>
  )
}
