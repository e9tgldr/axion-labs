import { useEffect, useRef, useState } from 'react'

export interface ReadoutStore {
  publish: (values: Record<string, number>) => void
  current: () => Record<string, number>
}

/** Holds the latest readouts in a closure (publish is render-free, safe at 60fps). */
export function createReadoutStore(): ReadoutStore {
  let values: Record<string, number> = {}
  return {
    publish: (v) => {
      values = v
    },
    current: () => values,
  }
}

/** Mirror the store into React state at ~`hz`, decoupling render rate from physics rate. */
export function useThrottledReadouts(store: ReadoutStore, hz = 10) {
  const [snapshot, setSnapshot] = useState<Record<string, number>>({})
  const last = useRef(0)
  useEffect(() => {
    let raf = 0
    const interval = 1000 / hz
    const tick = (t: number) => {
      if (t - last.current >= interval) {
        last.current = t
        setSnapshot(store.current())
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [store, hz])
  return snapshot
}
