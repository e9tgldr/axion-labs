import { describe, it, expect } from 'vitest'
import { rk4Step, energy, type DPParams, type DPState } from './physics'

describe('double pendulum physics', () => {
  it('RK4 conserves energy over 2000 steps of h=0.002 (th1=th2=π/2, w=0)', () => {
    const p: DPParams = { L1: 1, L2: 1, m1: 1, m2: 1, g: 9.8 }
    let s: DPState = { th1: Math.PI / 2, th2: Math.PI / 2, w1: 0, w2: 0 }
    const E0 = energy(s, p)
    for (let i = 0; i < 2000; i++) s = rk4Step(s, p, 0.002)
    const E1 = energy(s, p)
    expect(Math.abs(E1 - E0)).toBeLessThan(0.05 * Math.abs(E0) + 0.05)
  })
})
