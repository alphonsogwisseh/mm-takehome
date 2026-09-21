import { useId, useState, type FormEvent } from 'react'
import type { CreateUserPayload, FilterOptions } from '../api/types'
import { titleCase } from '../utils/format'
import { Combobox } from './Combobox'

interface AddMemberModalProps {
  onClose: () => void
  onSubmit: (payload: CreateUserPayload) => Promise<void>
  filterOptions?: FilterOptions
}

const emptyForm: CreateUserPayload = {
  firstName: '',
  lastName: '',
  email: '',
  profession: '',
  dateCreated: '',
  country: '',
  city: '',
}

function matchExisting(value: string, options: string[]): string {
  const trimmed = value.trim()
  const existing = options.find((item) => item.toLowerCase() === trimmed.toLowerCase())
  return existing ?? trimmed
}

export function AddMemberModal({ onClose, onSubmit, filterOptions }: AddMemberModalProps) {
  const titleId = useId()
  const [form, setForm] = useState<CreateUserPayload>(emptyForm)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const professions = filterOptions?.professions ?? []
  const countries = filterOptions?.countries ?? []

  function update<K extends keyof CreateUserPayload>(key: K, value: CreateUserPayload[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const profession = matchExisting(form.profession, professions)
      const country = matchExisting(form.country, countries)

      if (!profession) {
        setError('Choose or type a profession.')
        setBusy(false)
        return
      }

      if (!country) {
        setError('Choose a country.')
        setBusy(false)
        return
      }

      const payload: CreateUserPayload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        profession,
        country,
        city: form.city.trim(),
      }
      if (form.dateCreated) {
        payload.dateCreated = form.dateCreated
      }
      await onSubmit(payload)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create member')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="modal__title">
          Add user
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="firstName">First name</label>
              <input
                id="firstName"
                required
                value={form.firstName}
                onChange={(event) => update('firstName', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                required
                value={form.lastName}
                onChange={(event) => update('lastName', event.target.value)}
              />
            </div>
            <div className="field field--full">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="add-member-profession">Profession</label>
              <Combobox
                id="add-member-profession"
                label="Professions"
                placeholder="Search or add a profession"
                value={form.profession}
                options={professions}
                formatOption={titleCase}
                allowClear={false}
                allowCreate
                onChange={(value) => update('profession', value)}
              />
            </div>
            <div className="field">
              <label htmlFor="add-member-dateCreated">Created</label>
              <input
                id="add-member-dateCreated"
                type="date"
                value={form.dateCreated ?? ''}
                onChange={(event) => update('dateCreated', event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="add-member-country">Country</label>
              <Combobox
                id="add-member-country"
                label="Countries"
                placeholder="Search countries"
                value={form.country}
                options={countries}
                formatOption={titleCase}
                allowClear={false}
                onChange={(value) => update('country', value)}
              />
            </div>
            <div className="field">
              <label htmlFor="add-member-city">City</label>
              <input
                id="add-member-city"
                required
                value={form.city}
                onChange={(event) => update('city', event.target.value)}
              />
            </div>
          </div>
          {error ? <p className="form-error">{error}</p> : null}
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={onClose}
              disabled={busy}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
