import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SimSceneProps } from '@/lab/types'
import { ohm } from './physics'

const HALF_W = 3.2 // half-width of the loop (x)
const HALF_H = 2.0 // half-height of the loop (y)
const DOT_COUNT = 16

// Corners of the rectangular loop, clockwise starting at top-left.
const TL = new THREE.Vector2(-HALF_W, HALF_H)
const TR = new THREE.Vector2(HALF_W, HALF_H)
const BR = new THREE.Vector2(HALF_W, -HALF_H)
const BL = new THREE.Vector2(-HALF_W, -HALF_H)

// Clockwise edges: top (L→R), right (T→B), bottom (R→L), left (B→T).
const EDGES: [THREE.Vector2, THREE.Vector2][] = [
  [TL, TR],
  [TR, BR],
  [BR, BL],
  [BL, TL],
]
const EDGE_LENGTHS = EDGES.map(([a, b]) => a.distanceTo(b))
const PERIMETER = EDGE_LENGTHS.reduce((s, l) => s + l, 0)

// Shared scratch — pointOnLoop is called for every dot each frame and its result
// is consumed immediately, so reusing one Vector2 avoids per-frame allocations.
const _p = new THREE.Vector2()

/** Map a phase in [0,1) to a point on the loop perimeter (clockwise). */
function pointOnLoop(phase: number): THREE.Vector2 {
  let target = ((phase % 1) + 1) % 1 * PERIMETER
  for (let i = 0; i < EDGES.length; i++) {
    const len = EDGE_LENGTHS[i]
    if (target <= len) {
      const [a, b] = EDGES[i]
      const t = len > 0 ? target / len : 0
      return _p.lerpVectors(a, b, t)
    }
    target -= len
  }
  return _p.copy(TL)
}

export default function Scene({ params, playing, resetKey, publish }: SimSceneProps) {
  const dots = useRef<THREE.Mesh[]>([])
  const phaseRef = useRef(0)
  const lastReset = useRef(resetKey)

  useFrame((_, delta) => {
    if (lastReset.current !== resetKey) {
      phaseRef.current = 0
      lastReset.current = resetKey
    }
    const { current, resistance, power } = ohm({ V: params.V, R1: params.R1, R2: params.R2 })
    if (playing) {
      phaseRef.current += current * Math.min(delta, 0.05) * 0.15
    }
    for (let i = 0; i < DOT_COUNT; i++) {
      const dot = dots.current[i]
      if (!dot) continue
      const phase = phaseRef.current + i / DOT_COUNT
      const p = pointOnLoop(phase)
      dot.position.set(p.x, p.y, 0)
    }
    publish({ current, resistance, power })
  })

  return (
    <group>
      {/* wire loop: four thin cylinders along the edges */}
      {EDGES.map(([a, b], i) => {
        const mid = new THREE.Vector2().addVectors(a, b).multiplyScalar(0.5)
        const len = EDGE_LENGTHS[i]
        const horizontal = Math.abs(b.x - a.x) > Math.abs(b.y - a.y)
        return (
          <mesh
            key={i}
            position={[mid.x, mid.y, 0]}
            rotation={[0, 0, horizontal ? Math.PI / 2 : 0]}
          >
            <cylinderGeometry args={[0.05, 0.05, len, 16]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.6} />
          </mesh>
        )
      })}

      {/* battery block on the bottom edge */}
      <mesh position={[0, -HALF_H, 0]}>
        <boxGeometry args={[1.0, 0.5, 0.4]} />
        <meshStandardMaterial color="#22c55e" emissive="#166534" emissiveIntensity={0.3} roughness={0.4} />
      </mesh>

      {/* resistor blocks on the top edge */}
      <mesh position={[-1.4, HALF_H, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.4]} />
        <meshStandardMaterial color="#f97316" emissive="#7c2d12" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[1.4, HALF_H, 0]}>
        <boxGeometry args={[0.8, 0.4, 0.4]} />
        <meshStandardMaterial color="#a855f7" emissive="#581c87" emissiveIntensity={0.3} roughness={0.5} />
      </mesh>

      {/* current carriers traveling clockwise around the loop */}
      {Array.from({ length: DOT_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) dots.current[i] = el
          }}
        >
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.2} roughness={0.3} />
        </mesh>
      ))}
    </group>
  )
}
