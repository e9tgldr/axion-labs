import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { AuthProvider } from '@/auth/AuthProvider'
import { LabCatalog } from './LabCatalog'

const wrap = (ui: React.ReactElement) => (
  <I18nextProvider i18n={i18n}>
    <AuthProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </AuthProvider>
  </I18nextProvider>
)

describe('LabCatalog', () => {
  beforeAll(async () => {
    localStorage.clear()
    await i18n.changeLanguage('en')
  })

  it('renders catalog cards including a built sim and a coming-soon lock', () => {
    render(wrap(<LabCatalog />))
    expect(screen.getByText('Projectile Motion')).toBeInTheDocument()
    expect(screen.getAllByText(/coming soon/i).length).toBeGreaterThan(0)
  })

  it('built sims are links; filtering by grade narrows the set', async () => {
    render(wrap(<LabCatalog />))
    // Projectile is grade 9 -> selecting grade 11 hides it
    await userEvent.click(screen.getByRole('button', { name: '11' }))
    expect(screen.queryByText('Projectile Motion')).toBeNull()
  })
})
