import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import { TutorProvider } from './TutorProvider'
import { useTutor } from './useTutor'

function Probe() {
  const { messages, streaming, send, canSend } = useTutor()
  return (
    <div>
      <span data-testid="count">{messages.length}</span>
      <span data-testid="streaming">{String(streaming)}</span>
      <span data-testid="cansend">{String(canSend)}</span>
      <button onClick={() => send('explain projectiles', { lang: 'en', topic: 'Mechanics', grade: 9 })}>go</button>
    </div>
  )
}

const wrap = () =>
  render(
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <TutorProvider>
          <MemoryRouter>
            <Probe />
          </MemoryRouter>
        </TutorProvider>
      </AuthProvider>
    </I18nextProvider>,
  )

beforeEach(() => localStorage.clear())

describe('TutorProvider', () => {
  it('send appends a user message then a streamed assistant message', async () => {
    wrap()
    await waitFor(() => expect(screen.getByTestId('cansend')).toHaveTextContent('true'))
    await act(async () => {
      screen.getByText('go').click()
    })
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('2'), { timeout: 3000 })
    expect(screen.getByTestId('streaming')).toHaveTextContent('false')
  })
})
