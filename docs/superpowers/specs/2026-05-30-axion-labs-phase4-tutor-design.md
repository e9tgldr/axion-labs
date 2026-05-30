# Axion Labs — Phase 4a Design Spec: LLM Infrastructure + AI Tutor

**Date:** 2026-05-30
**Status:** Approved for planning
**Depends on:** Phase 1 (foundation, i18n, routing, `/tutor` stub), Phase 2 (lab catalog + `SIMULATIONS` metadata + sim registry), Phase 3 (auth: `AuthClient`, `AuthProvider`/`useAuth`, plans, gating pattern, `0001_init.sql`).
**Followed by:** Phase 4b (AI exam generation + grading) — reuses the `LLMClient` + Edge Function + persistence foundation built here.

---

## 1. Goal

Add the **24/7 AI physics tutor** to Axion Labs: a trilingual (MN/EN/ZH) streaming chat that helps grade 6–11 students, context-aware of the sim/topic they launched it from, plan-gated, and persisted per user. Built **mock-first**: the entire experience runs with **zero backend** against a deterministic mock, and a **Supabase Edge Function** proxy holding a real `ANTHROPIC_API_KEY` drops in transparently later — mirroring exactly how Phase 3 shipped a real Supabase path plus a localStorage demo fallback behind one pluggable interface.

### Decisions (locked)
- **Proxy:** a Supabase **Edge Function** (`tutor-chat`, Deno) holds `ANTHROPIC_API_KEY` as a Supabase secret. The client never sees the key. Abstracted behind a new client-side **`LLMClient`** interface with two impls (`mockClient`, `proxyClient`), selected by env at startup — the `AuthClient` pattern, applied to LLM.
- **Persistence:** new Supabase tables `conversations` + `messages` (RLS); localStorage in demo mode; chat history on the dashboard.
- **Gating:** free tier = **5 tutor messages/day** (`FREE_TUTOR_MSGS_PER_DAY = 5`, a named constant mirroring `FREE_SIM_LIMIT = 3`); paid = unlimited **message count**. See §7 for why "unlimited" is bounded by plan-independent cost guards, and why `plan` is not yet a real trust boundary.
- **Tutor UX:** context-aware (system prompt seeded with the launching sim's grade + topic; general physics otherwise), streamed token-by-token (mock simulates it), trilingual replies in the active UI language, KaTeX formula rendering, a persistent "demo tutor — simulated" badge in mock mode, and minor-safety guardrails.
- **Build order:** two slices (§3). **Slice 1** ships the whole tutor on the mock with no backend. **Slice 2** adds the real Edge Function + tables + RLS.

### Out of scope (Phase 4b or later)
Exam generation/grading; real billing/payments (plan stays the Phase-3 demo switch); per-token incremental KaTeX; conversation search; voice; image input; an admin moderation console.

---

## 2. Architecture — one interface, two implementations (mirrors Phase 3)

A single `TutorProvider` (React context) over a pluggable **`LLMClient`** interface, with two implementations and a factory that selects one at startup. App code only ever uses the context, so it is backend-agnostic and fully testable against the mock with no network.

```
src/tutor/
├─ types.ts            # LLMClient, ChatMessage, TutorContext, TutorFrame, Conversation
├─ frames.ts           # PURE wire-format: encode/parse TutorFrame, streamed-bytes decoder (unit-tested)
├─ client.ts           # getLLMClient(): mock vs proxy by env; export isMockTutor
├─ mockClient.ts       # deterministic, topic-aware, setTimeout-streamed canned answers
├─ proxyClient.ts      # fetch() → Edge Function, getReader()+TextDecoder stream (Slice 2)
├─ persistence.ts      # TutorStore: demo(localStorage) | supabase; same shape both ways
├─ gating.ts           # FREE_TUTOR_MSGS_PER_DAY=5, canSendTutorMessage(), usage counting
├─ systemPrompt.ts     # buildSystemPrompt(lang) frozen block + buildContextPreamble(ctx) volatile
├─ TutorProvider.tsx   # context: conversations, active, send(), streaming state, usage
├─ useTutor.ts         # hook -> context
├─ TutorPage.tsx       # /tutor chat UI (lazy-loaded)
├─ Markdown.tsx        # react-markdown + remark-math + rehype-katex, render at complete
└─ AskTutorButton.tsx  # deep-link button placed on SimDetailPage

src/auth/
└─ supabaseBrowser.ts  # NEW: single shared `supabase` browser client (prereq refactor, §6)

supabase/
├─ config.toml                       # NEW: [functions.tutor-chat] verify_jwt = true
├─ functions/_shared/cors.ts         # CORS headers (authorization, apikey, content-type)
├─ functions/_shared/constants.ts    # TUTOR_MODEL, caps, max_tokens — shared by function code
├─ functions/tutor-chat/index.ts     # the proxy (Slice 2)
└─ migrations/0002_tutor.sql         # conversations + messages + tutor_usage + RLS

src/i18n/locales/{mn,en,zh}/tutor.json   # new 'tutor' namespace (UI chrome only)
```

**Modified:** `src/App.tsx` (remove `/tutor` from `STUB_ROUTES`, add lazy `/tutor` route, wrap tree in `TutorProvider`), `src/main.tsx` (mount `TutorProvider` under `AuthProvider`), `src/auth/supabaseClient.ts` (consume the shared `supabaseBrowser` instead of its private `createClient`), `src/lab/SimDetailPage.tsx` (+`AskTutorButton`), `src/components/layout/Navbar.tsx` (tutor link), `src/routes/DashboardPage.tsx` (recent conversations card), `src/i18n/index.ts` (+`tutor` ns, 3 sites), `src/i18n/keyparity.test.ts` (import the `ns` list instead of a hardcoded array — §8), `supabase/SETUP.md` (Slice-2 go-live steps).

### 2.1 `LLMClient` interface (`types.ts`)
```ts
import type { Lang } from '@/i18n'
import type { Grade } from '@/data/curriculum'

export type Role = 'user' | 'assistant'
export interface ChatMessage { id: string; role: Role; content: string; createdAt: string }

export interface TutorContext {
  lang: Lang
  grade?: Grade          // sourced from the launching sim's metadata, NOT from Profile (no grade field exists)
  simId?: string
  topic?: string         // localized topic string for the active language
}

/** One frame of the streamed reply. Mock and proxy emit byte-identical frames. */
export type TutorFrame =
  | { type: 'token'; text: string }
  | { type: 'done'; usage?: { outputTokens: number } }
  | { type: 'error'; message: string; code?: 'quota_exceeded' | 'overloaded' | 'unavailable' }

export interface LLMClient {
  /** Unified streaming for BOTH mock and real. Yields frames; consumer renders tokens live. */
  stream(history: ChatMessage[], ctx: TutorContext, signal?: AbortSignal): AsyncIterable<TutorFrame>
}
```

The `TutorFrame` union and its newline-delimited-JSON encoding live in **`frames.ts`** as pure functions (`encodeFrame`, `parseFrames`, plus a `decodeChunks` helper using `TextDecoder({stream:true})`). Both the mock and the proxy's reader loop consume the same parser, and it is unit-tested directly (§8) — so the hardest, least test-covered transport code (multi-byte UTF-8 split across chunk boundaries) has real coverage even though the live function never runs in tests.

### 2.2 Client selection (`client.ts`)
```ts
export const isMockTutor = !import.meta.env.VITE_SUPABASE_URL
export function getLLMClient(): LLMClient { return isMockTutor ? mockClient() : proxyClient() }
```
Same env signal Phase 3 uses (`isDemo`). The `mockClient` imports nothing from Supabase, guaranteeing the zero-network test/demo path. The "demo tutor — simulated" badge is driven off **`isMockTutor`** so the label can never disagree with the actual client in use.

### 2.3 Provider data flow (`TutorProvider.tsx`)
On mount: load conversations from the active `TutorStore` (localStorage in demo, Supabase when live + signed in). `send(text)`:
1. Check `canSendTutorMessage(usage, plan)`; if blocked, surface an upgrade CTA (no request sent).
2. Append the user message optimistically; persist it.
3. Iterate `client.stream(history, ctx, signal)`, appending `token` frames to a live-growing assistant bubble.
4. On `done`, persist the finished assistant message and bump usage. On `error`, stop the typing indicator and show a tutor-toned message; keep the partial text.

Exposes `{ conversations, active, messages, streaming, usage, isMock, send, stop, newConversation, selectConversation }`.

---

## 3. Build slices

### Slice 1 — Tutor on the mock (zero backend)
`types.ts`, `frames.ts`, `mockClient.ts`, `client.ts`, `gating.ts`, `systemPrompt.ts`, `persistence.ts` (localStorage store only), `TutorProvider`, `useTutor`, `TutorPage`, `Markdown` (KaTeX), `AskTutorButton`, the `tutor` i18n namespace, route + nav wiring, and all unit tests. **New runtime deps:** `react-markdown`, `remark-math`, `rehype-katex`, `katex` (route-lazy via the `/tutor` chunk; `katex.css` imported in `Markdown.tsx`). Ships a fully clickable, trilingual, streaming, gated tutor with **no Supabase, no key, no migration**. This is the demo-mode product.

### Slice 2 — Real backend
`supabaseBrowser.ts` shared-client refactor (§6), `0002_tutor.sql` (tables + RLS + `tutor_usage`), `supabase/config.toml`, `_shared/cors.ts`, `_shared/constants.ts`, `functions/tutor-chat/index.ts`, `proxyClient.ts`, the Supabase `TutorStore` impl, `@anthropic-ai/sdk` (Deno import in the function only), and `SETUP.md` go-live steps. Flipping `VITE_SUPABASE_URL` on + deploying the function + setting the secret switches every flow to the real model with no UI change.

---

## 4. Data model (`supabase/migrations/0002_tutor.sql`) — Slice 2

```sql
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text,
  sim_id text,
  grade int,
  created_at timestamptz not null default now()
);
alter table public.conversations enable row level security;
create policy "own conversations read"   on public.conversations for select using (auth.uid() = user_id);
create policy "own conversations insert"  on public.conversations for insert with check (auth.uid() = user_id);
create policy "own conversations delete"  on public.conversations for delete using (auth.uid() = user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;
-- Client may READ its own messages, but NOT insert them. The Edge Function writes
-- both the user turn and the assistant turn with the service-role key, so a user
-- cannot forge role='assistant'/prior context (a self-injection path). See §7.
create policy "own messages read" on public.messages for select using (auth.uid() = user_id);

-- Per-user daily counter, written ONLY by the Edge Function (service role).
create table public.tutor_usage (
  user_id uuid not null references auth.users on delete cascade,
  usage_date date not null,
  count int not null default 0,
  tokens int not null default 0,
  primary key (user_id, usage_date)
);
alter table public.tutor_usage enable row level security;
create policy "own usage read" on public.tutor_usage for select using (auth.uid() = user_id);
-- no client insert/update policy: only service role mutates it
```

**Demo mode** uses the same logical shape in localStorage keys `axion.tutor.conversations`, `axion.tutor.messages`, `axion.tutor.usage`, via only `getItem/setItem/removeItem` (the vitest localStorage shim implements nothing else). The Dashboard "Recent conversations" card reads the active store.

---

## 5. Edge Function `supabase/functions/tutor-chat` — Slice 2 *(security-critical — written explicitly)*

- **Key handling:** reads `Deno.env.get('ANTHROPIC_API_KEY')` (set via `supabase secrets set`); 500s fast if absent. The key is a **function-only secret** — never a `VITE_*` var, never in the client bundle. Custom secret names may not start with `SUPABASE_`.
- **Identity:** `config.toml` sets `verify_jwt = true`. Inside, resolve the caller via `getClaims()` (local JWKS verify, no round-trip) for the hot path; reject requests without a valid JWT. **Anonymous users do not reach this function** — the live tutor requires sign-in (see §7); demo-mode anon never calls a network at all.
- **Streaming relay:** call `client.messages.stream({ model: TUTOR_MODEL, max_tokens, system, messages })` and re-emit each `text_delta` as a `TutorFrame` over a `ReadableStream` with `Content-Type: text/event-stream`, `Connection: keep-alive`, plus CORS headers. Emit a terminal `done` frame on `message_stop`. **Mid-stream upstream failures** (`overloaded_error`, the streamed 529 equivalent) arrive as an **in-band SSE `error` event**, not an HTTP status — catch both that and any SDK exception and emit a clean `{type:'error'}` frame so the browser typing indicator never hangs. An `AbortController` wall-clock budget prevents a stalled upstream from pinning the function.
- **Server-side enforcement (the real boundary):** before calling Anthropic, atomically `upsert tutor_usage … on conflict (user_id, usage_date) do update set count = tutor_usage.count + 1 returning count` with a service-role client. If over the cap (for the enforced tier — §7) return a `{type:'error', code:'quota_exceeded'}` frame. After streaming, write the user + assistant messages and add `tokens` to `tutor_usage` (via `EdgeRuntime.waitUntil`).
- **Cost/abuse guards independent of plan:** cap messages-per-request and total conversation tokens sent upstream, enforce a max input length and a per-minute rate limit, and pin `TUTOR_MODEL` + `max_tokens` server-side so the client cannot override them. "Unlimited" means *no daily message cap*, never *no spend cap*.
- **CORS:** `_shared/cors.ts` lists `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`; handle `OPTIONS` first; spread CORS into the streaming, 401, 429, and error responses (not just the happy path). Tighten `Allow-Origin` from `*` to the SPA origin in production.
- **Model + caching:** `TUTOR_MODEL = 'claude-haiku-4-5'` (3× cheaper than Sonnet, ample for grade 6–11; trivially swappable to `claude-sonnet-4-6` for a premium route later). The frozen system block carries `cache_control:{type:'ephemeral'}`; volatile per-launch context (grade, topic, language) goes **after** the breakpoint as the first user-turn preamble so it never invalidates the cache. **Known limitation:** a ~1K-token prompt is under Haiku 4.5's 4,096-token cache floor and will silently not cache (`cache_read_input_tokens` stays 0). Accepted for now (Haiku input is ~$1/MTok; savings marginal); revisit by padding the frozen block past 4,096 tokens or routing premium to Sonnet (caches from 1,024).

### 5.1 Client transport (`proxyClient.ts`)
Streaming **must not** go through `supabase.functions.invoke()` — it buffers the response and never yields tokens incrementally. Instead POST to `${VITE_SUPABASE_URL}/functions/v1/tutor-chat` with **both** headers manually: `apikey: VITE_SUPABASE_ANON_KEY` and `Authorization: Bearer <session.access_token>` (from the shared client's `getSession()`), then read `response.body.getReader()` in a `while` loop (not `for await … of`, unsupported in Safari 18.x) and decode with `TextDecoder().decode(chunk, { stream: true })` so multi-byte Mongolian/Chinese characters don't corrupt at chunk boundaries. `invoke()` remains fine for any non-streaming JSON call.

---

## 6. Prerequisite refactor — shared Supabase browser client (`src/auth/supabaseBrowser.ts`)

Today the only `@supabase/supabase-js` instance is created privately inside `createSupabaseClient()` and is never exported. The `proxyClient` needs the **same** instance (same auth/session/storage key) to read the JWT; a second `createClient()` would have its own session and produce inconsistent `Authorization` headers. So extract:

```ts
// src/auth/supabaseBrowser.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!,
  { auth: { detectSessionInUrl: true, persistSession: true, autoRefreshToken: true } },
)
```
`supabaseClient.ts` consumes this shared instance; `proxyClient.ts` imports the same one; `mockClient.ts` imports **neither** (preserves the zero-network test path). Guarded so it is only constructed when `VITE_SUPABASE_URL` is present.

---

## 7. Gating + the `plan` trust problem *(security — written explicitly)*

- **Constant:** `FREE_TUTOR_MSGS_PER_DAY = 5` (named, mirrors `FREE_SIM_LIMIT`). `canSendTutorMessage(usage, plan)` returns remaining-or-blocked.
- **Demo mode:** counted in `localStorage` per calendar day; resets at local midnight; anonymous visitors get the full 5/day with no sign-in.
- **Live mode requires sign-in.** The real Edge Function is only reachable by a signed-in user; `/tutor` shows a friendly "sign in to chat with the live tutor" panel when `!isMockTutor && !user`. **Rationale:** issuing `signInAnonymously()` sessions would fire the existing `handle_new_user` trigger (`0001_init.sql`) and create a throwaway `profiles` row — and `conversations`/`messages` rows — for every anonymous visitor, polluting the same tables real users live in. Requiring sign-in gives a stable `user_id` rate-limit key with no pollution. (Demo-mode anon is unaffected; it never touches Supabase.)
- **`plan` is not yet a real trust boundary.** Phase 3's "own profile update" RLS intentionally lets a user set their own `plan` (the no-payment demo switch), and `DashboardPage` exposes it. So "standard/premium = unlimited" is forgeable in live mode: a free user can self-upgrade. This is acknowledged, exactly like Phase 3's security note. Two consequences baked into this spec:
  1. The 5/day **message cap** is re-checked server-side from `tutor_usage`, but since `plan` gates the "unlimited" branch and `plan` is user-writable, the cap is bypassable by self-upgrade **until billing moves `plan` server-side** (documented future work — a Stripe/QPay webhook + a column-restricted/`security definer` policy, same as Phase 3's note).
  2. Therefore the **real** spend protection does **not** depend on `plan`: the plan-independent cost guards in §5 (per-user daily token budget, per-minute rate limit, max input size, pinned model/`max_tokens`, optional global kill-switch) bound cost for every tier. "Unlimited" = no daily *message* cap, never no *spend* cap.

---

## 8. Tutor UX details

- **`/tutor` page:** streamed message list, input box, suggested-prompt chips, regenerate, "new chat", and a conversation history sidebar (from the active store). The route is **not** wrapped in `RequireAuth` (mock-mode anon is allowed); the live-mode sign-in gate is conditional (§7).
- **Context-aware launch:** `AskTutorButton` renders on `SimDetailPage` **even when the sim is locked** (asking the tutor a question is not sim access). It links `/tutor?sim=${id}&topic=${encodeURIComponent(meta.topic[lang])}&grade=${meta.grade}`, sourcing grade + topic from the `SIMULATIONS` catalog `meta` (computed at line 22, available before the lock check) — **not** from `Profile`, which has no `grade`. `TutorPage` reads these via `useSearchParams` into `TutorContext`. The navbar entry opens the general tutor (neutral grade band, no topic). *(Future: an optional `profile.grade` for the general tutor — deliberately out of Phase 4 scope to avoid touching the Phase-3 auth contract.)*
- **Formula rendering (`Markdown.tsx`):** `react-markdown` + `remark-math` + `rehype-katex`, `katex.css` imported once. Render the assistant message **on stream `complete`, not per token** — rendering a half-streamed `$\frac{1` throws, and per-token re-parse is a perf cost on low-end devices and causes lab-HUD layout jump. During streaming show raw text in a reserved-height bubble; swap to rendered markdown/KaTeX at `done`. Pin one math dialect (`$…$` / `$$…$$`) in the system prompt and run a delimiter normalizer (`\(…\)`→`$`, `\[…\]`→`$$`, strip code-fenced math) once at completion, wrapped in try/catch with a raw-text fallback.
- **Trilingual:** all UI chrome in a new `tutor` i18n namespace; replies in the active UI language. **Namespace wiring touches 4 sites:** the 3 imports + the `resources` object + the `ns` array in `src/i18n/index.ts`, **and** `keyparity.test.ts`. To stop the parity test drifting, refactor it to import the `ns` array (or a shared `NS` constant) from `index.ts` instead of its hardcoded `['common','landing','lab','auth']`. `tutor.json` is authored MN-first with identical key trees across `mn/en/zh`. (Note: actual `fallbackLng` is `'en'`, `defaultNS` is `'landing'`.)
- **Demo badge:** a persistent "demo tutor — simulated" pill shown whenever `isMockTutor`, localized via the `tutor` namespace.

### 8.1 System prompt + safety (`systemPrompt.ts`) *(minor audience — written explicitly)*
One canonical **frozen** block (the cached prefix), in plain, specific, **redirect-not-scold** language (aggressive "CRITICAL: YOU MUST refuse" phrasing causes over-refusal of legitimate physics like rockets/radiation/energy):
- **Role:** "You are a physics tutor for students in grades 6–11."
- **Scope:** physics + directly related math/study skills; politely decline and redirect off-topic, don't lecture.
- **Minor safety:** refuse + redirect self-harm/violence/sexual/illicit content even if framed as fictional/educational; never solicit full name/address/school/phone/photos; if PII is volunteered, don't repeat or store it; for signs of distress, a warm non-clinical message pointing to a trusted adult.
- **Pedagogy:** Socratic — hint + guiding question, give the method but let the student take the last step (also anti-cheating).
- **Language:** explicit "Reply ONLY in {MN|EN|ZH}" tied to the active locale (don't rely on auto-detection, which fails under code-switching); give technical terms in the student's language with the English/international term in parentheses on first use. (Mongolian is lower-resource and can be fluently wrong — anchor explanations in language-neutral formulas via KaTeX.)
Grade/topic/language are passed as **structured** fields in the volatile preamble, never concatenated raw user text, to shrink the injection surface. All student input is untrusted; only the top-level system channel carries authority. Surface `stop_reason === 'refusal'` as a friendly tutor-toned UI message.
**Mock parity:** the `mockClient`'s canned answers are on-topic/redirect-only and human-reviewed (especially MN); the demo never echoes arbitrary user text — so "safe by construction" holds for the zero-backend path that all tests and the demo exercise.

---

## 9. Testing

All tests run against the **mock**, no network (the established pattern). `tsc --noEmit` (strict + `noUnusedLocals`/`noUnusedParameters` — prefix intentionally-unused params with `_`, precedent `demoClient` `_password`), `vitest run`, and `tsc --noEmit && vite build` all green; Playwright shot of `/tutor`.

- **`frames.ts`** (the highest-value unit tests): `encodeFrame`/`parseFrames` round-trip; partial frame buffered across chunks; **a multi-byte Cyrillic and a Chinese character split across two byte chunks** decode intact via `TextDecoder({stream:true})`.
- **`gating.ts`:** 5/day free vs unlimited paid; day rollover; blocked state.
- **`mockClient`:** `stream()` yields `token` frames then `done`; topic-aware seeding changes the canned answer; safety canned answers stay on-topic.
- **`systemPrompt.ts`:** frozen block is byte-stable across calls (cache-safe); volatile preamble carries grade/topic/language; language line matches the active locale.
- **`TutorProvider`** (mock): `send` → optimistic user message → streamed assistant → persisted; `stop` aborts; usage increments and blocks at the cap.
- **`TutorPage`:** renders; demo badge present when mock; cap-reached shows upgrade CTA; KaTeX renders a formula at `complete`.
- **`AskTutorButton` deep-link:** appears on a locked sim; seeds grade/topic from `SIMULATIONS`. Because `renderWithProviders` does not mount `<Routes>` and has no `TutorProvider`, build the `I18nextProvider > AuthProvider > TutorProvider > MemoryRouter > Routes > Route` tree inline (follow `gating-ui.test.tsx`), or extend the shared helper with an optional `TutorProvider` + routes wrapper.
- **i18n:** `tutor` covered by the (refactored, import-driven) key-parity test.
- **Persistence:** localStorage `TutorStore` round-trips conversations/messages/usage using only `getItem/setItem/removeItem`.

---

## 10. Success criteria

1. **Slice 1, zero backend:** open `/tutor`, see a streamed trilingual reply from the mock, with the "demo tutor — simulated" badge; ask 5 messages, hit the daily cap + upgrade CTA; launch the context-aware tutor from a sim (incl. a locked one) and see grade/topic seeded; formulas render via KaTeX; history persists across reloads via localStorage and shows on the dashboard.
2. **Slice 2, with creds + the function deployed + the secret set:** the same flows run against the real model, streamed token-by-token through the Edge Function; signed-in users only; the 5/day cap and cost guards are enforced server-side from `tutor_usage`; conversations/messages persist in Supabase under RLS.
3. The API key never appears in the client bundle; `messages` are insertable only by the service role.
4. Trilingual throughout; `tutor` key-parity passes and the parity test is now import-driven.
5. `tsc`, tests, and build all green; `supabase/SETUP.md` documents the Slice-2 go-live steps.
6. The `LLMClient` + Edge Function + persistence pattern is shaped so Phase 4b (exams) reuses it directly.
