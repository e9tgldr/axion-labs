import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import i18n from '@/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import { TutorProvider } from '@/tutor/TutorProvider'
import { TutorPage } from '@/tutor/TutorPage'

const renderAt = (entry: string) =>
  render(
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <TutorProvider>
          <MemoryRouter initialEntries={[entry]}>
            <Routes>
              <Route path="/tutor" element={<TutorPage />} />
            </Routes>
          </MemoryRouter>
        </TutorProvider>
      </AuthProvider>
    </I18nextProvider>,
  )

beforeEach(() => localStorage.clear())

describe('TutorPage', () => {
  it('renders the composer and the demo badge in mock mode', async () => {
    await i18n.changeLanguage('en')
    renderAt('/tutor')
    expect(await screen.findByPlaceholderText(/ask/i)).toBeInTheDocument()
    expect(screen.getByText(/demo tutor/i)).toBeInTheDocument()
  })

  it('reads sim/topic/grade from the query string', async () => {
    await i18n.changeLanguage('en')
    renderAt('/tutor?sim=projectile&topic=Mechanics&grade=9')
    await waitFor(() => expect(screen.getByPlaceholderText(/ask/i)).toBeInTheDocument())
  })
})
