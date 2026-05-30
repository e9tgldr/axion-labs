export interface DPParams { L1: number; L2: number; m1: number; m2: number; g: number }
export interface DPState { th1: number; th2: number; w1: number; w2: number }
function deriv(s: DPState, p: DPParams): DPState {
  const { L1, L2, m1, m2, g } = p, { th1, th2, w1, w2 } = s
  const d = th1 - th2, den = 2 * m1 + m2 - m2 * Math.cos(2 * d)
  const a1 = (-g * (2 * m1 + m2) * Math.sin(th1) - m2 * g * Math.sin(th1 - 2 * th2) - 2 * Math.sin(d) * m2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d))) / (L1 * den)
  const a2 = (2 * Math.sin(d) * (w1 * w1 * L1 * (m1 + m2) + g * (m1 + m2) * Math.cos(th1) + w2 * w2 * L2 * m2 * Math.cos(d))) / (L2 * den)
  return { th1: w1, th2: w2, w1: a1, w2: a2 }
}
const add = (s: DPState, k: DPState, h: number): DPState => ({ th1: s.th1 + k.th1 * h, th2: s.th2 + k.th2 * h, w1: s.w1 + k.w1 * h, w2: s.w2 + k.w2 * h })
export function rk4Step(s: DPState, p: DPParams, h: number): DPState {
  const k1 = deriv(s, p), k2 = deriv(add(s, k1, h / 2), p), k3 = deriv(add(s, k2, h / 2), p), k4 = deriv(add(s, k3, h), p)
  return {
    th1: s.th1 + (h / 6) * (k1.th1 + 2 * k2.th1 + 2 * k3.th1 + k4.th1),
    th2: s.th2 + (h / 6) * (k1.th2 + 2 * k2.th2 + 2 * k3.th2 + k4.th2),
    w1: s.w1 + (h / 6) * (k1.w1 + 2 * k2.w1 + 2 * k3.w1 + k4.w1),
    w2: s.w2 + (h / 6) * (k1.w2 + 2 * k2.w2 + 2 * k3.w2 + k4.w2),
  }
}
export function energy(s: DPState, p: DPParams): number {
  const { L1, L2, m1, m2, g } = p
  const y1 = -L1 * Math.cos(s.th1), y2 = y1 - L2 * Math.cos(s.th2)
  const v1sq = (L1 * s.w1) ** 2
  const v2sq = (L1 * s.w1) ** 2 + (L2 * s.w2) ** 2 + 2 * L1 * L2 * s.w1 * s.w2 * Math.cos(s.th1 - s.th2)
  return 0.5 * m1 * v1sq + 0.5 * m2 * v2sq + m1 * g * y1 + m2 * g * y2
}
