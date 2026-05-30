import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Slider } from './Slider'

describe('Slider', () => {
  it('renders label and value with unit', () => {
    render(<Slider label="Speed" value={5} min={0} max={10} step={1} unit="m/s" onChange={() => {}} />)
    expect(screen.getByText('Speed')).toBeInTheDocument()
    expect(screen.getByText('5 m/s')).toBeInTheDocument()
  })
  it('emits parsed numeric changes', () => {
    let v = 5
    render(<Slider label="Speed" value={v} min={0} max={10} step={1} onChange={(n) => (v = n)} />)
    fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } })
    expect(v).toBe(8)
  })
})
