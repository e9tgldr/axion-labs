import type { LLMClient } from './types'
import { mockClient } from './mockClient'

/** True when no Supabase backend is configured — same signal as auth's isDemo. */
export const isMockTutor = !import.meta.env.VITE_SUPABASE_URL

let singleton: LLMClient | null = null

/**
 * Returns the active LLM client. Slice 1: always the mock. Slice 2 (Task 16)
 * adds the proxy branch. The mock imports nothing from Supabase, so the
 * zero-network test/demo path is guaranteed.
 */
export function getLLMClient(): LLMClient {
  if (!singleton) singleton = mockClient()
  return singleton
}
