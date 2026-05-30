export interface InclineIn {
  angle: number
  mass: number
  mu: number
  g: number
}

export function incline({ angle, mass, mu, g }: InclineIn) {
  const th = (angle * Math.PI) / 180
  const normal = mass * g * Math.cos(th)
  const gravityAlong = mass * g * Math.sin(th)
  const maxStatic = mu * normal
  const moving = gravityAlong > maxStatic
  // Kinetic friction (μN) while sliding; otherwise static friction just balances
  // the down-slope gravity component (mg·sinθ), capped at μN.
  const friction = moving ? maxStatic : Math.min(gravityAlong, maxStatic)
  const accel = moving ? g * (Math.sin(th) - mu * Math.cos(th)) : 0
  return { accel, friction, normal }
}
