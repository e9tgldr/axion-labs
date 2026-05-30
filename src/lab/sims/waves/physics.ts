export interface WaveIn {
  A: number
  f: number
  lambda: number
}

export function wave({ A, f, lambda }: WaveIn) {
  const waveSpeed = f * lambda
  const period = f > 0 ? 1 / f : 0
  const angFreq = 2 * Math.PI * f
  const k = lambda > 0 ? (2 * Math.PI) / lambda : 0
  return { waveSpeed, period, angFreq, k, A }
}

/** Transverse displacement of a travelling wave at position x (m) and time t (s). */
export const yAt = (i: WaveIn, x: number, t: number) => {
  const { angFreq, k } = wave(i)
  return i.A * Math.sin(k * x - angFreq * t)
}
