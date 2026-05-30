import { describe, it, expect, vi, afterEach } from 'vitest'
import { isWebGLAvailable, prefersReducedMotion, heroEnabled } from './webgl'

afterEach(() => vi.unstubAllGlobals())

describe('webgl detection', () => {
  it('reports no WebGL in jsdom (no GL context)', () => {
    // jsdom does not implement a real WebGL context.
    expect(isWebGLAvailable()).toBe(false)
  })

  it('reads prefers-reduced-motion via matchMedia', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
    expect(prefersReducedMotion()).toBe(true)
  })

  it('heroEnabled is false when WebGL is unavailable', () => {
    expect(heroEnabled()).toBe(false)
  })
})
