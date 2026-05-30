import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Markdown } from './Markdown'

describe('Markdown', () => {
  it('renders inline math without throwing', () => {
    const { container } = render(<Markdown>{'Energy is $E = mc^2$ today.'}</Markdown>)
    expect(container.querySelector('.katex')).not.toBeNull()
  })

  it('normalizes \\( \\) delimiters', () => {
    const { container } = render(<Markdown>{'Speed \\(v = d/t\\) here.'}</Markdown>)
    expect(container.querySelector('.katex')).not.toBeNull()
  })

  it('renders a malformed formula without throwing (raw-text fallback)', () => {
    const { container } = render(<Markdown>{'Broken $\\frac{1 here'}</Markdown>)
    expect(container.textContent).toContain('Broken')
  })
})
