import { useEffect, useRef, useState } from 'react'

/**
 * Drives a 3D canvas' frameloop: active only while its wrapper is on-screen AND
 * the tab is visible. Lets callers pause rendering (frameloop="never") off-screen
 * to avoid wasting GPU/battery on an animation nobody can see.
 */
export function useCanvasActive<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(true)
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState !== 'hidden',
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '120px' },
    )
    io.observe(el)

    const onVisibility = () => setTabVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return { ref, active: inView && tabVisible }
}
