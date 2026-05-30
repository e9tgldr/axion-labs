import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Button } from './Button'

describe('Button', () => {
  it('renders a <button> with the gradient variant by default', () => {
    render(<Button>Go</Button>)
    const btn = screen.getByRole('button', { name: 'Go' })
    expect(btn).toHaveClass('bg-axion')
  })

  it('renders a router link when `to` is provided', () => {
    render(
      <MemoryRouter>
        <Button to="/login">Enter</Button>
      </MemoryRouter>,
    )
    const link = screen.getByRole('link', { name: 'Enter' })
    expect(link).toHaveAttribute('href', '/login')
  })

  it('renders an anchor when `href` is provided', () => {
    render(<Button href="https://example.com">Out</Button>)
    expect(screen.getByRole('link', { name: 'Out' })).toHaveAttribute(
      'href',
      'https://example.com',
    )
  })
})
