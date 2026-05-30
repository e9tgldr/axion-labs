import type {
  AuthChangeHandler,
  AuthClient,
  AuthUser,
  Favorite,
  Plan,
  Profile,
} from './types'

const K = {
  user: 'axion.demo.user',
  profile: 'axion.demo.profile',
  favs: 'axion.demo.favorites',
}

const read = <T,>(k: string): T | null => {
  try {
    const v = localStorage.getItem(k)
    return v ? (JSON.parse(v) as T) : null
  } catch {
    return null
  }
}
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))

/** localStorage-backed auth, used when no Supabase credentials are configured. */
export function demoClient(): AuthClient {
  const listeners = new Set<AuthChangeHandler>()
  const emit = (u: AuthUser | null) => listeners.forEach((l) => l(u))

  const ensureProfile = (user: AuthUser, displayName?: string): Profile => {
    let p = read<Profile>(K.profile)
    if (!p || p.id !== user.id) {
      p = {
        id: user.id,
        displayName: displayName || user.email?.split('@')[0] || 'Explorer',
        avatarUrl: null,
        locale: 'mn',
        plan: 'free',
        trialEndsAt: null,
      }
      write(K.profile, p)
    }
    return p
  }

  const signedInAs = (email: string | null, displayName?: string) => {
    const user: AuthUser = { id: `demo-${(email || 'google').toLowerCase()}`, email }
    write(K.user, user)
    ensureProfile(user, displayName)
    emit(user)
  }

  return {
    async getSession() {
      return read<AuthUser>(K.user)
    },
    onAuthChange(cb) {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    async signInWithGoogle() {
      signedInAs('demo@axion.dev', 'Demo User')
    },
    async signInWithPassword(email) {
      signedInAs(email)
    },
    async signUp(email, _password, displayName) {
      signedInAs(email, displayName)
    },
    async signOut() {
      localStorage.removeItem(K.user)
      emit(null)
    },
    async getProfile(userId) {
      const p = read<Profile>(K.profile)
      if (p && p.id === userId) return p
      return ensureProfile({ id: userId, email: null })
    },
    async updateProfile(patch) {
      const p = read<Profile>(K.profile)
      const next = { ...(p as Profile), ...patch }
      write(K.profile, next)
      return next
    },
    async setPlan(plan: Plan) {
      const p = read<Profile>(K.profile)
      const next = { ...(p as Profile), plan }
      write(K.profile, next)
      return next
    },
    async listFavorites() {
      return read<Favorite[]>(K.favs) ?? []
    },
    async toggleFavorite(simId) {
      const list = read<Favorite[]>(K.favs) ?? []
      const exists = list.some((f) => f.simId === simId)
      const next = exists
        ? list.filter((f) => f.simId !== simId)
        : [...list, { simId, createdAt: new Date().toISOString() }]
      write(K.favs, next)
      return next
    },
  }
}
