import { createContext, useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '@/auth/useAuth'
import { getLLMClient, isMockTutor } from './client'
import { getTutorStore } from './persistence'
import { buildContextPreamble } from './systemPrompt'
import { canSendTutorMessage, bumpUsage, type UsageToday } from './gating'
import type { ChatMessage, Conversation, TutorContext } from './types'

const uid = () => crypto.randomUUID()
const nowIso = () => new Date().toISOString()

export interface TutorContextValue {
  conversations: Conversation[]
  activeId: string | null
  messages: ChatMessage[]
  streaming: boolean
  streamingText: string
  usage: UsageToday | null
  canSend: boolean
  isMock: boolean
  error: string | null // i18n key ('errorGeneric' | 'errorQuota') or null
  send: (text: string, ctx: TutorContext) => Promise<void>
  stop: () => void
  newConversation: () => void
  selectConversation: (id: string) => void
}

export const TutorCtx = createContext<TutorContextValue | null>(null)

export function TutorProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const client = useRef(getLLMClient()).current
  const store = useRef(getTutorStore()).current
  const abortRef = useRef<AbortController | null>(null)

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [usage, setUsage] = useState<UsageToday | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    Promise.all([store.listConversations(), store.getUsage()]).then(([c, u]) => {
      if (alive) {
        setConversations(c)
        setUsage(u)
      }
    })
    return () => {
      alive = false
    }
  }, [store])

  const selectConversation = useCallback(
    (id: string) => {
      setActiveId(id)
      store.listMessages(id).then(setMessages)
    },
    [store],
  )

  const newConversation = useCallback(() => {
    setActiveId(null)
    setMessages([])
  }, [])

  const stop = useCallback(() => abortRef.current?.abort(), [])

  const send = useCallback(
    async (text: string, ctx: TutorContext) => {
      if (streaming) return
      const plan = profile?.plan ?? null
      if (!canSendTutorMessage(usage, plan, new Date())) return
      setError(null)

      // Ensure a conversation exists; capture a definitely-string id (convId is
      // assigned in the branch, so the non-null assertion is sound at runtime).
      let convId = activeId
      if (!convId) {
        const conv: Conversation = {
          id: uid(),
          title: text.slice(0, 40),
          simId: ctx.simId,
          grade: ctx.grade,
          createdAt: nowIso(),
        }
        await store.createConversation(conv)
        setConversations((cs) => [...cs, conv])
        convId = conv.id
        setActiveId(convId)
      }
      const cid: string = convId!

      // Display + persist the RAW text only. The volatile context preamble is
      // sent to the model on the first turn but never shown or stored, so the
      // student never sees "(Context: …)" in their own bubble.
      const userMsg: ChatMessage = { id: uid(), role: 'user', content: text, createdAt: nowIso() }
      const display = [...messages, userMsg]
      setMessages(display)
      await store.appendMessage(cid, userMsg)

      const preamble = messages.length === 0 ? buildContextPreamble(ctx) : ''
      const modelHistory = preamble
        ? [...messages, { ...userMsg, content: preamble + text }]
        : display

      // Bump + persist usage.
      const nextUsage = bumpUsage(usage, new Date())
      setUsage(nextUsage)
      await store.setUsage(nextUsage)

      // Stream the assistant reply.
      setStreaming(true)
      setStreamingText('')
      const ctrl = new AbortController()
      abortRef.current = ctrl
      let acc = ''
      try {
        for await (const frame of client.stream(modelHistory, ctx, ctrl.signal)) {
          if (frame.type === 'token') {
            acc += frame.text
            setStreamingText(acc)
          } else if (frame.type === 'error') {
            setError(frame.code === 'quota_exceeded' ? 'errorQuota' : 'errorGeneric')
            break
          } else {
            break // done — server tutor_usage.tokens is authoritative; client ignores done.usage
          }
        }
      } finally {
        setStreaming(false)
        abortRef.current = null
        if (acc) {
          const assistant: ChatMessage = { id: uid(), role: 'assistant', content: acc, createdAt: nowIso() }
          setMessages((m) => [...m, assistant])
          await store.appendMessage(cid, assistant)
        }
        setStreamingText('')
      }
    },
    [streaming, profile, usage, activeId, messages, store, client],
  )

  const value: TutorContextValue = {
    conversations,
    activeId,
    messages,
    streaming,
    streamingText,
    usage,
    canSend: canSendTutorMessage(usage, profile?.plan ?? null, new Date()),
    isMock: isMockTutor,
    error,
    send,
    stop,
    newConversation,
    selectConversation,
  }
  return <TutorCtx.Provider value={value}>{children}</TutorCtx.Provider>
}
