import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useCanvasActive } from './useCanvasActive'

/**
 * Canvas-only orbiting-bob teaser. Default-exported so it can be `React.lazy`-loaded —
 * keeping three.js out of the initial bundle. Render only when `heroEnabled()` is true;
 * provide the three-free `MiniSimFallback` as the Suspense fallback.
 */
function Orbiter() {
  const bob = useRef<THREE.Mesh>(null)
  const trail = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    const tm = state.clock.elapsedTime
    if (bob.current) bob.current.position.set(Math.cos(tm) * 1.6, Math.sin(tm) * 1.6, 0)
    if (trail.current) trail.current.rotation.z = tm
  })
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial color="#fb923c" emissive="#a855f7" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={trail}>
        <torusGeometry args={[1.6, 0.01, 8, 80]} />
        <meshBasicMaterial color="#f472b6" transparent opacity={0.5} />
      </mesh>
      <mesh ref={bob}>
        <sphereGeometry args={[0.18, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" emissive="#fb923c" emissiveIntensity={1.2} />
      </mesh>
    </group>
  )
}

export default function MiniSimTeaser() {
  const { ref, active } = useCanvasActive()
  return (
    <div ref={ref} className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.6]}
        frameloop={active ? 'always' : 'never'}
        gl={{ alpha: true }}
        style={{ pointerEvents: 'none' }}
      >
        <ambientLight intensity={0.7} />
        <pointLight position={[4, 4, 4]} intensity={1.4} color="#f472b6" />
        <Orbiter />
      </Canvas>
    </div>
  )
}
