import { formatDate, titleCase } from './format'

describe('titleCase', () => {
  it('capitalizes profession labels', () => {
    expect(titleCase('doctor')).toBe('Doctor')
    expect(titleCase('police officer')).toBe('Police Officer')
    expect(titleCase('AndorrA')).toBe('Andorra')
  })
})

describe('formatDate', () => {
  it('formats as Mon. nth, yyyy', () => {
    expect(formatDate('2020-08-31')).toBe('Aug. 31st, 2020')
    expect(formatDate('2024-01-01')).toBe('Jan. 1st, 2024')
    expect(formatDate('2024-05-02')).toBe('May 2nd, 2024')
    expect(formatDate('2024-03-03')).toBe('Mar. 3rd, 2024')
    expect(formatDate('2024-12-11')).toBe('Dec. 11th, 2024')
  })

  it('returns the original value when unparseable', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})
