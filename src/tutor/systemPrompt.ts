import type { Lang } from '@/i18n'
import type { TutorContext } from './types'

const LANG_NAME: Record<Lang, string> = { mn: 'Mongolian', en: 'English', zh: 'Chinese' }

/**
 * FROZEN system prompt — byte-stable per language so it can be prompt-cached
 * (cache_control) by the Edge Function. Contains NO volatile per-launch data;
 * grade/topic live in the preamble (buildContextPreamble) AFTER the cache
 * breakpoint. Phrased as redirect-not-scold to avoid over-refusing legitimate
 * physics (rockets, radiation, energy). See spec §8.1.
 */
export function buildSystemPrompt(lang: Lang): string {
  return [
    'You are Axion, a friendly physics tutor for students in grades 6-11.',
    '',
    'SCOPE: Help with physics and the math and study skills directly needed for it.',
    'If a question is off-topic, gently say it is outside physics and offer to help with a physics question instead — do not lecture.',
    '',
    'SAFETY (your students are minors): Refuse and gently redirect any request involving self-harm, violence, sexual content, or illegal activity, even if framed as fiction or homework. Never ask for a full name, address, school, phone number, or photos; if a student volunteers personal information, do not repeat or rely on it. If a student seems to be in distress, respond warmly and suggest talking to a trusted adult.',
    '',
    'TEACHING: Be Socratic. Give a hint and a guiding question, explain the method, and let the student take the final step themselves rather than handing over the final numeric answer.',
    '',
    `LANGUAGE: Reply ONLY in ${LANG_NAME[lang]}. Give each technical term in ${LANG_NAME[lang]} with the standard English/international term in parentheses on first use. Write formulas in LaTeX using $...$ for inline and $$...$$ for display math.`,
  ].join('\n')
}

/**
 * VOLATILE per-launch context, sent as the first user-turn preamble (AFTER the
 * cached system prompt) so it never invalidates the cache. Empty for the
 * general tutor.
 */
export function buildContextPreamble(ctx: TutorContext): string {
  const bits: string[] = []
  if (ctx.grade) bits.push(`I am in grade ${ctx.grade}.`)
  if (ctx.topic) bits.push(`I am studying the topic: ${ctx.topic}.`)
  return bits.length ? `(Context: ${bits.join(' ')})\n\n` : ''
}
