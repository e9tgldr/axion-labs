import type { Plan } from '@/auth/types'

export interface UsageToday {
  date: string // YYYY-MM-DD (UTC)
  count: number
}

/** Free/anonymous students get this many tutor messages per calendar day. */
export const FREE_TUTOR_MSGS_PER_DAY = 5

/** UTC day key. `now` is injected so logic stays deterministic in tests. */
export function dayStr(now: Date): string {
  return now.toISOString().slice(0, 10)
}

const countToday = (usage: UsageToday | null, now: Date): number =>
  usage && usage.date === dayStr(now) ? usage.count : 0

/**
 * Client-side UX gate. Paid plans (standard/premium/admin) are unlimited by
 * message count; free/anonymous (null) are capped per day. NOTE: this is
 * optimistic UX only — Slice 2's Edge Function re-checks server-side, and
 * `plan` is not yet a real trust boundary (see spec §7).
 */
export function canSendTutorMessage(usage: UsageToday | null, plan: Plan | null, now: Date): boolean {
  if (plan && plan !== 'free') return true
  return countToday(usage, now) < FREE_TUTOR_MSGS_PER_DAY
}

/** Returns the next usage record, resetting the counter on a new day. */
export function bumpUsage(usage: UsageToday | null, now: Date): UsageToday {
  return { date: dayStr(now), count: countToday(usage, now) + 1 }
}
