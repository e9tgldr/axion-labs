import { describe, it, expect } from 'vitest'
import { fmt } from './format'

describe('fmt', () => {
  it('formats with fixed decimals', () => {
    expect(fmt(3.14159, 2)).toBe('3.14')
    expect(fmt(42, 0)).toBe('42')
  })
  it('normalizes negative zero', () => {
    expect(fmt(-0.0001, 2)).toBe('0.00')
  })
  it('shows an em-dash for non-finite values', () => {
    expect(fmt(Infinity, 2)).toBe('—')
    expect(fmt(NaN)).toBe('—')
  })
})
