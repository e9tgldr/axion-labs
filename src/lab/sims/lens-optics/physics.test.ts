import { describe, it, expect } from 'vitest'
import { lens } from './physics'

describe('lens optics physics', () => {
  it('forms a real, inverted, same-size image at 2f when object is at 2f (f=1, u=2)', () => {
    const r = lens({ focal: 1, objDist: 2 })
    expect(r.imageDist).toBeCloseTo(2, 5)
    expect(r.magnification).toBeCloseTo(-1, 5)
    expect(r.real).toBe(1)
  })
  it('produces a virtual, upright, magnified image when object is inside the focal length (f=2, u=1)', () => {
    const r = lens({ focal: 2, objDist: 1 })
    expect(r.imageDist).toBeCloseTo(-2, 5)
    expect(r.magnification).toBeCloseTo(2, 5)
    expect(r.real).toBe(0)
  })
})
