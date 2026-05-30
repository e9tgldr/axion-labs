export interface InclineIn {
  angle: number
  mass: number
  mu: number
  g: number
}

export function incline({ angle, mass, mu, g }: InclineIn) {
  const th = (angle * Math.PI) / 180
  const normal = mass * g * Math.cos(th)
  const accel = Math.max(0, g * (Math.sin(th) - mu * Math.cos(th)))
  const friction = mu * normal
  return { accel, friction, normal }
}
