export const TUTOR_MODEL = Deno.env.get('TUTOR_MODEL') ?? 'claude-haiku-4-5'
export const MAX_TOKENS = 4096
export const MAX_INPUT_CHARS = 4000 // per user message
export const MAX_HISTORY_MESSAGES = 20
export const FREE_TUTOR_MSGS_PER_DAY = 5
export const RATE_LIMIT_PER_MIN = Number(Deno.env.get('RATE_LIMIT_PER_MIN') ?? '10')
