import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SimSceneProps } from '@/lab/types'
import { projectile, posAt } from './physics'

const SCALE = 0.18 // world units per metre
const X0 = -4

export default function Scene({ params, playing, resetKey, publish }: SimSceneProps) {
  const ball = useRef<THREE.Mesh>(null)
  const tRef = useRef(0)
  const lastReset = useRef(resetKey)

  useFrame((_, delta) => {
    if (lastReset.current !== resetKey) {
      tRef.current = 0
      lastReset.current = resetKey
    }
    const input = { v0: params.v0, angle: params.angle, g: params.g }
    const { flightTime, range, maxHeight, vx, vy } = projectile(input)
    if (playing && flightTime > 0) {
      tRef.current += Math.min(delta, 0.05)
      if (tRef.current > flightTime) tRef.current = 0
    }
    const p = posAt(input, tRef.current)
    if (ball.current) ball.current.position.set(X0 + p.x * SCALE, p.y * SCALE, 0)
    const vyNow = vy - input.g * tRef.current
    publish({ range, maxHeight, flightTime, speed: Math.hypot(vx, vyNow) })
  })

  return (
    <group>
      <mesh ref={ball}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#fb923c" emissive="#a855f7" emissiveIntensity={0.5} roughness={0.3} />
      </mesh>
      {/* launch pad */}
      <mesh position={[X0, -0.1, 0]}>
        <boxGeometry args={[0.6, 0.2, 0.6]} />
        <meshStandardMaterial color="#27344d" />
      </mesh>
    </group>
  )
}
