import { useId } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useTranslation } from 'react-i18next'
import { isWebGLAvailable } from '@/three/webgl'
import { useCanvasActive } from '@/three/useCanvasActive'
import type { SimDefinition, SimSceneProps } from './types'

export function SimCanvas({ def, scene }: { def: SimDefinition; scene: SimSceneProps }) {
  const { t } = useTranslation('lab')
  const { ref, active } = useCanvasActive()
  const hintId = useId()

  if (!isWebGLAvailable()) {
    return (
      <div className="grid h-full min-h-[420px] place-items-center rounded-2xl border border-line bg-surface/50 p-8 text-center font-mono text-sm text-muted">
        {t('webglRequired')}
      </div>
    )
  }

  const Scene = def.Scene
  return (
    <div
      ref={ref}
      role="img"
      aria-label={t('canvasLabel')}
      aria-describedby={hintId}
      className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-line bg-bg"
    >
      <Canvas
        camera={{ position: def.camera?.position ?? [6, 4, 8], fov: def.camera?.fov ?? 45 }}
        dpr={[1, 1.8]}
        frameloop={active ? 'always' : 'never'}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 8, 6]} intensity={1.1} />
        <Grid
          args={[40, 40]}
          cellColor="#1E2A3F"
          sectionColor="#27344d"
          fadeDistance={34}
          infiniteGrid
          position={[0, -0.001, 0]}
        />
        <Scene {...scene} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={22} />
      </Canvas>
      <span
        id={hintId}
        className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-muted"
      >
        {t('dragHint')}
      </span>
    </div>
  )
}
