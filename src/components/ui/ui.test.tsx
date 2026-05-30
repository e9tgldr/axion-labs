import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Container } from './Container'
import { GradientText } from './GradientText'
import { Pill } from './Pill'
import { Readout } from './Readout'
import { SectionHeading } from './SectionHeading'
import { GlassPanel } from './GlassPanel'
import { Logo } from './Logo'

describe('ui primitives', () => {
  it('Container renders children', () => {
    render(<Container>hello</Container>)
    expect(screen.getByText('hello')).toBeInTheDocument()
  })

  it('GradientText applies the gradient class', () => {
    render(<GradientText>grad</GradientText>)
    expect(screen.getByText('grad')).toHaveClass('text-gradient')
  })

  it('Pill renders its label', () => {
    render(<Pill>tag</Pill>)
    expect(screen.getByText('tag')).toBeInTheDocument()
  })

  it('Readout shows label, value and unit', () => {
    render(<Readout label="VELOCITY" value="9.8" unit="m/s" />)
    expect(screen.getByText('VELOCITY')).toBeInTheDocument()
    expect(screen.getByText('9.8')).toBeInTheDocument()
    expect(screen.getByText('m/s')).toBeInTheDocument()
  })

  it('SectionHeading renders title and subtitle', () => {
    render(<SectionHeading title="Title here" subtitle="Sub here" eyebrow="EB" />)
    expect(screen.getByRole('heading', { name: 'Title here' })).toBeInTheDocument()
    expect(screen.getByText('Sub here')).toBeInTheDocument()
    expect(screen.getByText('EB')).toBeInTheDocument()
  })

  it('GlassPanel renders children and applies glow', () => {
    render(
      <GlassPanel glow="violet">
        <span>panel</span>
      </GlassPanel>,
    )
    const el = screen.getByText('panel').parentElement
    expect(el).toHaveClass('shadow-glow-violet')
  })

  it('Logo renders an accessible svg, and a wordmark when requested', () => {
    const { rerender } = render(<Logo />)
    expect(screen.getByRole('img', { name: 'Axion Labs' })).toBeInTheDocument()
    rerender(<Logo withWordmark />)
    expect(screen.getByText('Axion')).toBeInTheDocument()
  })
})
