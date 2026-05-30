import { getSupabase } from '@/auth/supabaseBrowser'
import { isMockTutor } from './client'
import type { ChatMessage, Conversation } from './types'
import type { UsageToday } from './gating'

export interface TutorStore {
  listConversations(): Promise<Conversation[]>
  createConversation(c: Conversation): Promise<void>
  listMessages(conversationId: string): Promise<ChatMessage[]>
  appendMessage(conversationId: string, m: ChatMessage): Promise<void>
  getUsage(): Promise<UsageToday | null>
  setUsage(u: UsageToday): Promise<void>
}

const K = {
  convos: 'axion.tutor.conversations',
  messages: 'axion.tutor.messages',
  usage: 'axion.tutor.usage',
}

const read = <T,>(k: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(k)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
const write = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v))

/** localStorage-backed store — the demo/default path (no Supabase). */
export function localStore(): TutorStore {
  return {
    async listConversations() {
      return read<Conversation[]>(K.convos, [])
    },
    async createConversation(c) {
      write(K.convos, [...read<Conversation[]>(K.convos, []), c])
    },
    async listMessages(conversationId) {
      const all = read<Record<string, ChatMessage[]>>(K.messages, {})
      return all[conversationId] ?? []
    },
    async appendMessage(conversationId, m) {
      const all = read<Record<string, ChatMessage[]>>(K.messages, {})
      all[conversationId] = [...(all[conversationId] ?? []), m]
      write(K.messages, all)
    },
    async getUsage() {
      return read<UsageToday | null>(K.usage, null)
    },
    async setUsage(u) {
      write(K.usage, u)
    },
  }
}

/** Resolve the signed-in user's id, or null if there is no session. */
async function currentUserId(): Promise<string | null> {
  try {
    const { data } = await getSupabase().auth.getUser()
    return data.user?.id ?? null
  } catch {
    return null
  }
}

/**
 * Supabase-backed store — the live path. Reads `conversations`/`messages`
 * (RLS scopes them to the owner) and today's `tutor_usage` row. Writes that
 * the client has no RLS policy for (`appendMessage`, `setUsage`) are no-ops:
 * the tutor-chat Edge Function persists both message turns and the usage
 * counter with the service role. All reads tolerate failure (empty/null) so a
 * transient error never crashes the chat UI.
 */
export function supabaseStore(): TutorStore {
  return {
    async listConversations() {
      try {
        const { data, error } = await getSupabase()
          .from('conversations')
          .select('*')
          .order('created_at')
        if (error || !data) return []
        return data.map(
          (r): Conversation => ({
            id: r.id,
            title: r.title ?? '',
            simId: r.sim_id ?? undefined,
            grade: r.grade ?? undefined,
            createdAt: r.created_at,
          }),
        )
      } catch {
        return []
      }
    },
    async createConversation(c) {
      try {
        const userId = await currentUserId()
        if (!userId) return
        await getSupabase()
          .from('conversations')
          .insert({
            id: c.id,
            user_id: userId,
            title: c.title,
            sim_id: c.simId ?? null,
            grade: c.grade ?? null,
            created_at: c.createdAt,
          })
      } catch {
        // ignore — a failed insert just means the row isn't persisted
      }
    },
    async listMessages(conversationId) {
      try {
        const { data, error } = await getSupabase()
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at')
        if (error || !data) return []
        return data.map(
          (r): ChatMessage => ({
            id: r.id,
            role: r.role,
            content: r.content,
            createdAt: r.created_at,
          }),
        )
      } catch {
        return []
      }
    },
    async appendMessage() {
      // No-op: the Edge Function writes both turns via the service role; the
      // client has no INSERT policy on `messages`.
    },
    async getUsage() {
      try {
        const userId = await currentUserId()
        if (!userId) return null
        const today = new Date().toISOString().slice(0, 10)
        const { data, error } = await getSupabase()
          .from('tutor_usage')
          .select('usage_date, count')
          .eq('user_id', userId)
          .eq('usage_date', today)
          .maybeSingle()
        if (error || !data) return null
        return { date: data.usage_date, count: data.count }
      } catch {
        return null
      }
    },
    async setUsage() {
      // No-op: the Edge Function writes usage; the client has no write policy.
    },
  }
}

/**
 * Store factory. Mock mode returns the localStorage store; live mode branches
 * to the Supabase-backed store (constructed only off the mock path).
 */
export function getTutorStore(): TutorStore {
  return isMockTutor ? localStore() : supabaseStore()
}
