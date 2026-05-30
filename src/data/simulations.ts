export type Accent = 'orange' | 'pink' | 'violet' | 'amber'

export interface Simulation {
  id: string
  name: string
  topic: string
  grade: number
  accent: Accent
  /** short formula shown as a mono tag */
  formula: string
}

/** Catalog metadata for the landing showcase. Real physics arrives in Phase 2. */
export const SIMULATIONS: Simulation[] = [
  { id: 'projectile', name: 'Projectile Motion', topic: 'Mechanics', grade: 9, accent: 'orange', formula: 'R = v₀²·sin2θ / g' },
  { id: 'double-pendulum', name: 'Double Pendulum', topic: 'Chaos', grade: 11, accent: 'violet', formula: 'θ₁, θ₂ → chaos' },
  { id: 'incline-friction', name: 'Incline & Friction', topic: 'Mechanics', grade: 9, accent: 'amber', formula: 'a = g(sinθ − μcosθ)' },
  { id: 'ohm-circuit', name: 'Ohm’s Law Circuit', topic: 'Electricity', grade: 8, accent: 'pink', formula: 'V = I·R' },
  { id: 'ampere-force', name: 'Ampère Force', topic: 'Magnetism', grade: 11, accent: 'violet', formula: 'F = B·I·L' },
  { id: 'lens-optics', name: 'Lens Optics', topic: 'Optics', grade: 10, accent: 'orange', formula: '1/f = 1/d + 1/d′' },
  { id: 'waves', name: 'Wave Motion', topic: 'Waves', grade: 10, accent: 'pink', formula: 'v = f·λ' },
  { id: 'momentum', name: 'Collisions', topic: 'Mechanics', grade: 10, accent: 'amber', formula: 'Σp = const' },
  { id: 'centripetal', name: 'Centripetal Force', topic: 'Mechanics', grade: 10, accent: 'orange', formula: 'F = m·ω²·r' },
  { id: 'capacitor', name: 'Capacitor Charging', topic: 'Electricity', grade: 11, accent: 'violet', formula: 'τ = R·C' },
  { id: 'buoyancy', name: 'Archimedes’ Force', topic: 'Fluids', grade: 7, accent: 'pink', formula: 'Fб = ρ·g·V' },
  { id: 'doppler', name: 'Doppler Effect', topic: 'Waves', grade: 11, accent: 'amber', formula: 'f′ = f·(v±vₒ)/(v∓vₛ)' },
]
