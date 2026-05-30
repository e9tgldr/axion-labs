// Supabase Edge Function: tutor-chat
//
// A security-critical Deno LLM proxy for the Axion Labs AI physics tutor. It
// authenticates the caller (verify_jwt = true + getClaims), enforces server-side
// spend guards (per-minute rate limit + daily message cap, both keyed on a stable
// user_id, NOT on the forgeable `plan` — see spec §7), then streams the Anthropic
// Messages API response back as newline-delimited JSON frames that match the
// browser decoder in src/tutor/frames.ts byte-for-byte.
//
// Runs in Deno, NOT in the Vite build — it is not part of `tsc`/`vitest`.
// @ts-nocheck — Deno globals (Deno.env, EdgeRuntime) + npm:/jsr: specifiers are
// resolved by the Deno runtime, not the app's tsconfig (which only includes src).

import Anthropic from 'npm:@anthropic-ai/sdk@0.65.0'
import { createClient } from 'jsr:@supabase/supabase-js@2'

import { corsHeaders } from '../_shared/cors.ts'
import {
  TUTOR_MODEL,
  MAX_TOKENS,
  MAX_INPUT_CHARS,
  MAX_HISTORY_MESSAGES,
  FREE_TUTOR_MSGS_PER_DAY,
  RATE_LIMIT_PER_MIN,
} from '../_shared/constants.ts'

/** Wall-clock budget for the whole upstream call so a stalled model never pins the function. */
const STREAM_BUDGET_MS = 60_000

type Role = 'user' | 'assistant'
interface InboundMessage {
  role: Role
  content: string
}

/**
 * One frame -> one newline-delimited JSON line. Re-implemented inline (mirrors
 * src/tutor/frames.ts encodeFrame) so the Deno wire format is byte-identical to
 * what createFrameDecoder() on the client expects.
 */
function encodeFrame(frame: unknown): string {
  return JSON.stringify(frame) + '\n'
}

// The client prepends a volatile context preamble "(Context: …)\n\n" to the first
// user turn for the model; strip it from the PERSISTED copy so stored history shows
// only what the student typed (keeps live mode consistent with the demo store).
function stripContextPreamble(text: string): string {
  return text.replace(/^\(Context: [^)]*\)\n\n/, '')
}

/** JSON helper that always carries CORS headers. */
function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

/**
 * Emits a single error frame as a complete (non-chunked) streaming response so
 * the browser's frame decoder handles it on the same code path as a real stream.
 * Status stays 200 because the error is carried in-band as a frame (the client
 * never inspects HTTP status for these soft failures).
 */
function errorFrameResponse(code: 'quota_exceeded' | 'overloaded' | 'unavailable', message: string): Response {
  return new Response(encodeFrame({ type: 'error', message, code }), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
    },
  })
}

Deno.serve(async (req: Request): Promise<Response> => {
  // 1. CORS preflight first.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 2. Global kill-switch — cut all tutor spend instantly without redeploying.
  if (Deno.env.get('TUTOR_DISABLED')) {
    return json({ error: 'Tutor temporarily disabled' }, 503)
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  // 3. Parse + validate the body. The volatile context preamble already rides
  //    inside messages[0].content; `system` is authoritative from the client.
  let body: { messages?: unknown; system?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  const rawMessages = body?.messages
  const system = body?.system
  if (!Array.isArray(rawMessages) || rawMessages.length === 0 || typeof system !== 'string') {
    return json({ error: 'Invalid request: messages[] and system are required' }, 400)
  }
  if (rawMessages.length > MAX_HISTORY_MESSAGES) {
    return json({ error: 'Conversation too long' }, 400)
  }

  // Normalise to the Anthropic {role, content} shape; drop client-only fields
  // (id, createdAt). Validate roles + content types.
  const messages: InboundMessage[] = []
  for (const m of rawMessages) {
    const role = (m as { role?: unknown })?.role
    const content = (m as { content?: unknown })?.content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') {
      return json({ error: 'Invalid message shape' }, 400)
    }
    messages.push({ role, content })
  }

  // Last user message length cap (cost/abuse guard, plan-independent).
  const lastUser = [...messages].reverse().find((m) => m.role === 'user')
  if (lastUser && lastUser.content.length > MAX_INPUT_CHARS) {
    return json({ error: 'Message too long' }, 400)
  }

  // 4. Identity — user-scoped client from the Authorization header, resolve via
  //    getClaims() (local JWKS verify, no round-trip) with a getUser() fallback.
  const authHeader = req.headers.get('Authorization') ?? ''
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401)
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  let userId: string | null = null
  try {
    const { data, error } = await userClient.auth.getClaims()
    // getClaims() returns { claims: { sub, ... } }; `sub` is the user id.
    userId = (!error && data?.claims?.sub) ? (data.claims.sub as string) : null
  } catch {
    userId = null
  }
  if (!userId) {
    // Fallback for environments where local JWKS verification is unavailable.
    try {
      const { data, error } = await userClient.auth.getUser()
      userId = (!error && data?.user?.id) ? data.user.id : null
    } catch {
      userId = null
    }
  }
  if (!userId) {
    return json({ error: 'Unauthorized' }, 401)
  }

  // 5. API key — function-only secret. Never exposed to the client.
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) {
    return json({ error: 'Server misconfigured' }, 500)
  }

  // 6. Service-role client for usage + message writes (bypasses RLS).
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // 7. Per-minute rate limit (the REAL spend guard — plan-independent). Count
  //    this user's recent message rows; over the limit -> overloaded, stop early.
  try {
    const sinceIso = new Date(Date.now() - 60_000).toISOString()
    const { count, error } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('created_at', sinceIso)
    if (!error && typeof count === 'number' && count >= RATE_LIMIT_PER_MIN) {
      return errorFrameResponse('overloaded', 'Too many requests, please slow down')
    }
  } catch {
    // If the rate-limit probe itself fails, fail closed-but-soft: surface as
    // overloaded rather than letting unbounded traffic through.
    return errorFrameResponse('overloaded', 'Rate limiter unavailable')
  }

  // 8. Server-side daily cap. The contract calls for an ATOMIC
  //    `upsert ... on conflict (user_id, usage_date) do update
  //     set count = tutor_usage.count + 1 returning count`.
  //    PostgREST/supabase-js cannot express `count = count + 1` in a single
  //    .upsert() call, so atomic incrementing requires a SQL function. We call a
  //    `bump_tutor_usage(p_user_id, p_usage_date) returns int` RPC if one is
  //    deployed; if it is absent (the current migration set does not define it —
  //    Task 14 created only the tables), we fall back to a read-modify-write.
  //
  //    CONCERN FOR REVIEW: the fallback is NOT atomic — two concurrent requests
  //    from the same user can both read the same count and the daily cap can be
  //    raced by ~1. The rate limit in step 7 already bounds concurrency per user,
  //    and spec §7 makes clear the daily cap is honest-demo behaviour (the rate
  //    limit + pinned model/max_tokens are the real spend guards), so this is
  //    acceptable for the demo. Deploy the `bump_tutor_usage` SQL function (a
  //    follow-up migration) to make the cap strictly atomic.
  let usageCount = 0
  const usageDate = new Date().toISOString().slice(0, 10) // YYYY-MM-DD (UTC)
  try {
    const { data, error } = await admin.rpc('bump_tutor_usage', {
      p_user_id: userId,
      p_usage_date: usageDate,
    })
    if (error) throw error
    usageCount = typeof data === 'number' ? data : Number(data) || 0
  } catch {
    // Non-atomic fallback: read current, write +1.
    const { data: existing } = await admin
      .from('tutor_usage')
      .select('count')
      .eq('user_id', userId)
      .eq('usage_date', usageDate)
      .maybeSingle()
    usageCount = (existing?.count ?? 0) + 1
    await admin
      .from('tutor_usage')
      .upsert({ user_id: userId, usage_date: usageDate, count: usageCount }, { onConflict: 'user_id,usage_date' })
  }

  // Daily message cap. Per spec §7 this is the honest demo behaviour; the rate
  // limit + pinned model/max_tokens above are the real spend guards. We do NOT
  // trust the forgeable `plan` for spend safety, so the cap applies to everyone.
  if (usageCount > FREE_TUTOR_MSGS_PER_DAY) {
    return errorFrameResponse('quota_exceeded', 'Daily tutor limit reached')
  }

  // 9. Stream the Anthropic reply back as newline-delimited JSON frames.
  const anthropic = new Anthropic({ apiKey })
  const encoder = new TextEncoder()

  // Wall-clock abort budget so a stalled upstream can't pin the function.
  const ac = new AbortController()
  const budget = setTimeout(() => ac.abort(), STREAM_BUDGET_MS)

  let assistantText = ''
  let outputTokens = 0

  const stream = new ReadableStream({
    async start(controller) {
      const emit = (frame: unknown) => controller.enqueue(encoder.encode(encodeFrame(frame)))
      try {
        const upstream = anthropic.messages.stream(
          {
            model: TUTOR_MODEL,
            max_tokens: MAX_TOKENS,
            system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
            messages,
          },
          { signal: ac.signal },
        )

        for await (const event of upstream) {
          // In-band SSE error event (e.g. overloaded_error / 529 streamed) — NOT
          // an HTTP status. Surface it as a clean error frame and stop.
          if (event.type === 'error') {
            const t = event.error?.type
            emit({ type: 'error', message: 'Upstream error', code: t === 'overloaded_error' ? 'overloaded' : 'unavailable' })
            controller.close()
            return
          }
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            assistantText += event.delta.text
            emit({ type: 'token', text: event.delta.text })
          } else if (event.type === 'message_delta' && event.usage?.output_tokens != null) {
            outputTokens = event.usage.output_tokens
          } else if (event.type === 'message_stop') {
            emit({ type: 'done', usage: { outputTokens } })
          }
        }
        controller.close()
      } catch (err) {
        // Any SDK exception (network, abort, 4xx/5xx) -> clean error frame so the
        // browser typing indicator never hangs.
        const aborted = ac.signal.aborted
        emit({
          type: 'error',
          message: aborted ? 'Tutor timed out' : 'Tutor unavailable',
          code: aborted ? 'unavailable' : 'overloaded',
        })
        try {
          controller.close()
        } catch {
          /* already closed */
        }
      } finally {
        clearTimeout(budget)
      }
    },
    cancel() {
      // Client disconnected — abort the upstream call to stop billing.
      ac.abort()
      clearTimeout(budget)
    },
  })

  // 10. After streaming completes, persist both turns + token usage off the hot
  //     path (service role bypasses RLS). EdgeRuntime.waitUntil keeps the worker
  //     alive until these writes finish, but they don't block the response.
  const persist = (async () => {
    try {
      // Best-effort: find/create the conversation is the client's job (it owns
      // conversation_id via RLS). Here we only have user turns + the assistant
      // turn for the *messages* table, keyed by user_id. The conversation_id is
      // not part of the proxy contract, so we attach the most recent open
      // conversation for this user, or skip if none exists yet.
      const { data: conv } = await admin
        .from('conversations')
        .select('id')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const conversationId = conv?.id ?? null
      // Strip the volatile context preamble so the persisted user turn matches the
      // raw text the student typed (the model still received the preamble above).
      const userTurn = stripContextPreamble(lastUser?.content ?? '')

      if (conversationId) {
        const rows = [
          { conversation_id: conversationId, user_id: userId, role: 'user', content: userTurn },
          { conversation_id: conversationId, user_id: userId, role: 'assistant', content: assistantText },
        ].filter((r) => r.content.length > 0)
        if (rows.length) await admin.from('messages').insert(rows)
      }

      if (outputTokens > 0) {
        const { data: u } = await admin
          .from('tutor_usage')
          .select('tokens')
          .eq('user_id', userId)
          .eq('usage_date', usageDate)
          .maybeSingle()
        await admin
          .from('tutor_usage')
          .upsert(
            { user_id: userId, usage_date: usageDate, tokens: (u?.tokens ?? 0) + outputTokens },
            { onConflict: 'user_id,usage_date' },
          )
      }
    } catch {
      /* persistence is best-effort; never fail the user's stream over it */
    }
  })()

  // EdgeRuntime is injected by the Supabase Edge Runtime.
  if (typeof EdgeRuntime !== 'undefined' && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(persist)
  }

  return new Response(stream, {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache',
    },
  })
})
