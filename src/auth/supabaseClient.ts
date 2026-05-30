import { getSupabase } from './supabaseBrowser'
import type { AuthClient, AuthUser, Plan, Profile } from './types'

const toUser = (u: { id: string; email?: string | null } | null | undefined): AuthUser | null =>
  u ? { id: u.id, email: u.email ?? null } : null

const rowToProfile = (r: Record<string, unknown>): Profile => ({
  id: r.id as string,
  displayName: (r.display_name as string) ?? 'Explorer',
  avatarUrl: (r.avatar_url as string | null) ?? null,
  locale: (r.locale as string) ?? 'mn',
  plan: (r.plan as Plan) ?? 'free',
  trialEndsAt: (r.trial_ends_at as string | null) ?? null,
})

/** Real Supabase-backed AuthClient. Used when VITE_SUPABASE_URL is configured. */
export function createSupabaseClient(): AuthClient {
  const sb = getSupabase()

  const requireUid = async (): Promise<string> => {
    const { data } = await sb.auth.getUser()
    if (!data.user) throw new Error('Not signed in')
    return data.user.id
  }

  const listFavorites = async () => {
    const uid = await requireUid()
    const { data, error } = await sb.from('favorites').select('sim_id, created_at').eq('user_id', uid)
    if (error) throw error
    return (data ?? []).map((r) => ({
      simId: r.sim_id as string,
      createdAt: r.created_at as string,
    }))
  }

  return {
    async getSession() {
      const { data } = await sb.auth.getUser()
      return toUser(data.user)
    },
    onAuthChange(cb) {
      const { data } = sb.auth.onAuthStateChange((_event, session) => cb(toUser(session?.user)))
      return () => data.subscription.unsubscribe()
    },
    async signInWithGoogle() {
      await sb.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/dashboard` },
      })
    },
    async signInWithPassword(email, password) {
      const { error } = await sb.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password, displayName) {
      const { error } = await sb.auth.signUp({
        email,
        password,
        options: { data: { full_name: displayName } },
      })
      if (error) throw error
    },
    async signOut() {
      await sb.auth.signOut()
    },
    async getProfile(userId) {
      const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      return rowToProfile(data)
    },
    async updateProfile(patch) {
      const uid = await requireUid()
      const row: Record<string, unknown> = {}
      if (patch.displayName !== undefined) row.display_name = patch.displayName
      if (patch.locale !== undefined) row.locale = patch.locale
      const { data, error } = await sb.from('profiles').update(row).eq('id', uid).select('*').single()
      if (error) throw error
      return rowToProfile(data)
    },
    async setPlan(plan) {
      const uid = await requireUid()
      const { data, error } = await sb
        .from('profiles')
        .update({ plan })
        .eq('id', uid)
        .select('*')
        .single()
      if (error) throw error
      return rowToProfile(data)
    },
    listFavorites,
    async toggleFavorite(simId) {
      const uid = await requireUid()
      const { data: existing } = await sb
        .from('favorites')
        .select('sim_id')
        .eq('user_id', uid)
        .eq('sim_id', simId)
        .maybeSingle()
      if (existing) {
        await sb.from('favorites').delete().eq('user_id', uid).eq('sim_id', simId)
      } else {
        await sb.from('favorites').insert({ user_id: uid, sim_id: simId })
      }
      return listFavorites()
    },
  }
}
