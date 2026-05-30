import type { AuthClient } from './types'
import { demoClient } from './demoClient'
import { createSupabaseClient } from './supabaseClient'

/** Demo mode whenever no Supabase URL is configured (the default in local builds). */
export const isDemo = !import.meta.env.VITE_SUPABASE_URL

let singleton: AuthClient | null = null

export function getAuthClient(): AuthClient {
  if (!singleton) singleton = isDemo ? demoClient() : createSupabaseClient()
  return singleton
}
