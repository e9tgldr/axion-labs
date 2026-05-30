import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, buildContextPreamble } from './systemPrompt'
import type { TutorContext } from './types'

describe('systemPrompt', () => {
  it('is byte-stable for a given language (cache-safe — no volatile data)', () => {
    expect(buildSystemPrompt('en')).toBe(buildSystemPrompt('en'))
    expect(buildSystemPrompt('en')).not.toContain('undefined')
  })

  it('pins the reply language explicitly per locale', () => {
    expect(buildSystemPrompt('mn')).toMatch(/Mongolian/)
    expect(buildSystemPrompt('zh')).toMatch(/Chinese/)
    expect(buildSystemPrompt('en')).toMatch(/English/)
  })

  it('states the grades 6-11 role and physics scope', () => {
    const p = buildSystemPrompt('en')
    expect(p).toMatch(/grades 6.?11/)
    expect(p.toLowerCase()).toContain('physics')
  })

  it('puts volatile context (grade/topic) in the preamble, not the system prompt', () => {
    const ctx: TutorContext = { lang: 'en', grade: 9, topic: 'Mechanics', simId: 'projectile' }
    const pre = buildContextPreamble(ctx)
    expect(pre).toContain('9')
    expect(pre).toContain('Mechanics')
    expect(buildSystemPrompt('en')).not.toContain('Mechanics')
  })

  it('preamble is empty when no grade/topic is supplied (general tutor)', () => {
    expect(buildContextPreamble({ lang: 'en' })).toBe('')
  })
})
