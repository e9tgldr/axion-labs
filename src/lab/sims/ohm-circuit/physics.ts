export interface OhmIn {
  V: number
  R1: number
  R2: number
}

export function ohm({ V, R1, R2 }: OhmIn) {
  const resistance = R1 + R2
  const current = resistance > 0 ? V / resistance : 0
  return { resistance, current, power: V * current }
}
