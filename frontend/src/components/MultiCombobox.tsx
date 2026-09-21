import { useEffect, useMemo, useRef, useState } from 'react'
import { CaretIcon, CheckIcon, CloseIcon } from './icons'

interface MultiComboboxProps {
  id: string
  label: string
  placeholder: string
  values: string[]
  options: string[]
  formatOption?: (value: string) => string
  onChange: (values: string[]) => void
}

export function MultiCombobox({
  id,
  label,
  placeholder,
  values,
  options,
  formatOption = (item) => item,
  onChange,
}: MultiComboboxProps) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const selected = useMemo(() => new Set(values.map((item) => item.toLowerCase())), [values])

  const matches = useMemo(() => {
    const query = draft.trim().toLowerCase()
    if (!query) return options
    return options.filter((item) => item.toLowerCase().includes(query))
  }, [draft, options])

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setDraft('')
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  function toggle(option: string) {
    const exists = values.some((item) => item.toLowerCase() === option.toLowerCase())
    onChange(
      exists
        ? values.filter((item) => item.toLowerCase() !== option.toLowerCase())
        : [...values, option],
    )
  }

  function clearAll() {
    onChange([])
    setOpen(false)
    setDraft('')
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        setActiveIndex(0)
        return
      }
      const total = matches.length + 1
      setActiveIndex((current) => {
        const delta = event.key === 'ArrowDown' ? 1 : -1
        return (current + delta + total) % total
      })
      return
    }

    if (event.key === 'Enter' && open) {
      event.preventDefault()
      if (activeIndex === 0) {
        clearAll()
      } else {
        const picked = matches[activeIndex - 1]
        if (picked) toggle(picked)
      }
      return
    }

    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      setDraft('')
    }

    if (event.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  const listId = `${id}-list`
  const summary =
    values.length === 0
      ? ''
      : values.length === 1
        ? formatOption(values[0])
        : `${values.length} selected`

  return (
    <div className="combo combo--multi" ref={rootRef}>
      {values.length > 0 ? (
        <div className="combo__chips" aria-label={`Selected ${label.toLowerCase()}`}>
          {values.map((value) => (
            <button
              key={value}
              type="button"
              className="combo__chip"
              onClick={() => toggle(value)}
            >
              {formatOption(value)}
              <CloseIcon size={12} />
            </button>
          ))}
        </div>
      ) : null}

      <input
        id={id}
        className="combo__input"
        type="text"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        placeholder={values.length > 0 ? 'Add another…' : placeholder}
        value={open ? draft : summary}
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
        <ul className="combo__list" id={listId} role="listbox" aria-label={label} aria-multiselectable>
          <li
            role="option"
            aria-selected={values.length === 0}
            className={`combo__option${activeIndex === 0 ? ' combo__option--active' : ''}`}
            onMouseEnter={() => setActiveIndex(0)}
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearAll}
          >
            All {label.toLowerCase()}
            {values.length === 0 ? <CheckIcon className="combo__check" /> : null}
          </li>

          {matches.map((item, index) => {
            const isSelected = selected.has(item.toLowerCase())
            return (
              <li
                key={item.toLowerCase()}
                role="option"
                aria-selected={isSelected}
                className={`combo__option${activeIndex === index + 1 ? ' combo__option--active' : ''}`}
                onMouseEnter={() => setActiveIndex(index + 1)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => toggle(item)}
              >
                {formatOption(item)}
                {isSelected ? <CheckIcon className="combo__check" /> : null}
              </li>
            )
          })}

          {matches.length === 0 ? <li className="combo__empty">No matches</li> : null}
        </ul>
      ) : null}
    </div>
  )
}
