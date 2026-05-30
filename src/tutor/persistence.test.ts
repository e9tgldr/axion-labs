import { describe, it, expect, beforeEach } from 'vitest'
import { localStore } from './persistence'
import type { ChatMessage, Conversation } from './types'

beforeEach(() => localStorage.clear())

const conv: Conversation = { id: 'c1', title: 'Projectiles', simId: 'projectile', grade: 9, createdAt: '2026-05-30T10:00:00.000Z' }
const msg = (id: string, role: 'user' | 'assistant', content: string): ChatMessage => ({ id, role, content, createdAt: '2026-05-30T10:00:00.000Z' })

describe('localStore', () => {
  it('creates and lists conversations', async () => {
    const s = localStore()
    expect(await s.listConversations()).toEqual([])
    await s.createConversation(conv)
    expect(await s.listConversations()).toEqual([conv])
  })

  it('appends and lists messages per conversation', async () => {
    const s = localStore()
    await s.createConversation(conv)
    await s.appendMessage('c1', msg('m1', 'user', 'hi'))
    await s.appendMessage('c1', msg('m2', 'assistant', 'hello'))
    const msgs = await s.listMessages('c1')
    expect(msgs.map((m) => m.id)).toEqual(['m1', 'm2'])
    expect(await s.listMessages('other')).toEqual([])
  })

  it('reads and writes usage', async () => {
    const s = localStore()
    expect(await s.getUsage()).toBeNull()
    await s.setUsage({ date: '2026-05-30', count: 2 })
    expect(await s.getUsage()).toEqual({ date: '2026-05-30', count: 2 })
  })
})
