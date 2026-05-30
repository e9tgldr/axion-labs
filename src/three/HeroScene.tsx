import { useMemo, useRef } from 'react'
import { Canvas, useFrame, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { useCanvasActive } from './useCanvasActive'

const ORANGE = new THREE.Color('#fb923c')
const VIOLET = new THREE.Color('#a855f7')
const PINK = new THREE.Color('#f472b6')

/** Particle shell distributed on a sphere (Fibonacci), tinted orange→violet by latitude. */
function ParticleShell({ count = 2200, radius = 2.2 }: { count?: number; radius?: number }) {
  const ref = useRef<THREE.Points>(null)
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const golden = Math.PI * (3 - Math.sqrt(5))
    const c = new THREE.Color()
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2
      const r = Math.sqrt(1 - y * y)
      const theta = golden * i
      const jitter = 0.92 + Math.random() * 0.16
      positions[i * 3] = Math.cos(theta) * r * radius * jitter
      positions[i * 3 + 1] = y * radius * jitter
      positions[i * 3 + 2] = Math.sin(theta) * r * radius * jitter
      c.copy(ORANGE).lerp(VIOLET, (y + 1) / 2)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return { positions, colors }
  }, [count, radius])

  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function ElectronRing({
  radius = 3,
  color,
  speed = 0.5,
  ...props
}: { radius?: number; color: THREE.Color; speed?: number } & ThreeElements['mesh']) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.z += delta * speed
  })
  return (
    <mesh ref={ref} {...props}>
      <torusGeometry args={[radius, 0.012, 12, 120]} />
      <meshBasicMaterial color={color} transparent opacity={0.55} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

function Rig({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    const { x, y } = state.pointer
    group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, x * 0.4, 0.05)
    group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, -y * 0.3, 0.05)
  })
  return <group ref={group}>{children}</group>
}

export default function HeroScene() {
  const { ref, active } = useCanvasActive()
  return (
    <div ref={ref} className="h-full w-full">
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      dpr={[1, 1.8]}
      frameloop={active ? 'always' : 'never'}
      gl={{ antialias: true, alpha: true }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.6} />
      <pointLight position={[6, 6, 6]} intensity={1.2} color={PINK} />
      <Rig>
        <ParticleShell />
        <mesh>
          <icosahedronGeometry args={[0.55, 2]} />
          <meshStandardMaterial
            color={ORANGE}
            emissive={VIOLET}
            emissiveIntensity={0.8}
            roughness={0.3}
            metalness={0.4}
          />
        </mesh>
        <ElectronRing radius={3} color={ORANGE} speed={0.45} rotation={[1.2, 0.3, 0]} />
        <ElectronRing radius={3.4} color={PINK} speed={-0.35} rotation={[0.4, 1.1, 0.6]} />
        <ElectronRing radius={2.7} color={VIOLET} speed={0.55} rotation={[1.9, 0.8, 1.2]} />
      </Rig>
    </Canvas>
    </div>
  )
}
