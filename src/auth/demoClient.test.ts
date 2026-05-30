import { describe, it, expect, beforeEach } from 'vitest'
import { demoClient } from './demoClient'

beforeEach(() => localStorage.clear())

describe('demoClient', () => {
  it('signs in (google), auto-creates a free profile, signs out', async () => {
    const c = demoClient()
    expect(await c.getSession()).toBeNull()
    await c.signInWithGoogle()
    const u = await c.getSession()
    expect(u).not.toBeNull()
    const p = await c.getProfile(u!.id)
    expect(p.plan).toBe('free')
    expect(p.displayName).toBe('Demo User')
    await c.signOut()
    expect(await c.getSession()).toBeNull()
  })

  it('toggles favorites and switches plan', async () => {
    const c = demoClient()
    await c.signInWithPassword('a@b.com', 'x')
    expect(await c.listFavorites()).toEqual([])
    let favs = await c.toggleFavorite('projectile')
    expect(favs.map((f) => f.simId)).toEqual(['projectile'])
    favs = await c.toggleFavorite('projectile')
    expect(favs).toEqual([])
    const p = await c.setPlan('premium')
    expect(p.plan).toBe('premium')
  })

  it('notifies auth-change listeners', async () => {
    const c = demoClient()
    const seen: (string | null)[] = []
    const off = c.onAuthChange((u) => seen.push(u?.id ?? null))
    await c.signInWithGoogle()
    await c.signOut()
    off()
    expect(seen).toHaveLength(2)
    expect(seen[1]).toBeNull()
  })
})
