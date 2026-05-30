import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import type { SimSceneProps } from '@/lab/types'
import { lens } from './physics'

const OBJ_HEIGHT = 1 // metres
const SCALE = 1 // world units per metre
const POS_CLAMP = 10 // max drawable distance along the axis
const DRAW_LIMIT = 10 // skip the image arrow beyond this distance

/** Clamp a metric distance into the drawable world box. */
function clampPos(d: number) {
  return Math.max(-POS_CLAMP, Math.min(POS_CLAMP, d))
}

/** An upright (or, if height<0, downward-pointing) arrow built from a shaft + head. */
function Arrow({
  x,
  height,
  color,
}: {
  x: number
  height: number
  color: string
}) {
  const h = Math.abs(height)
  const dir = Math.sign(height) || 1
  const shaftH = Math.max(h * 0.7, 0.001)
  const headH = Math.max(h * 0.3, 0.001)
  const r = 0.06
  return (
    <group position={[x, 0, 0]}>
      {/* shaft from the axis up/down */}
      <mesh position={[0, (dir * shaftH) / 2, 0]}>
        <cylinderGeometry args={[r, r, shaftH, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
      {/* head at the tip */}
      <mesh position={[0, dir * (shaftH + headH / 2), 0]} rotation={[0, 0, dir > 0 ? 0 : Math.PI]}>
        <coneGeometry args={[r * 2.4, headH, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} />
      </mesh>
    </group>
  )
}

/** A thin glowing line between two points. The declarative bufferAttribute owns the
 *  positions; a fresh Float32Array on each render (when from/to change) updates them. */
function Ray({ from, to, color }: { from: THREE.Vector3; to: THREE.Vector3; color: string }) {
  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array([from.x, from.y, from.z, to.x, to.y, to.z]), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial attach="material" color={color} />
    </line>
  )
}

export default function Scene({ params, publish }: SimSceneProps) {
  const { focal, objDist } = params

  const data = useMemo(() => {
    const { imageDist, magnification, real } = lens({ focal, objDist })

    const f = clampPos(focal)
    const objX = clampPos(-objDist) // object sits on the left of the lens
    const objTipY = OBJ_HEIGHT * SCALE

    const imageDrawable = Number.isFinite(imageDist) && Math.abs(imageDist) <= DRAW_LIMIT
    const imageX = imageDrawable ? clampPos(imageDist) : 0
    const imageH = magnification * OBJ_HEIGHT * SCALE

    // Principal ray 1: parallel from the object tip to the lens, then through the
    // far focal point (refracts at the lens plane and crosses the axis at +f).
    const ray1a = new THREE.Vector3(objX, objTipY, 0)
    const ray1b = new THREE.Vector3(0, objTipY, 0)
    const ray1c = new THREE.Vector3(f, 0, 0)

    // Principal ray 2: through the lens centre, undeviated. Extend to the image plane
    // (or a sensible distance when the image is off-screen / virtual).
    const centerTargetX = imageDrawable ? imageX : clampPos(objDist)
    const slope = -objTipY / objX // line from object tip through origin
    const ray2a = new THREE.Vector3(objX, objTipY, 0)
    const ray2b = new THREE.Vector3(centerTargetX, slope * centerTargetX, 0)

    return {
      imageDist,
      magnification,
      real,
      objX,
      imageX,
      imageDrawable,
      imageH,
      f,
      ray1a,
      ray1b,
      ray1c,
      ray2a,
      ray2b,
    }
  }, [focal, objDist])

  // Static analytic sim — publish only when inputs change (no per-frame work);
  // OrbitControls still gets its frames from the canvas frameloop.
  useEffect(() => {
    publish({
      imageDist: data.imageDist,
      magnification: data.magnification,
      imageType: data.real,
    })
  }, [data, publish])

  const focalPos = Number.isFinite(data.f) ? data.f : POS_CLAMP

  return (
    <group>
      {/* optical axis */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([-POS_CLAMP, 0, 0, POS_CLAMP, 0, 0]), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#3b4a66" />
      </line>

      {/* thin convex lens at x=0: a flattened semi-transparent disc */}
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 0.12, 1]}>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#7c3aed"
          emissiveIntensity={0.4}
          transparent
          opacity={0.32}
          roughness={0.15}
        />
      </mesh>

      {/* focal points on the axis */}
      <mesh position={[focalPos, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" emissive="#a855f7" emissiveIntensity={0.6} />
      </mesh>
      <mesh position={[-focalPos, 0, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#f8fafc" emissive="#a855f7" emissiveIntensity={0.6} />
      </mesh>

      {/* object arrow (upright, on the left) */}
      <Arrow x={data.objX} height={OBJ_HEIGHT * SCALE} color="#fb923c" />

      {/* image arrow (points down when magnification < 0) */}
      {data.imageDrawable && <Arrow x={data.imageX} height={data.imageH} color="#34d399" />}

      {/* principal rays */}
      <Ray from={data.ray1a} to={data.ray1b} color="#fbbf24" />
      <Ray from={data.ray1b} to={data.ray1c} color="#fbbf24" />
      <Ray from={data.ray2a} to={data.ray2b} color="#60a5fa" />
    </group>
  )
}
