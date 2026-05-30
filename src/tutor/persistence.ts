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

/**
 * Store factory. Slice 1 always returns the local store; Slice 2 (Task 17)
 * branches to a Supabase-backed store when live + signed in.
 */
export function getTutorStore(): TutorStore {
  return localStore()
}
