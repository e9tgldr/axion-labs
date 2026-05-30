import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * The ONE browser Supabase client, created on first use. Both the auth client
 * and the tutor proxy call this so they share a session/storage key (a second
 * createClient would have its own session → inconsistent Authorization
 * headers). Lazy so it is never constructed on the mock/test path.
 */
export function getSupabase(): SupabaseClient {
  if (!client) {
    client = createClient(
      import.meta.env.VITE_SUPABASE_URL as string,
      import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      { auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } },
    )
  }
  return client
}
