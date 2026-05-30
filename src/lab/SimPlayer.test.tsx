import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { SimPlayer } from './SimPlayer'
import type { SimDefinition } from './types'

const mockDef: SimDefinition = {
  id: 'mock',
  params: [{ key: 'x', labelKey: 'param.v0', min: 0, max: 10, step: 1, default: 4, unit: 'm' }],
  readouts: [{ key: 'y', labelKey: 'readout.speed', unit: 'm/s' }],
  Scene: () => null,
}

describe('SimPlayer', () => {
  beforeAll(async () => {
    await i18n.changeLanguage('en')
  })
  it('renders a slider per param and toggles the transport', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SimPlayer def={mockDef} />
      </I18nextProvider>,
    )
    expect(screen.getAllByRole('slider')).toHaveLength(1)
    fireEvent.click(screen.getByRole('button', { name: /pause/i }))
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
  })
})
