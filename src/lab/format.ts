/** Format a number for HUD display: fixed decimals, no "-0", em-dash for non-finite. */
export const fmt = (n: number, decimals = 2): string => {
  if (!Number.isFinite(n)) return '—'
  const r = Number(n.toFixed(decimals))
  const safe = Object.is(r, -0) ? 0 : r
  return safe.toFixed(decimals)
}
