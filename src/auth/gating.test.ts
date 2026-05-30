import { describe, it, expect } from 'vitest'
import { canAccessSim, FREE_SIM_LIMIT } from './gating'
import { SIM_MODULES } from '@/lab/registry'

const ids = Object.keys(SIM_MODULES)

describe('canAccessSim', () => {
  it('free/anon get exactly the first FREE_SIM_LIMIT built sims', () => {
    ids.slice(0, FREE_SIM_LIMIT).forEach((id) => expect(canAccessSim('free', id)).toBe(true))
    ids.slice(FREE_SIM_LIMIT).forEach((id) => expect(canAccessSim('free', id)).toBe(false))
    // anonymous (null) is treated like free
    expect(canAccessSim(null, ids[0])).toBe(true)
    expect(canAccessSim(null, ids[FREE_SIM_LIMIT])).toBe(false)
  })
  it('paid plans get everything', () => {
    ids.forEach((id) => {
      expect(canAccessSim('standard', id)).toBe(true)
      expect(canAccessSim('premium', id)).toBe(true)
      expect(canAccessSim('admin', id)).toBe(true)
    })
  })
})
