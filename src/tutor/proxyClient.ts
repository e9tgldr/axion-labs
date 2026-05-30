import { getSupabase } from '@/auth/supabaseBrowser'
import { buildSystemPrompt } from './systemPrompt'
import { createFrameDecoder } from './frames'
import type { LLMClient } from './types'

const FUNCTIONS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tutor-chat`
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export function proxyClient(): LLMClient {
  return {
    async *stream(history, ctx, signal) {
      const { data } = await getSupabase().auth.getSession()
      const token = data.session?.access_token
      if (!token) {
        yield { type: 'error', message: 'Not signed in', code: 'unavailable' }
        return
      }
      const res = await fetch(FUNCTIONS_URL, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON, // gateway requires this in addition to Authorization
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ system: buildSystemPrompt(ctx.lang), messages: history }),
      })
      if (!res.ok || !res.body) {
        yield { type: 'error', message: `HTTP ${res.status}`, code: 'unavailable' }
        return
      }
      const reader = res.body.getReader()
      const dec = createFrameDecoder()
      // while-loop, NOT for-await (Safari 18 lacks async iteration on ReadableStream)
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        for (const frame of dec.push(value)) yield frame
      }
      for (const frame of dec.flush()) yield frame
    },
  }
}
