import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SimSceneProps } from '@/lab/types'
import { wave, yAt } from './physics'

const POINTS = 120
const X_MIN = -6
const X_MAX = 6
const Y_SCALE = 0.8 // world units per metre of displacement

const dummy = new THREE.Object3D()

export default function Scene({ params, playing, resetKey, publish }: SimSceneProps) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const tRef = useRef(0)
  const lastReset = useRef(resetKey)

  // Static per-instance attributes: world x and an orange→violet colour gradient.
  const { worldX, colors } = useMemo(() => {
    const worldX = new Float32Array(POINTS)
    const colors = new Float32Array(POINTS * 3)
    const a = new THREE.Color('#fb923c')
    const b = new THREE.Color('#a855f7')
    const c = new THREE.Color()
    for (let i = 0; i < POINTS; i++) {
      const u = i / (POINTS - 1)
      worldX[i] = X_MIN + u * (X_MAX - X_MIN)
      c.copy(a).lerp(b, u)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { worldX, colors }
  }, [])

  useFrame((_, delta) => {
    if (lastReset.current !== resetKey) {
      tRef.current = 0
      lastReset.current = resetKey
    }
    const input = { A: params.A, f: params.f, lambda: params.lambda }
    const { waveSpeed, period, angFreq } = wave(input)
    if (playing) {
      tRef.current += Math.min(delta, 0.05)
    }
    const m = mesh.current
    if (m) {
      for (let i = 0; i < POINTS; i++) {
        // Map screen x → metres so roughly two wavelengths span the box.
        const xMetres = (i / POINTS) * input.lambda * 2
        const y = yAt(input, xMetres, tRef.current)
        dummy.position.set(worldX[i], y * Y_SCALE, 0)
        dummy.updateMatrix()
        m.setMatrixAt(i, dummy.matrix)
      }
      m.instanceMatrix.needsUpdate = true
    }
    publish({ waveSpeed, period, angFreq })
  })

  return (
    <group>
      <instancedMesh ref={mesh} args={[undefined, undefined, POINTS]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          vertexColors
          emissive="#a855f7"
          emissiveIntensity={0.35}
          roughness={0.3}
        >
          <instancedBufferAttribute attach="attributes-color" args={[colors, 3]} />
        </meshStandardMaterial>
      </instancedMesh>
    </group>
  )
}
