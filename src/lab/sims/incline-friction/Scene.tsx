import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SimSceneProps } from '@/lab/types'
import { incline } from './physics'

const RAMP_LEN = 8 // world length of the slope (hypotenuse)
const BLOCK = 0.7 // block edge size

export default function Scene({ params, playing, resetKey, publish }: SimSceneProps) {
  const block = useRef<THREE.Mesh>(null)
  const ramp = useRef<THREE.Mesh>(null)
  const tRef = useRef(0)
  const lastReset = useRef(resetKey)

  useFrame((_, delta) => {
    if (lastReset.current !== resetKey) {
      tRef.current = 0
      lastReset.current = resetKey
    }
    const input = { angle: params.angle, mass: params.mass, mu: params.mu, g: params.g }
    const { accel, friction, normal } = incline(input)
    const th = (params.angle * Math.PI) / 180

    if (playing && accel > 0) {
      tRef.current += Math.min(delta, 0.05)
    }

    // Distance travelled down the slope: s = 0.5 * accel * t^2, looping at the bottom.
    let s = 0.5 * accel * tRef.current * tRef.current
    if (s > RAMP_LEN) {
      tRef.current = 0
      s = 0
    }

    // Top of the slope sits up-left; slope descends to the bottom-right at the grid.
    const dir = new THREE.Vector3(Math.cos(th), -Math.sin(th), 0)
    const topX = -RAMP_LEN * Math.cos(th)
    const topY = RAMP_LEN * Math.sin(th)
    // Offset the block half its size off the slope surface (normal direction).
    const nrm = new THREE.Vector3(Math.sin(th), Math.cos(th), 0)
    const half = BLOCK / 2

    if (block.current) {
      block.current.position.set(
        topX + dir.x * s + nrm.x * half,
        topY + dir.y * s + nrm.y * half,
        0,
      )
      block.current.rotation.z = -th
    }
    if (ramp.current) ramp.current.rotation.z = th

    publish({ accel, friction, normal, speed: accel * tRef.current })
  })

  return (
    <group position={[2, 0, 0]}>
      {/* incline wedge: a thin box rotated so its top face is the slope */}
      <mesh ref={ramp} position={[-RAMP_LEN / 2, 0, 0]}>
        <boxGeometry args={[RAMP_LEN, 0.3, 3]} />
        <meshStandardMaterial color="#27344d" roughness={0.6} />
      </mesh>
      {/* sliding block */}
      <mesh ref={block}>
        <boxGeometry args={[BLOCK, BLOCK, BLOCK]} />
        <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.45} roughness={0.35} />
      </mesh>
    </group>
  )
}
