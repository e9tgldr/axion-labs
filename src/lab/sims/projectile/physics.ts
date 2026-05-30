export interface ProjectileIn {
  v0: number
  angle: number
  g: number
}

export function projectile({ v0, angle, g }: ProjectileIn) {
  const th = (angle * Math.PI) / 180
  const vx = v0 * Math.cos(th)
  const vy = v0 * Math.sin(th)
  const flightTime = g > 0 ? (2 * vy) / g : 0
  const range = vx * flightTime
  const maxHeight = g > 0 ? (vy * vy) / (2 * g) : 0
  return { vx, vy, flightTime, range, maxHeight }
}

/** Position at time t (parabolic trajectory from the origin). */
export function posAt(input: ProjectileIn, t: number) {
  const { vx, vy } = projectile(input)
  return { x: vx * t, y: vy * t - 0.5 * input.g * t * t }
}
