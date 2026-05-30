export type Plan = 'free' | 'standard' | 'premium' | 'admin'

export interface AuthUser {
  id: string
  email: string | null
}

export interface Profile {
  id: string
  displayName: string
  avatarUrl: string | null
  locale: string
  plan: Plan
  trialEndsAt: string | null
}

export interface Favorite {
  simId: string
  createdAt: string
}

export type AuthChangeHandler = (user: AuthUser | null) => void

/** Backend-agnostic auth + account contract. Implemented by demoClient and supabaseClient. */
export interface AuthClient {
  getSession(): Promise<AuthUser | null>
  onAuthChange(cb: AuthChangeHandler): () => void
  signInWithGoogle(): Promise<void>
  signInWithPassword(email: string, password: string): Promise<void>
  signUp(email: string, password: string, displayName: string): Promise<void>
  signOut(): Promise<void>
  getProfile(userId: string): Promise<Profile>
  updateProfile(patch: Partial<Pick<Profile, 'displayName' | 'locale'>>): Promise<Profile>
  setPlan(plan: Plan): Promise<Profile>
  listFavorites(): Promise<Favorite[]>
  toggleFavorite(simId: string): Promise<Favorite[]>
}
