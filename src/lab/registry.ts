import type { SimDefinition } from './types'

/**
 * Lazy module map — the single source of truth for which sims are built.
 * Each sim's three.js scene code is only fetched when its detail page opens.
 */
export const SIM_MODULES: Record<string, () => Promise<{ default: SimDefinition }>> = {
  projectile: () => import('./sims/projectile'),
}

export const builtIds = (): string[] => Object.keys(SIM_MODULES)
export const isBuilt = (id: string): boolean => id in SIM_MODULES
