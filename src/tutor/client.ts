import { mockClient } from './mockClient'
import { proxyClient } from './proxyClient'
import type { LLMClient } from './types'

export const isMockTutor = !import.meta.env.VITE_SUPABASE_URL

let singleton: LLMClient | null = null
export function getLLMClient(): LLMClient {
  if (!singleton) singleton = isMockTutor ? mockClient() : proxyClient()
  return singleton
}
