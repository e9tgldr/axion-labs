import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import i18n from '@/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import { RequireAuth } from '@/auth/RequireAuth'
import { LoginPage } from '@/routes/LoginPage'

const wrap = (initial: string) =>
  render(
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <MemoryRouter initialEntries={[initial]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/dashboard" element={<RequireAuth><div>DASH</div></RequireAuth>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </I18nextProvider>,
  )

beforeEach(() => localStorage.clear())

describe('auth UI', () => {
  it('LoginPage shows the Google button and email/password fields', async () => {
    await i18n.changeLanguage('en')
    wrap('/login')
    expect(await screen.findByRole('button', { name: /continue with google/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('RequireAuth redirects anonymous users to /login', async () => {
    await i18n.changeLanguage('en')
    wrap('/dashboard')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /continue with google/i })).toBeInTheDocument(),
    )
    expect(screen.queryByText('DASH')).toBeNull()
  })
})
