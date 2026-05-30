import { describe, it, expect } from 'vitest'
import {
  FREE_TUTOR_MSGS_PER_DAY,
  dayStr,
  canSendTutorMessage,
  bumpUsage,
} from './gating'

const D = (s: string) => new Date(`${s}T10:00:00Z`)

describe('tutor gating', () => {
  it('formats the day as YYYY-MM-DD (UTC)', () => {
    expect(dayStr(D('2026-05-30'))).toBe('2026-05-30')
  })

  it('free/anon may send until the daily cap, then is blocked', () => {
    const now = D('2026-05-30')
    expect(canSendTutorMessage(null, 'free', now)).toBe(true)
    expect(canSendTutorMessage({ date: '2026-05-30', count: 4 }, 'free', now)).toBe(true)
    expect(canSendTutorMessage({ date: '2026-05-30', count: 5 }, 'free', now)).toBe(false)
    expect(canSendTutorMessage({ date: '2026-05-30', count: 5 }, null, now)).toBe(false)
  })

  it('yesterday usage does not count against today (rollover)', () => {
    const now = D('2026-05-30')
    expect(canSendTutorMessage({ date: '2026-05-29', count: 99 }, 'free', now)).toBe(true)
  })

  it('paid plans are never blocked by the daily cap', () => {
    const now = D('2026-05-30')
    const maxed = { date: '2026-05-30', count: 999 }
    expect(canSendTutorMessage(maxed, 'standard', now)).toBe(true)
    expect(canSendTutorMessage(maxed, 'premium', now)).toBe(true)
    expect(canSendTutorMessage(maxed, 'admin', now)).toBe(true)
  })

  it('bumpUsage increments today and resets on a new day', () => {
    const now = D('2026-05-30')
    expect(bumpUsage(null, now)).toEqual({ date: '2026-05-30', count: 1 })
    expect(bumpUsage({ date: '2026-05-30', count: 1 }, now)).toEqual({ date: '2026-05-30', count: 2 })
    expect(bumpUsage({ date: '2026-05-29', count: 4 }, now)).toEqual({ date: '2026-05-30', count: 1 })
  })

  it('exposes the cap constant', () => {
    expect(FREE_TUTOR_MSGS_PER_DAY).toBe(5)
  })
})
