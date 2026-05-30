import { describe, it, expect } from 'vitest'
import { incline } from './physics'

describe('incline & friction physics', () => {
  it('matches the closed-form acceleration (angle=30, mu=0.1, mass=2, g=9.8)', () => {
    const r = incline({ angle: 30, mu: 0.1, mass: 2, g: 9.8 })
    const th = (30 * Math.PI) / 180
    expect(r.accel).toBeCloseTo(9.8 * (Math.sin(th) - 0.1 * Math.cos(th)), 5)
  })
  it('clamps acceleration to zero when static friction holds (angle=10, mu=1)', () => {
    const r = incline({ angle: 10, mu: 1, mass: 2, g: 9.8 })
    expect(r.accel).toBe(0)
  })
})
