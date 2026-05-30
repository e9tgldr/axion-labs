import { useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { cn } from '@/lib/cn'
import { resolveLang } from '@/i18n'
import { useAuth } from '@/auth/useAuth'
import { GRADES, type Grade } from '@/data/curriculum'
import { useTutor } from './useTutor'
import { Markdown } from './Markdown'
import type { TutorContext } from './types'

export function TutorPage() {
  const { t, i18n } = useTranslation('tutor')
  const lang = resolveLang(i18n.language)
  const { user } = useAuth()

  const [params] = useSearchParams()
  const g = Number(params.get('grade'))
  const grade = (GRADES as readonly number[]).includes(g) ? (g as Grade) : undefined
  const ctx: TutorContext = {
    lang,
    simId: params.get('sim') ?? undefined,
    topic: params.get('topic') ?? undefined,
    grade,
  }

  const {
    messages,
    streaming,
    streamingText,
    canSend,
    isMock,
    error,
    send,
    stop,
    conversations,
    activeId,
    selectConversation,
    newConversation,
  } = useTutor()

  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const submit = () => {
    const text = input.trim()
    if (!text || streaming || !canSend) return
    setInput('')
    void send(text, ctx)
  }

  const suggestions = [t('suggested1'), t('suggested2'), t('suggested3')]
  const isEmpty = messages.length === 0 && !streaming

  return (
    <Container className="py-12">
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        {/* History sidebar */}
        <aside className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-mono text-xs uppercase tracking-widest text-muted">{t('history')}</h2>
            <button
              type="button"
              onClick={newConversation}
              className="font-mono text-[10px] uppercase tracking-widest text-violet hover:text-text"
            >
              + {t('newChat')}
            </button>
          </div>
          {conversations.length === 0 ? (
            <p className="text-sm text-muted">{t('noHistory')}</p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => selectConversation(c.id)}
                    aria-current={c.id === activeId}
                    className={cn(
                      'w-full truncate rounded-xl border px-3 py-2 text-left text-sm transition-colors',
                      c.id === activeId
                        ? 'border-violet/60 bg-surface/70 text-text'
                        : 'border-line bg-surface/40 text-muted hover:text-text',
                    )}
                  >
                    {c.title || t('tutor')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Chat column */}
        <section className="flex min-w-0 flex-col gap-5">
          {/* Header */}
          <header className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{t('title')}</h1>
              {isMock && <Pill className="border-violet/40 text-violet">{t('demoBadge')}</Pill>}
            </div>
            <p className="max-w-2xl text-muted">{t('subtitle')}</p>
            {(ctx.topic || ctx.grade) && (
              <div className="flex flex-wrap items-center gap-2">
                {ctx.topic && <Pill>{ctx.topic}</Pill>}
                {ctx.grade && <Pill>{`G${ctx.grade}`}</Pill>}
              </div>
            )}
          </header>

          {/* Message list + streaming bubble */}
          <div
            aria-live="polite"
            aria-atomic="false"
            className="flex min-h-[40vh] flex-col gap-4 rounded-2xl border border-line bg-surface/30 p-5 backdrop-blur-sm"
          >
            {isEmpty && (
              <p className="m-auto max-w-sm text-center text-sm text-muted">{t('safetyNote')}</p>
            )}

            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex flex-col items-end">
                  <span className="mb-1 mr-1 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {t('you')}
                  </span>
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-axion px-4 py-2.5 text-sm text-bg">
                    {m.content}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-line bg-surface/60 px-4 py-3">
                    <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-violet">
                      {t('tutor')}
                    </span>
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
              ),
            )}

            {/* Streaming bubble — RAW text only until complete (no Markdown/KaTeX) */}
            {streaming && (
              <div className="flex justify-start">
                <div className="min-h-[3rem] max-w-[90%] rounded-2xl rounded-bl-sm border border-line bg-surface/60 px-4 py-3">
                  <span className="mb-1 block font-mono text-[10px] uppercase tracking-widest text-violet">
                    {t('tutor')}
                  </span>
                  {streamingText ? (
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-text">
                      {streamingText}
                      <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-violet align-middle" />
                    </p>
                  ) : (
                    <p className="font-mono text-sm text-muted">{t('thinking')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Error region — keeps any partial streamed text visible above */}
            {error && (
              <div className="flex justify-start">
                <Pill className="border-orange/50 text-orange">⚠ {t(error)}</Pill>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Composer or cap panel */}
          {canSend ? (
            <div className="flex flex-col gap-3">
              {/* Suggested-prompt chips */}
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setInput(s)}
                    className="rounded-full border border-line bg-surface/40 px-3 py-1 text-xs text-muted transition-colors hover:border-violet hover:text-text"
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-3">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      submit()
                    }
                  }}
                  rows={2}
                  placeholder={t('inputPlaceholder')}
                  aria-label={t('inputPlaceholder')}
                  className="min-h-[3rem] flex-1 resize-none rounded-xl border border-line bg-surface/60 px-4 py-3 text-sm text-text outline-none transition-colors placeholder:text-muted focus:border-violet"
                />
                {streaming ? (
                  <Button variant="outline" onClick={stop}>
                    {t('stop')}
                  </Button>
                ) : (
                  <Button onClick={submit} disabled={!input.trim()}>
                    {t('send')}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <GlassPanel glow="violet" className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="text-3xl">⚡</span>
              <h2 className="font-display text-2xl font-bold">{t('dailyLimitTitle')}</h2>
              <p className="max-w-md text-muted">{t('dailyLimitBody')}</p>
              <Button to={user ? '/dashboard' : '/login'}>{t('upgradeCta')}</Button>
            </GlassPanel>
          )}
        </section>
      </div>
    </Container>
  )
}
