import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretIcon, CheckIcon } from './icons'

interface ComboboxProps {
  id: string
  label: string
  placeholder: string
  value: string
  options: string[]
  formatOption?: (value: string) => string
  onChange: (value: string) => void
  /** Show an “All …” row that clears the value. Default true (filter UX). */
  allowClear?: boolean
  /** Let the user commit a typed value that is not in options. */
  allowCreate?: boolean
}

type ListItem =
  | { kind: 'clear' }
  | { kind: 'create'; value: string }
  | { kind: 'option'; value: string }

function dedupeOptions(options: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const option of options) {
    const key = option.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(option)
  }
  return unique
}

export function Combobox({
  id,
  label,
  placeholder,
  value,
  options,
  formatOption = (item) => item,
  onChange,
  allowClear = true,
  allowCreate = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)

  const uniqueOptions = useMemo(() => dedupeOptions(options), [options])

  const matches = useMemo(() => {
    const query = draft.trim().toLowerCase()
    if (!query) return uniqueOptions
    return uniqueOptions.filter((item) => item.toLowerCase().includes(query))
  }, [draft, uniqueOptions])

  const createValue = draft.trim()
  const exactMatch = uniqueOptions.some(
    (item) => item.toLowerCase() === createValue.toLowerCase(),
  )
  const showCreate = Boolean(allowCreate && createValue && !exactMatch)

  const items = useMemo<ListItem[]>(() => {
    const next: ListItem[] = []
    if (allowClear) next.push({ kind: 'clear' })
    if (showCreate) next.push({ kind: 'create', value: createValue })
    for (const option of matches) next.push({ kind: 'option', value: option })
    return next
  }, [allowClear, showCreate, createValue, matches])

  function commit(next: string) {
    const canonical =
      uniqueOptions.find((item) => item.toLowerCase() === next.toLowerCase()) ?? next
    onChange(canonical)
    setOpen(false)
    setDraft('')
  }

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return

      const typed = draft.trim()
      if (allowCreate && typed) {
        commit(typed)
        return
      }
      setOpen(false)
      setDraft('')
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, allowCreate, draft, uniqueOptions, onChange])

  function activate(item: ListItem) {
    if (item.kind === 'clear') commit('')
    else commit(item.value)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(0)
        return
      }
      if (items.length === 0) return
      setActiveIndex((current) => {
        const delta = event.key === 'ArrowDown' ? 1 : -1
        return (current + delta + items.length) % items.length
      })
      return
    }

    if (event.key === 'Enter' && open) {
      event.preventDefault()
      const picked = items[activeIndex]
      if (picked) activate(picked)
      else if (allowCreate && draft.trim()) commit(draft.trim())
      return
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      setDraft('')
    }
  }

  const listId = `${id}-list`
  const display = open ? draft : value ? formatOption(value) : ''

  return (
    <div className="combo" ref={rootRef}>
      <input
        id={id}
        className="combo__input"
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={placeholder}
        value={display}
        onChange={(event) => {
          setDraft(event.target.value)
          setActiveIndex(0)
          setOpen(true)
        }}
        onFocus={() => {
          setDraft('')
          setOpen(true)
          setActiveIndex(0)
        }}
        onKeyDown={handleKeyDown}
      />
      <CaretIcon className="combo__caret" />

      {open ? (
        <ul className="combo__list" id={listId} role="listbox" aria-label={label}>
          {items.map((item, index) => {
            const active = activeIndex === index
            if (item.kind === 'clear') {
              return (
                <li
                  key="clear"
                  role="option"
                  aria-selected={value === ''}
                  className={`combo__option${active ? ' combo__option--active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => activate(item)}
                >
                  All {label.toLowerCase()}
                  {value === '' ? <CheckIcon className="combo__check" /> : null}
                </li>
              )
            }

            if (item.kind === 'create') {
              return (
                <li
                  key="create"
                  role="option"
                  aria-selected={false}
                  className={`combo__option combo__option--create${active ? ' combo__option--active' : ''}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => activate(item)}
                >
                  Add “{formatOption(item.value)}”
                </li>
              )
            }

            const selected = item.value.toLowerCase() === value.toLowerCase()
            return (
              <li
                key={item.value.toLowerCase()}
                role="option"
                aria-selected={selected}
                className={`combo__option${active ? ' combo__option--active' : ''}`}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => activate(item)}
              >
                {formatOption(item.value)}
                {selected ? <CheckIcon className="combo__check" /> : null}
              </li>
            )
          })}

          {items.length === 0 ? <li className="combo__empty">No matches</li> : null}
        </ul>
      ) : null}
    </div>
  )
}
