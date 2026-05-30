import type { Lang } from '@/i18n'
import type { Grade } from '@/data/curriculum'

export type Role = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: Role
  content: string
  createdAt: string
}

export interface TutorContext {
  lang: Lang
  grade?: Grade
  simId?: string
  topic?: string
}

export type TutorErrorCode = 'quota_exceeded' | 'overloaded' | 'unavailable'

export type TutorFrame =
  | { type: 'token'; text: string }
  | { type: 'done'; usage?: { outputTokens: number } }
  | { type: 'error'; message: string; code?: TutorErrorCode }

export interface Conversation {
  id: string
  title: string
  simId?: string
  grade?: number
  createdAt: string
}

export interface LLMClient {
  /** Streams the assistant reply as frames. Mock and proxy emit byte-identical frames. */
  stream(
    history: ChatMessage[],
    ctx: TutorContext,
    signal?: AbortSignal,
  ): AsyncIterable<TutorFrame>
}
