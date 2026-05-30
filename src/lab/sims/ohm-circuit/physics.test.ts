import { describe, it, expect } from 'vitest'
import { ohm } from './physics'

describe('ohm-circuit physics', () => {
  it('computes series resistance, current and power (V=12, R1=4, R2=2)', () => {
    const r = ohm({ V: 12, R1: 4, R2: 2 })
    expect(r.resistance).toBeCloseTo(6, 5)
    expect(r.current).toBeCloseTo(2, 5)
    expect(r.power).toBeCloseTo(24, 5)
  })
  it('guards against zero resistance', () => {
    const r = ohm({ V: 12, R1: 0, R2: 0 })
    expect(r.resistance).toBe(0)
    expect(r.current).toBe(0)
    expect(r.power).toBe(0)
  })
})
