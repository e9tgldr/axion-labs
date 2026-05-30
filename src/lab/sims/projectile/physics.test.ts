import { describe, it, expect } from 'vitest'
import { projectile, posAt } from './physics'

describe('projectile physics', () => {
  it('matches the closed-form range/time/height (v0=20, 45°, g=9.8)', () => {
    const r = projectile({ v0: 20, angle: 45, g: 9.8 })
    expect(r.range).toBeCloseTo((20 * 20) / 9.8, 5) // sin(90°) = 1
    expect(r.flightTime).toBeCloseTo((2 * 20 * Math.sin(Math.PI / 4)) / 9.8, 5)
    expect(r.maxHeight).toBeCloseTo((20 * Math.sin(Math.PI / 4)) ** 2 / (2 * 9.8), 5)
  })
  it('returns to ground (y≈0) at flight time', () => {
    const input = { v0: 15, angle: 30, g: 9.8 }
    const { flightTime } = projectile(input)
    expect(posAt(input, flightTime).y).toBeCloseTo(0, 6)
  })
})
