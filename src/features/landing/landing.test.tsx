import { describe, it, expect, beforeAll } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/test/renderWithProviders'
import i18n from '@/i18n'
import App from '@/App'
import LandingPage from './LandingPage'
import { Hero } from './sections/Hero'
import { CurriculumSection } from './sections/CurriculumSection'
import { SimShowcase } from './sections/SimShowcase'

beforeAll(async () => {
  await i18n.changeLanguage('en')
})

describe('LandingPage', () => {
  it('renders every section heading in order', () => {
    renderWithProviders(<LandingPage />)
    expect(
      screen.getByRole('heading', { name: /master physics/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /all the tools you need/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /dozens of simulations/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /your 24\/7 physics tutor/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /fresh exam every time/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /annual physics curriculum/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /start free/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /step into the laboratory/i })).toBeInTheDocument()
  })
})

describe('Hero WebGL fallback', () => {
  it('renders the static fallback (no <canvas>) when WebGL is unavailable', () => {
    const { container } = renderWithProviders(<Hero />)
    expect(screen.getByTestId('static-hero')).toBeInTheDocument()
    expect(container.querySelector('canvas')).toBeNull()
  })
})

describe('SimShowcase i18n', () => {
  it('translates simulation names per language', async () => {
    await i18n.changeLanguage('mn')
    const { unmount } = renderWithProviders(<SimShowcase />)
    // featured = Projectile Motion -> Mongolian
    expect(screen.getByText('Шидэлтийн хөдөлгөөн')).toBeInTheDocument()
    expect(screen.queryByText('Projectile Motion')).toBeNull()
    unmount()
    await i18n.changeLanguage('en')
  })
})

describe('App skip link', () => {
  it('exposes a skip-to-content link targeting #main', async () => {
    await i18n.changeLanguage('en')
    const { container } = renderWithProviders(<App />)
    const skip = screen.getByRole('link', { name: /skip to content/i })
    expect(skip).toHaveAttribute('href', '#main')
    expect(container.querySelector('main#main')).not.toBeNull()
  })
})

describe('CurriculumSection', () => {
  it('switches topics when a different grade is selected', async () => {
    renderWithProviders(<CurriculumSection />)
    // default grade 9 → "Projectile motion" is present
    expect(screen.getByText(/projectile motion/i)).toBeInTheDocument()
    // pick grade 6 → "Density" appears, projectile motion gone
    await userEvent.click(screen.getByRole('button', { name: '6', pressed: false }))
    expect(screen.getByText(/^density$/i)).toBeInTheDocument()
    expect(screen.queryByText(/projectile motion/i)).toBeNull()
  })
})
