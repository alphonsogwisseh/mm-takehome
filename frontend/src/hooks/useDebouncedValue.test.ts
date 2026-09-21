import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('ada', 300))
    expect(result.current).toBe('ada')
  })

  it('updates after the delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: 'ada' } },
    )

    rerender({ value: 'grace' })
    expect(result.current).toBe('ada')

    act(() => {
      vi.advanceTimersByTime(299)
    })
    expect(result.current).toBe('ada')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe('grace')
  })
})
