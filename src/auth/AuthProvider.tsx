import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { getAuthClient, isDemo as isDemoEnv } from './client'
import type { AuthUser, Favorite, Plan, Profile } from './types'

export interface AuthContextValue {
  user: AuthUser | null
  profile: Profile | null
  favorites: Favorite[]
  loading: boolean
  isDemo: boolean
  signInWithGoogle: () => Promise<void>
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<Pick<Profile, 'displayName' | 'locale'>>) => Promise<void>
  setPlan: (plan: Plan) => Promise<void>
  toggleFavorite: (simId: string) => Promise<void>
  isFavorite: (simId: string) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const client = useRef(getAuthClient()).current
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (u: AuthUser | null) => {
      setUser(u)
      if (u) {
        const [p, f] = await Promise.all([client.getProfile(u.id), client.listFavorites()])
        setProfile(p)
        setFavorites(f)
      } else {
        setProfile(null)
        setFavorites([])
      }
    },
    [client],
  )

  useEffect(() => {
    let alive = true
    client.getSession().then((u) => {
      if (alive) load(u).finally(() => setLoading(false))
    })
    const off = client.onAuthChange((u) => {
      if (alive) load(u)
    })
    return () => {
      alive = false
      off()
    }
  }, [client, load])

  const value: AuthContextValue = {
    user,
    profile,
    favorites,
    loading,
    isDemo: isDemoEnv,
    signInWithGoogle: () => client.signInWithGoogle(),
    signInWithPassword: (e, p) => client.signInWithPassword(e, p),
    signUp: (e, p, n) => client.signUp(e, p, n),
    signOut: () => client.signOut(),
    updateProfile: async (patch) => setProfile(await client.updateProfile(patch)),
    setPlan: async (plan) => setProfile(await client.setPlan(plan)),
    toggleFavorite: async (simId) => setFavorites(await client.toggleFavorite(simId)),
    isFavorite: (simId) => favorites.some((f) => f.simId === simId),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
