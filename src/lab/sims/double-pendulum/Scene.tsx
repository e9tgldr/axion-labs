import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SimSceneProps } from '@/lab/types'
import { rk4Step, energy, type DPState, type DPParams } from './physics'

const SCALE = 1.6 // world units per metre
const PIVOT = new THREE.Vector3(0, 2.5, 0)
const TRAIL_CAP = 200
const UP = new THREE.Vector3(0, 1, 0)
// Reusable scratch vectors so the per-frame loop allocates nothing (except the
// one trail point that must persist).
const _b1 = new THREE.Vector3()
const _b2 = new THREE.Vector3()
const _mid = new THREE.Vector3()
const _dir = new THREE.Vector3()

export default function Scene({ params, playing, resetKey, publish }: SimSceneProps) {
  const rod1 = useRef<THREE.Mesh>(null)
  const rod2 = useRef<THREE.Mesh>(null)
  const bob1 = useRef<THREE.Mesh>(null)
  const bob2 = useRef<THREE.Mesh>(null)
  const trailGeo = useRef<THREE.BufferGeometry>(null)
  const trailPts = useRef<THREE.Vector3[]>([])
  const state = useRef<DPState>({
    th1: (params.theta1 * Math.PI) / 180,
    th2: (params.theta2 * Math.PI) / 180,
    w1: 0,
    w2: 0,
  })
  const lastReset = useRef(resetKey)

  useFrame((_, delta) => {
    if (lastReset.current !== resetKey) {
      state.current = {
        th1: (params.theta1 * Math.PI) / 180,
        th2: (params.theta2 * Math.PI) / 180,
        w1: 0,
        w2: 0,
      }
      trailPts.current = []
      lastReset.current = resetKey
    }

    const p: DPParams = { L1: params.L1, L2: params.L2, m1: params.m1, m2: params.m2, g: params.g }

    if (playing) {
      const h = Math.min(delta, 0.05) / 8
      for (let i = 0; i < 8; i++) state.current = rk4Step(state.current, p, h)
    }

    const s = state.current
    const x1 = PIVOT.x + params.L1 * SCALE * Math.sin(s.th1)
    const y1 = PIVOT.y - params.L1 * SCALE * Math.cos(s.th1)
    const x2 = x1 + params.L2 * SCALE * Math.sin(s.th2)
    const y2 = y1 - params.L2 * SCALE * Math.cos(s.th2)
    _b1.set(x1, y1, 0)
    _b2.set(x2, y2, 0)

    if (bob1.current) bob1.current.position.copy(_b1)
    if (bob2.current) bob2.current.position.copy(_b2)

    // orient rod 1: pivot -> bob1
    if (rod1.current) {
      _mid.copy(PIVOT).add(_b1).multiplyScalar(0.5)
      rod1.current.position.copy(_mid)
      rod1.current.scale.set(1, PIVOT.distanceTo(_b1), 1)
      rod1.current.quaternion.setFromUnitVectors(UP, _dir.copy(_b1).sub(PIVOT).normalize())
    }
    // orient rod 2: bob1 -> bob2
    if (rod2.current) {
      _mid.copy(_b1).add(_b2).multiplyScalar(0.5)
      rod2.current.position.copy(_mid)
      rod2.current.scale.set(1, _b1.distanceTo(_b2), 1)
      rod2.current.quaternion.setFromUnitVectors(UP, _dir.copy(_b2).sub(_b1).normalize())
    }

    // fading trail of the lower bob (the one retained allocation per frame)
    trailPts.current.push(_b2.clone())
    if (trailPts.current.length > TRAIL_CAP) trailPts.current.shift()
    if (trailGeo.current) trailGeo.current.setFromPoints(trailPts.current)

    publish({ theta1: (s.th1 * 180) / Math.PI, theta2: (s.th2 * 180) / Math.PI, energy: energy(s, p) })
  })

  return (
    <group>
      {/* pivot */}
      <mesh position={PIVOT.toArray()}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial color="#27344d" />
      </mesh>

      {/* rods (unit cylinder scaled along Y) */}
      <mesh ref={rod1}>
        <cylinderGeometry args={[0.035, 0.035, 1, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.3} />
      </mesh>
      <mesh ref={rod2}>
        <cylinderGeometry args={[0.035, 0.035, 1, 12]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.3} />
      </mesh>

      {/* bobs */}
      <mesh ref={bob1}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={bob2}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial color="#a855f7" emissive="#a855f7" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>

      {/* fading trail of lower bob */}
      <line>
        <bufferGeometry ref={trailGeo} attach="geometry" />
        <lineBasicMaterial attach="material" color="#a855f7" transparent opacity={0.5} />
      </line>
    </group>
  )
}
