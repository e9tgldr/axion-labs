import { describe, it, expect } from 'vitest'
import { wave, yAt } from './physics'

describe('wave physics', () => {
  it('matches the closed-form speed/period/angular frequency (A=1, f=2, λ=3)', () => {
    const r = wave({ A: 1, f: 2, lambda: 3 })
    expect(r.waveSpeed).toBeCloseTo(6, 5) // v = f·λ
    expect(r.period).toBeCloseTo(0.5, 5) // T = 1/f
    expect(r.angFreq).toBeCloseTo(2 * Math.PI * 2, 5) // ω = 2πf
    expect(r.k).toBeCloseTo((2 * Math.PI) / 3, 5) // k = 2π/λ
  })
  it('starts at the origin (y≈0 at x=0, t=0) and reaches amplitude a quarter cycle later', () => {
    const input = { A: 2, f: 1, lambda: 4 }
    expect(yAt(input, 0, 0)).toBeCloseTo(0, 6)
    // crest passes x=λ/4 at t=0: sin(k·λ/4) = sin(π/2) = 1
    expect(yAt(input, 1, 0)).toBeCloseTo(2, 6)
  })
})
