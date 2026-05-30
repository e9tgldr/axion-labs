import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { AskTutorButton } from './AskTutorButton'

describe('AskTutorButton', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('deep-links to the context-aware tutor seeded with sim/topic/grade', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AskTutorButton simId="ohm-circuit" />
        </MemoryRouter>
      </I18nextProvider>,
    )
    const href = screen.getByRole('link').getAttribute('href') ?? ''
    expect(href).toContain('/tutor?sim=ohm-circuit')
    expect(href).toContain('topic=')
    expect(href).toContain('grade=')
  })

  it('renders nothing for an unknown sim id', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <MemoryRouter>
          <AskTutorButton simId="does-not-exist" />
        </MemoryRouter>
      </I18nextProvider>,
    )
    expect(container.querySelector('a')).toBeNull()
  })
})
