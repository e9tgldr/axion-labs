import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import i18n from '@/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import { SimDetailPage } from '@/lab/SimDetailPage'

const renderAt = (id: string) =>
  render(
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <MemoryRouter initialEntries={[`/lab/${id}`]}>
          <Routes>
            <Route path="/lab/:id" element={<SimDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </I18nextProvider>,
  )

const seedProfile = (plan: string) => {
  localStorage.setItem('axion.demo.user', JSON.stringify({ id: 'demo-x', email: 'x@y.z' }))
  localStorage.setItem(
    'axion.demo.profile',
    JSON.stringify({ id: 'demo-x', displayName: 'X', avatarUrl: null, locale: 'en', plan, trialEndsAt: null }),
  )
}

beforeEach(() => localStorage.clear())

describe('lab gating', () => {
  it('free/anon hits the upgrade wall on a paid sim (ohm-circuit)', async () => {
    await i18n.changeLanguage('en')
    renderAt('ohm-circuit')
    await waitFor(() => expect(screen.getByText(/needs a paid plan/i)).toBeInTheDocument())
  })

  it('a free sim (projectile) never shows the upgrade wall', async () => {
    await i18n.changeLanguage('en')
    renderAt('projectile')
    await waitFor(() => expect(screen.getByText(/launch a projectile/i)).toBeInTheDocument())
    expect(screen.queryByText(/needs a paid plan/i)).toBeNull()
  })

  it('premium opens the paid sim (no wall)', async () => {
    seedProfile('premium')
    await i18n.changeLanguage('en')
    renderAt('ohm-circuit')
    await waitFor(() => expect(screen.queryByText(/needs a paid plan/i)).toBeNull())
  })
})
