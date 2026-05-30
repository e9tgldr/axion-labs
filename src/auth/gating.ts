import { SIM_MODULES } from '@/lab/registry'
import type { Plan } from './types'

export const FREE_SIM_LIMIT = 3

const freeIds = (): string[] => Object.keys(SIM_MODULES).slice(0, FREE_SIM_LIMIT)

/** Free/anonymous (null) viewers get the first FREE_SIM_LIMIT built sims; paid plans get all. */
export function canAccessSim(plan: Plan | null, simId: string): boolean {
  if (plan && plan !== 'free') return true
  return freeIds().includes(simId)
}
