# Axion Labs — Phase 2 (3D Simulation Engine + Library) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax. Use **test-driven-development** for all `physics.ts` modules and **frontend-design** for Scenes/UI.

**Goal:** Replace the `/lab` stub with a browsable library of interactive 3D physics simulations: a reusable `SimPlayer` framework + 6 working sims (hybrid analytic/RK4), true-3D scenes with orbit controls, trilingual.

**Architecture:** A simulation = pure `physics.ts` + a declarative `SimDefinition` (params/readouts/Scene) + an r3f `Scene`. `SimPlayer` renders controls/HUD/transport generically. Physics runs at 60 fps in `useFrame` and publishes readouts into a mutable ref; `ReadoutPanel` reads it on a 10 Hz rAF throttle. Sims are lazy-loaded via a registry; `/lab` is a filtered catalog, `/lab/:id` a detail page.

**Tech Stack:** React 18 + TS + Vite, @react-three/fiber + @react-three/drei (`OrbitControls`), Tailwind, i18next, Vitest. Reuses Phase 1: `webgl.ts`, `useCanvasActive`, UI primitives, `SIMULATIONS`, `resolveLang`.

**Working dir:** `C:\Users\enkh\axion-labs`. Verify each task with `npx tsc --noEmit` + `npx vitest run`.

**Shared i18n key list (`lab` namespace)** — used across tasks, keep identical in mn/en/zh:
- UI: `controls, readouts, play, pause, reset, dragHint, comingSoon, backToLab, webglRequired, filterTopic, filterGrade, allTopics, allGrades`
- params: `param.v0, param.angle, param.g, param.L1, param.L2, param.m1, param.m2, param.theta1, param.theta2, param.mass, param.mu, param.V, param.R1, param.R2, param.A, param.f, param.lambda, param.focal, param.objDist`
- readouts: `readout.range, readout.maxHeight, readout.flightTime, readout.speed, readout.theta1, readout.theta2, readout.energy, readout.accel, readout.friction, readout.normal, readout.current, readout.resistance, readout.power, readout.waveSpeed, readout.period, readout.angFreq, readout.imageDist, readout.magnification, readout.imageType`
- descriptions: `sims.projectile.desc, sims.double-pendulum.desc, sims.incline-friction.desc, sims.ohm-circuit.desc, sims.waves.desc, sims.lens-optics.desc`

---

## Task 1: Lab core — types, format, readout store, Slider primitive

**Files:** Create `src/lab/types.ts`, `src/lab/format.ts` (+ `format.test.ts`), `src/lab/useReadoutStore.ts`, `src/components/ui/Slider.tsx` (+ `Slider.test.tsx`).

- [ ] **Step 1: `src/lab/types.ts`** (no test; types only)
```ts
export type SimState = Record<string, number>

export interface ParamSpec {
  key: string
  labelKey: string
  min: number
  max: number
  step: number
  default: number
  unit?: string
}
export interface ReadoutSpec {
  key: string
  labelKey: string
  unit?: string
  decimals?: number
}
export interface SimSceneProps {
  params: SimState
  playing: boolean
  resetKey: number
  publish: (values: Record<string, number>) => void
}
export interface SimDefinition {
  id: string
  params: ParamSpec[]
  readouts: ReadoutSpec[]
  Scene: React.ComponentType<SimSceneProps>
  camera?: { position: [number, number, number]; fov?: number }
}
export const defaultsOf = (params: ParamSpec[]): SimState =>
  Object.fromEntries(params.map((p) => [p.key, p.default]))
```

- [ ] **Step 2: `format.test.ts`** then `format.ts`
```ts
// format.test.ts
import { fmt } from './format'
test('formats with fixed decimals and trims -0', () => {
  expect(fmt(3.14159, 2)).toBe('3.14')
  expect(fmt(-0.0001, 2)).toBe('0.00')
  expect(fmt(42, 0)).toBe('42')
})
```
```ts
// format.ts
export const fmt = (n: number, decimals = 2): string => {
  if (!Number.isFinite(n)) return '—'
  const r = Number(n.toFixed(decimals))
  const safe = Object.is(r, -0) ? 0 : r
  return safe.toFixed(decimals)
}
```
Run `npx vitest run src/lab/format` → PASS.

- [ ] **Step 3: `useReadoutStore.ts`** (mutable ref + throttled subscribe)
```ts
import { useEffect, useRef, useState } from 'react'

export interface ReadoutStore {
  publish: (values: Record<string, number>) => void
  current: () => Record<string, number>
}

/** Holds latest readouts in a ref (publish is render-free). */
export function createReadoutStore(): ReadoutStore {
  let values: Record<string, number> = {}
  return { publish: (v) => { values = v }, current: () => values }
}

/** Re-render at ~`hz` to mirror the store into React state. */
export function useThrottledReadouts(store: ReadoutStore, hz = 10) {
  const [snapshot, setSnapshot] = useState<Record<string, number>>({})
  const last = useRef(0)
  useEffect(() => {
    let raf = 0
    const tick = (t: number) => {
      if (t - last.current >= 1000 / hz) {
        last.current = t
        setSnapshot(store.current())
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [store, hz])
  return snapshot
}
```

- [ ] **Step 4: `Slider.test.tsx`** then `Slider.tsx`
```tsx
// Slider.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { Slider } from './Slider'
test('renders label/value and emits changes', () => {
  let v = 5
  render(<Slider label="Speed" value={v} min={0} max={10} step={1} unit="m/s" onChange={(n) => (v = n)} />)
  expect(screen.getByText('Speed')).toBeInTheDocument()
  expect(screen.getByText('5 m/s')).toBeInTheDocument()
  fireEvent.change(screen.getByRole('slider'), { target: { value: '8' } })
  expect(v).toBe(8)
})
```
```tsx
// Slider.tsx
import { cn } from '@/lib/cn'
export function Slider({ label, value, min, max, step, unit, onChange, className }:
  { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (n: number) => void; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1.5', className)}>
      <span className="flex items-center justify-between font-mono text-xs uppercase tracking-widest text-muted">
        <span>{label}</span>
        <span className="text-text">{value}{unit ? ` ${unit}` : ''}</span>
      </span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line accent-orange"
      />
    </label>
  )
}
```
Run `npx vitest run src/components/ui/Slider` → PASS.

- [ ] **Step 5: Commit** `feat(lab): core types, format, readout store, Slider primitive`

---

## Task 2: Framework shell — SimCanvas, ControlPanel, ReadoutPanel, SimPlayer

**Files:** Create `src/lab/SimCanvas.tsx`, `src/lab/ControlPanel.tsx`, `src/lab/ReadoutPanel.tsx`, `src/lab/SimPlayer.tsx`, `src/lab/SimPlayer.test.tsx`.

- [ ] **Step 1: `SimCanvas.tsx`** — Canvas + OrbitControls + lights + grid + WebGL fallback
```tsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { useTranslation } from 'react-i18next'
import { isWebGLAvailable } from '@/three/webgl'
import { useCanvasActive } from '@/three/useCanvasActive'
import type { SimDefinition, SimSceneProps } from './types'

export function SimCanvas({ def, scene }: { def: SimDefinition; scene: SimSceneProps }) {
  const { t } = useTranslation('lab')
  const { ref, active } = useCanvasActive()
  if (!isWebGLAvailable()) {
    return (
      <div className="grid h-full min-h-[320px] place-items-center rounded-2xl border border-line bg-surface/50 p-8 text-center font-mono text-sm text-muted">
        {t('webglRequired')}
      </div>
    )
  }
  const Scene = def.Scene
  return (
    <div ref={ref} className="relative h-full min-h-[420px] overflow-hidden rounded-2xl border border-line bg-bg">
      <Canvas camera={{ position: def.camera?.position ?? [6, 4, 8], fov: def.camera?.fov ?? 45 }}
        dpr={[1, 1.8]} frameloop={active ? 'always' : 'never'}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[6, 8, 6]} intensity={1.1} />
        <Grid args={[30, 30]} cellColor="#1E2A3F" sectionColor="#27344d" fadeDistance={30} infiniteGrid position={[0, -0.001, 0]} />
        <Scene {...scene} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={20} />
      </Canvas>
      <span className="pointer-events-none absolute bottom-3 left-3 font-mono text-[10px] uppercase tracking-widest text-muted">
        {t('dragHint')}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: `ControlPanel.tsx`**
```tsx
import { useTranslation } from 'react-i18next'
import { Slider } from '@/components/ui/Slider'
import type { ParamSpec, SimState } from './types'
export function ControlPanel({ params, values, onChange }:
  { params: ParamSpec[]; values: SimState; onChange: (key: string, v: number) => void }) {
  const { t } = useTranslation('lab')
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface/50 p-5">
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted">{t('controls')}</h3>
      {params.map((p) => (
        <Slider key={p.key} label={t(p.labelKey)} unit={p.unit} value={values[p.key]}
          min={p.min} max={p.max} step={p.step} onChange={(v) => onChange(p.key, v)} />
      ))}
    </div>
  )
}
```

- [ ] **Step 3: `ReadoutPanel.tsx`**
```tsx
import { useTranslation } from 'react-i18next'
import { Readout } from '@/components/ui/Readout'
import { fmt } from './format'
import { useThrottledReadouts, type ReadoutStore } from './useReadoutStore'
import type { ReadoutSpec } from './types'
export function ReadoutPanel({ readouts, store }: { readouts: ReadoutSpec[]; store: ReadoutStore }) {
  const { t } = useTranslation('lab')
  const snap = useThrottledReadouts(store)
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/50 p-5">
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted">{t('readouts')}</h3>
      <div className="grid grid-cols-2 gap-3">
        {readouts.map((r) => (
          <Readout key={r.key} label={t(r.labelKey)} unit={r.unit}
            value={fmt(snap[r.key] ?? 0, r.decimals ?? 2)} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: `SimPlayer.tsx`** — owns params/playing/resetKey, wires the store
```tsx
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SimCanvas } from './SimCanvas'
import { ControlPanel } from './ControlPanel'
import { ReadoutPanel } from './ReadoutPanel'
import { createReadoutStore } from './useReadoutStore'
import { defaultsOf, type SimDefinition } from './types'
export function SimPlayer({ def }: { def: SimDefinition }) {
  const { t } = useTranslation('lab')
  const store = useMemo(() => createReadoutStore(), [])
  const [values, setValues] = useState(() => defaultsOf(def.params))
  const [playing, setPlaying] = useState(true)
  const [resetKey, setResetKey] = useState(0)
  const reset = () => { setValues(defaultsOf(def.params)); setResetKey((k) => k + 1) }
  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <SimCanvas def={def} scene={{ params: values, playing, resetKey, publish: store.publish }} />
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Button size="sm" variant="gradient" onClick={() => setPlaying((p) => !p)}>
            {playing ? t('pause') : t('play')}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>{t('reset')}</Button>
        </div>
        <ControlPanel params={def.params} values={values} onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))} />
        <ReadoutPanel readouts={def.readouts} store={store} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: `SimPlayer.test.tsx`** — mock def, Canvas gated off (jsdom has no WebGL → SimCanvas renders the fallback, no `<canvas>`)
```tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { I18nextProvider } from 'react-i18next'
import i18n from '@/i18n'
import { SimPlayer } from './SimPlayer'
import type { SimDefinition } from './types'
const mockDef: SimDefinition = {
  id: 'mock', params: [{ key: 'x', labelKey: 'param.v0', min: 0, max: 10, step: 1, default: 4, unit: 'm' }],
  readouts: [{ key: 'y', labelKey: 'readout.speed', unit: 'm/s' }],
  Scene: () => null,
}
test('renders a slider per param and a transport toggle', async () => {
  await i18n.changeLanguage('en')
  render(<I18nextProvider i18n={i18n}><SimPlayer def={mockDef} /></I18nextProvider>)
  expect(screen.getByRole('slider')).toBeInTheDocument()
  const pause = screen.getByRole('button', { name: /pause/i })
  fireEvent.click(pause)
  expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
})
```
Run `npx vitest run src/lab/SimPlayer` → PASS. Then **commit** `feat(lab): SimPlayer framework (canvas, controls, readouts, transport)`.

---

## Task 3: lab i18n namespace + key-parity

**Files:** Create `src/i18n/locales/{mn,en,zh}/lab.json`; modify `src/i18n/index.ts`; modify `src/i18n/keyparity.test.ts`.

- [ ] **Step 1: Author `en/lab.json`** with every key from the shared key list. EN reference values (translate for mn/zh — reuse harvested physics terms; e.g. mn `param.angle`="Өнцөг", `readout.energy`="Энерги", `play`="Тоглуулах", `reset`="Дахин эхлэх"; zh `play`="播放", `reset`="重置", `param.angle`="角度"). EN example:
```json
{
  "controls": "Controls", "readouts": "Readouts", "play": "Play", "pause": "Pause", "reset": "Reset",
  "dragHint": "Drag to rotate", "comingSoon": "Coming soon", "backToLab": "Back to lab",
  "webglRequired": "3D view requires a WebGL-capable browser. Controls and readouts still work.",
  "filterTopic": "Topic", "filterGrade": "Grade", "allTopics": "All topics", "allGrades": "All",
  "param": { "v0": "Initial speed", "angle": "Angle", "g": "Gravity", "L1": "Rod 1 length", "L2": "Rod 2 length",
    "m1": "Mass 1", "m2": "Mass 2", "theta1": "Angle 1", "theta2": "Angle 2", "mass": "Mass", "mu": "Friction μ",
    "V": "Voltage", "R1": "Resistor 1", "R2": "Resistor 2", "A": "Amplitude", "f": "Frequency", "lambda": "Wavelength",
    "focal": "Focal length", "objDist": "Object distance" },
  "readout": { "range": "Range", "maxHeight": "Max height", "flightTime": "Flight time", "speed": "Speed",
    "theta1": "Angle 1", "theta2": "Angle 2", "energy": "Energy", "accel": "Acceleration", "friction": "Friction",
    "normal": "Normal force", "current": "Current", "resistance": "Resistance", "power": "Power",
    "waveSpeed": "Wave speed", "period": "Period", "angFreq": "Angular freq", "imageDist": "Image distance",
    "magnification": "Magnification", "imageType": "Real (1) / virtual (0)" },
  "sims": {
    "projectile": { "desc": "Launch a projectile and watch range, height and flight time." },
    "double-pendulum": { "desc": "A chaotic system — tiny changes in the start angle change everything." },
    "incline-friction": { "desc": "Slide a block down a ramp and see how friction changes acceleration." },
    "ohm-circuit": { "desc": "Vary voltage and series resistance; watch current and power (V = I·R)." },
    "waves": { "desc": "Change amplitude, frequency and wavelength of a traveling wave (v = f·λ)." },
    "lens-optics": { "desc": "Move the object near a convex lens and trace the image (1/f = 1/d + 1/d′)." }
  }
}
```

- [ ] **Step 2: Author `mn/lab.json` and `zh/lab.json`** with identical key trees, translated values.

- [ ] **Step 3: Register namespace** — in `src/i18n/index.ts` import the three `lab` files, add to each language's resources (`lab: xxLab`), and set `ns: ['common', 'landing', 'lab']`.

- [ ] **Step 4: Extend parity test** — in `keyparity.test.ts` change `test.each(['common', 'landing'])` to `test.each(['common', 'landing', 'lab'])`. Run `npx vitest run src/i18n/keyparity` → PASS (fix any key mismatch).

- [ ] **Step 5: Commit** `feat(i18n): lab namespace (mn/en/zh) + parity`.

---

## Task 4: Registry, catalog, detail routing (+ Projectile as first sim)

**Files:** Create `src/lab/registry.ts`, `src/lab/LabCatalog.tsx`, `src/lab/SimDetailPage.tsx`, `src/lab/sims/projectile/{physics.ts,physics.test.ts,Scene.tsx,index.ts}`; modify `src/App.tsx`; create `src/lab/LabCatalog.test.tsx`.

- [ ] **Step 1: Projectile physics — test then impl** (`sims/projectile/physics.test.ts`, `physics.ts`)
```ts
// physics.test.ts
import { projectile } from './physics'
test('range and height match closed form (v0=20, 45°, g=9.8)', () => {
  const r = projectile({ v0: 20, angle: 45, g: 9.8 })
  expect(r.range).toBeCloseTo(20 * 20 / 9.8, 5)       // sin90=1
  expect(r.flightTime).toBeCloseTo(2 * 20 * Math.sin(Math.PI / 4) / 9.8, 5)
  expect(r.maxHeight).toBeCloseTo((20 * Math.sin(Math.PI / 4)) ** 2 / (2 * 9.8), 5)
})
```
```ts
// physics.ts
export interface ProjectileIn { v0: number; angle: number; g: number }
export function projectile({ v0, angle, g }: ProjectileIn) {
  const th = (angle * Math.PI) / 180
  const vx = v0 * Math.cos(th), vy = v0 * Math.sin(th)
  const flightTime = g > 0 ? (2 * vy) / g : 0
  const range = vx * flightTime
  const maxHeight = g > 0 ? (vy * vy) / (2 * g) : 0
  return { vx, vy, flightTime, range, maxHeight }
}
export const posAt = (i: ProjectileIn, t: number) => {
  const { vx, vy } = projectile(i)
  return { x: vx * t, y: vy * t - 0.5 * i.g * t * t }
}
```
Run `npx vitest run src/lab/sims/projectile` → PASS.

- [ ] **Step 2: Projectile `Scene.tsx`** — r3f scene; loops over flightTime; publishes readouts
```tsx
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SimSceneProps } from '@/lab/types'
import { projectile, posAt } from './physics'
export default function Scene({ params, playing, resetKey, publish }: SimSceneProps) {
  const ball = useRef<THREE.Mesh>(null)
  const tRef = useRef(0)
  const lastReset = useRef(resetKey)
  useFrame((_, dt) => {
    if (lastReset.current !== resetKey) { tRef.current = 0; lastReset.current = resetKey }
    const inp = { v0: params.v0, angle: params.angle, g: params.g }
    const { flightTime, range, maxHeight } = projectile(inp)
    if (playing && flightTime > 0) { tRef.current += dt; if (tRef.current > flightTime) tRef.current = 0 }
    const p = posAt(inp, tRef.current)
    if (ball.current) ball.current.position.set(p.x * 0.2 - 3, p.y * 0.2, 0)   // scale world units
    const vy = inp.v0 * Math.sin((inp.angle * Math.PI) / 180) - inp.g * tRef.current
    const vx = inp.v0 * Math.cos((inp.angle * Math.PI) / 180)
    publish({ range, maxHeight, flightTime, speed: Math.hypot(vx, vy) })
  })
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[20, 6]} /><meshStandardMaterial color="#0E1320" />
      </mesh>
      <mesh ref={ball}><sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color="#fb923c" emissive="#a855f7" emissiveIntensity={0.5} /></mesh>
    </group>
  )
}
```

- [ ] **Step 3: Projectile `index.ts`** (`SimDefinition`)
```ts
import type { SimDefinition } from '@/lab/types'
import Scene from './Scene'
const def: SimDefinition = {
  id: 'projectile',
  params: [
    { key: 'v0', labelKey: 'param.v0', min: 5, max: 40, step: 1, default: 20, unit: 'm/s' },
    { key: 'angle', labelKey: 'param.angle', min: 5, max: 85, step: 1, default: 45, unit: '°' },
    { key: 'g', labelKey: 'param.g', min: 1, max: 20, step: 0.1, default: 9.8, unit: 'm/s²' },
  ],
  readouts: [
    { key: 'range', labelKey: 'readout.range', unit: 'm' },
    { key: 'maxHeight', labelKey: 'readout.maxHeight', unit: 'm' },
    { key: 'flightTime', labelKey: 'readout.flightTime', unit: 's' },
    { key: 'speed', labelKey: 'readout.speed', unit: 'm/s' },
  ],
  Scene,
  camera: { position: [0, 2, 10] },
}
export default def
```

- [ ] **Step 4: `registry.ts`**
```ts
import type { SimDefinition } from './types'
export const SIM_MODULES: Record<string, () => Promise<{ default: SimDefinition }>> = {
  projectile: () => import('./sims/projectile'),
  // double-pendulum, incline-friction, ohm-circuit, waves, lens-optics added in later tasks
}
export const builtIds = () => Object.keys(SIM_MODULES)
export const isBuilt = (id: string) => id in SIM_MODULES
```

- [ ] **Step 5: `SimDetailPage.tsx`** — lazy-load def by `:id`
```tsx
import { lazy, Suspense, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/Button'
import { Pill } from '@/components/ui/Pill'
import { resolveLang } from '@/i18n'
import { SIMULATIONS } from '@/data/simulations'
import { SIM_MODULES, isBuilt } from './registry'
import { SimPlayer } from './SimPlayer'
import { NotFound } from '@/routes/NotFound'
export function SimDetailPage() {
  const { id = '' } = useParams()
  const { t, i18n } = useTranslation('lab')
  const lang = resolveLang(i18n.language)
  const meta = SIMULATIONS.find((s) => s.id === id)
  const Player = useMemo(() => (isBuilt(id)
    ? lazy(async () => ({ default: (await SIM_MODULES[id]()).default }).then) : null), [id]) // see note
  if (!meta || !isBuilt(id)) return <NotFound />
  // Lazy-load the SimDefinition then render SimPlayer:
  const LazyPlayer = lazy(async () => {
    const def = (await SIM_MODULES[id]()).default
    return { default: () => <SimPlayer def={def} /> }
  })
  return (
    <Container className="py-12">
      <Button variant="ghost" size="sm" to="/lab" className="mb-6">← {t('backToLab')}</Button>
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-3xl font-bold">{meta.name[lang]}</h1>
          <Pill>{meta.topic[lang]}</Pill>
        </div>
        <p className="max-w-2xl text-muted">{t(`sims.${id}.desc`)}</p>
        <code className="font-mono text-sm text-orange">{meta.formula}</code>
      </div>
      <Suspense fallback={<div className="min-h-[420px] rounded-2xl border border-line bg-surface/40" />}>
        <LazyPlayer />
      </Suspense>
    </Container>
  )
}
```
NOTE: remove the unused `Player` line above; the canonical implementation is the `LazyPlayer` defined inside the component. (Keep only `LazyPlayer`.)

- [ ] **Step 6: `LabCatalog.tsx`** — grid + topic/grade filters
```tsx
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Container } from '@/components/ui/Container'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { GlassPanel } from '@/components/ui/GlassPanel'
import { Pill } from '@/components/ui/Pill'
import { cn } from '@/lib/cn'
import { resolveLang } from '@/i18n'
import { SIMULATIONS, type Accent } from '@/data/simulations'
import { isBuilt } from './registry'
const ACCENT: Record<Accent, string> = { orange: 'text-orange', pink: 'text-pink', violet: 'text-violet', amber: 'text-amber' }
export function LabCatalog() {
  const { t, i18n } = useTranslation('lab')
  const lang = resolveLang(i18n.language)
  const [topic, setTopic] = useState<string | null>(null)
  const [grade, setGrade] = useState<number | null>(null)
  const topics = useMemo(() => [...new Set(SIMULATIONS.map((s) => s.topic[lang]))], [lang])
  const grades = useMemo(() => [...new Set(SIMULATIONS.map((s) => s.grade))].sort((a, b) => a - b), [])
  const shown = SIMULATIONS.filter((s) => (!topic || s.topic[lang] === topic) && (!grade || s.grade === grade))
  return (
    <Container className="py-12">
      <SectionHeading align="left" eyebrow="The Lab" title={t('readouts') /* replaced below */} />
      {/* Title: use a lab.json key e.g. 'catalogTitle' — add it to the shared key list/locales */}
      <div className="my-6 flex flex-wrap gap-2">
        <FilterChip active={!topic} label={t('allTopics')} onClick={() => setTopic(null)} />
        {topics.map((tp) => <FilterChip key={tp} active={topic === tp} label={tp} onClick={() => setTopic(tp)} />)}
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        <FilterChip active={!grade} label={t('allGrades')} onClick={() => setGrade(null)} />
        {grades.map((g) => <FilterChip key={g} active={grade === g} label={String(g)} onClick={() => setGrade(g)} />)}
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((s) => {
          const built = isBuilt(s.id)
          const card = (
            <GlassPanel className={cn('flex h-full flex-col gap-3', built ? 'transition-all hover:-translate-y-1 hover:border-violet/50' : 'opacity-60')}>
              <div className="flex items-center justify-between">
                <Pill>{s.topic[lang]}</Pill>
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{t('filterGrade')} {s.grade}</span>
              </div>
              <h3 className={cn('font-display text-lg font-bold', ACCENT[s.accent])}>{s.name[lang]}</h3>
              <code className="mt-auto font-mono text-xs text-muted">{s.formula}</code>
              {!built && <span className="font-mono text-[10px] uppercase tracking-widest text-amber">{t('comingSoon')}</span>}
            </GlassPanel>
          )
          return built ? <Link key={s.id} to={`/lab/${s.id}`}>{card}</Link> : <div key={s.id}>{card}</div>
        })}
      </div>
    </Container>
  )
}
function FilterChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={cn('rounded-full border px-3 py-1 font-mono text-xs uppercase tracking-widest transition-colors',
        active ? 'border-transparent bg-axion text-bg' : 'border-line text-muted hover:text-text')}>
      {label}
    </button>
  )
}
```
ADD to the shared key list + all 3 locales: `catalogTitle` ("The Axion lab" / mn / zh) and `catalogEyebrow` (reuse "The Lab"); use `t('catalogTitle')` for the heading title and remove the placeholder comment.

- [ ] **Step 7: Wire routes in `App.tsx`** — replace the `/lab` entry:
```tsx
import { LabCatalog } from '@/lab/LabCatalog'
import { SimDetailPage } from '@/lab/SimDetailPage'
// inside <Routes>: keep STUB_ROUTES minus '/lab'
<Route path="/lab" element={<LabCatalog />} />
<Route path="/lab/:id" element={<SimDetailPage />} />
```
Change `STUB_ROUTES` to `['/tutor', '/exams', '/pricing', '/login', '/dashboard']`.

- [ ] **Step 8: `LabCatalog.test.tsx`**
```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nextProvider } from 'react-i18next'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/i18n'
import { LabCatalog } from './LabCatalog'
import { SIMULATIONS } from '@/data/simulations'
const wrap = (ui: React.ReactElement) => <I18nextProvider i18n={i18n}><MemoryRouter>{ui}</MemoryRouter></I18nextProvider>
test('renders all catalog cards and filters by grade', async () => {
  await i18n.changeLanguage('en')
  render(wrap(<LabCatalog />))
  expect(screen.getAllByText('Projectile Motion').length).toBeGreaterThan(0)
  expect(screen.getByText(/coming soon/i)).toBeInTheDocument()      // an unbuilt sim
  await userEvent.click(screen.getByRole('button', { name: '11' })) // grade 11 filter
  expect(screen.queryByText('Projectile Motion')).toBeNull()        // grade 9 sim hidden
})
```
Run `npx vitest run src/lab/LabCatalog src/lab/sims/projectile` → PASS, then `npx tsc --noEmit` (0) and **commit** `feat(lab): registry, catalog, detail routing + projectile sim`.

---

## Tasks 5–9: remaining sims (one task each)

Each task = TDD the `physics.ts`, build `Scene.tsx`, write `index.ts`, register in `registry.ts`, commit. Camera/world-scale chosen per scene; all publish exactly their `readouts` keys.

### Task 5: Double Pendulum (RK4)
**Files:** `src/lab/sims/double-pendulum/{physics.ts,physics.test.ts,Scene.tsx,index.ts}`; modify `registry.ts`.
- [ ] **Physics test (energy conservation)** then impl:
```ts
// physics.test.ts
import { rk4Step, energy, type DPState } from './physics'
test('RK4 conserves total energy within tolerance over 2000 steps', () => {
  const p = { L1: 1, L2: 1, m1: 1, m2: 1, g: 9.8 }
  let s: DPState = { th1: Math.PI / 2, th2: Math.PI / 2, w1: 0, w2: 0 }
  const E0 = energy(s, p)
  for (let i = 0; i < 2000; i++) s = rk4Step(s, p, 0.002)
  expect(Math.abs(energy(s, p) - E0)).toBeLessThan(0.05 * Math.abs(E0) + 0.05)
})
```
```ts
// physics.ts
export interface DPParams { L1: number; L2: number; m1: number; m2: number; g: number }
export interface DPState { th1: number; th2: number; w1: number; w2: number }
function deriv(s: DPState, p: DPParams): DPState {
  const { L1, L2, m1, m2, g } = p, { th1, th2, w1, w2 } = s
  const d = th1 - th2, den = 2 * m1 + m2 - m2 * Math.cos(2 * d)
  const a1 = (-g * (2 * m1 + m2) * Math.sin(th1) - m2 * g * Math.sin(th1 - 2 * th2)
    - 2 * Math.sin(d) * m2 * (w2 * w2 * L2 + w1 * w1 * L1 * Math.cos(d))) / (L1 * den)
  const a2 = (2 * Math.sin(d) * (w1 * w1 * L1 * (m1 + m2) + g * (m1 + m2) * Math.cos(th1)
    + w2 * w2 * L2 * m2 * Math.cos(d))) / (L2 * den)
  return { th1: w1, th2: w2, w1: a1, w2: a2 }
}
const add = (s: DPState, k: DPState, h: number): DPState =>
  ({ th1: s.th1 + k.th1 * h, th2: s.th2 + k.th2 * h, w1: s.w1 + k.w1 * h, w2: s.w2 + k.w2 * h })
export function rk4Step(s: DPState, p: DPParams, h: number): DPState {
  const k1 = deriv(s, p), k2 = deriv(add(s, k1, h / 2), p)
  const k3 = deriv(add(s, k2, h / 2), p), k4 = deriv(add(s, k3, h), p)
  return {
    th1: s.th1 + (h / 6) * (k1.th1 + 2 * k2.th1 + 2 * k3.th1 + k4.th1),
    th2: s.th2 + (h / 6) * (k1.th2 + 2 * k2.th2 + 2 * k3.th2 + k4.th2),
    w1: s.w1 + (h / 6) * (k1.w1 + 2 * k2.w1 + 2 * k3.w1 + k4.w1),
    w2: s.w2 + (h / 6) * (k1.w2 + 2 * k2.w2 + 2 * k3.w2 + k4.w2),
  }
}
export function energy(s: DPState, p: DPParams): number {
  const { L1, L2, m1, m2, g } = p
  const y1 = -L1 * Math.cos(s.th1), y2 = y1 - L2 * Math.cos(s.th2)
  const v1sq = (L1 * s.w1) ** 2
  const v2sq = (L1 * s.w1) ** 2 + (L2 * s.w2) ** 2 + 2 * L1 * L2 * s.w1 * s.w2 * Math.cos(s.th1 - s.th2)
  return 0.5 * m1 * v1sq + 0.5 * m2 * v2sq + m1 * g * y1 + m2 * g * y2
}
```
- [ ] **Scene.tsx** — substep RK4 (e.g. 8 substeps of `dt/8`, clamp dt) when `playing`; re-seed from `params.theta1/theta2` (deg→rad) and zero angular velocity on `resetKey` change; render two rods + bobs (positions from angles), a fading trail of the lower bob (array of recent points). `publish({ theta1: deg(s.th1), theta2: deg(s.th2), energy: energy(s,p) })`.
- [ ] **index.ts** params: `L1,L2` (0.5–2 m, default 1), `m1,m2` (0.5–3 kg, default 1), `theta1,theta2` (0–180°, default 120/90), `g` (1–20, default 9.8); readouts: `theta1(°), theta2(°), energy(J)`; camera `[0,0,8]`.
- [ ] Register `'double-pendulum': () => import('./sims/double-pendulum')`. Run tests → PASS; commit.

### Task 6: Incline & Friction (analytic)
**Files:** `src/lab/sims/incline-friction/{physics.ts,physics.test.ts,Scene.tsx,index.ts}`; modify `registry.ts`.
- [ ] **Physics test** then impl:
```ts
import { incline } from './physics'
test('a = g(sinθ - μcosθ), clamped at 0', () => {
  const r = incline({ angle: 30, mass: 2, mu: 0.1, g: 9.8 })
  expect(r.accel).toBeCloseTo(9.8 * (Math.sin(Math.PI/6) - 0.1 * Math.cos(Math.PI/6)), 5)
  expect(incline({ angle: 10, mass: 2, mu: 1, g: 9.8 }).accel).toBe(0)   // static
})
```
```ts
export interface InclineIn { angle: number; mass: number; mu: number; g: number }
export function incline({ angle, mass, mu, g }: InclineIn) {
  const th = (angle * Math.PI) / 180
  const normal = mass * g * Math.cos(th)
  const raw = g * (Math.sin(th) - mu * Math.cos(th))
  const accel = Math.max(0, raw)
  const friction = mu * normal
  return { accel, friction, normal }
}
```
- [ ] **Scene.tsx** — a ramp rotated by `angle`, a block that slides from rest with `accel` (integrate position along the slope; loop back to top when it reaches bottom or when `resetKey` changes); publish `{ accel, friction, normal, speed }` (speed from integrated `a·t`).
- [ ] **index.ts** params `angle` (5–60°, def 25), `mass` (0.5–10 kg, def 2), `mu` (0–1, step 0.05, def 0.2), plus fixed `g` via param (1–20, def 9.8); readouts `accel(m/s²), friction(N), normal(N), speed(m/s)`. Register, test, commit.

### Task 7: Ohm's-Law Circuit (analytic, series)
**Files:** `src/lab/sims/ohm-circuit/{physics.ts,physics.test.ts,Scene.tsx,index.ts}`; modify `registry.ts`.
- [ ] **Physics test** then impl:
```ts
import { ohm } from './physics'
test('series: R=R1+R2, I=V/R, P=VI', () => {
  const r = ohm({ V: 12, R1: 4, R2: 2 })
  expect(r.resistance).toBe(6); expect(r.current).toBeCloseTo(2, 5); expect(r.power).toBeCloseTo(24, 5)
})
```
```ts
export interface OhmIn { V: number; R1: number; R2: number }
export function ohm({ V, R1, R2 }: OhmIn) {
  const resistance = R1 + R2
  const current = resistance > 0 ? V / resistance : 0
  return { resistance, current, power: V * current }
}
```
- [ ] **Scene.tsx** — a rectangular wire loop (tubes), a battery block and two resistor blocks; animated emissive "current" dots traveling around the loop with speed ∝ `current` (skip motion when `!playing`); publish `{ current, resistance, power }`.
- [ ] **index.ts** params `V` (1–24 V, def 12), `R1` (1–20 Ω, def 4), `R2` (1–20 Ω, def 2); readouts `current(A), resistance(Ω), power(W)`. Register, test, commit.

### Task 8: Wave Motion (analytic)
**Files:** `src/lab/sims/waves/{physics.ts,physics.test.ts,Scene.tsx,index.ts}`; modify `registry.ts`.
- [ ] **Physics test** then impl:
```ts
import { wave, yAt } from './physics'
test('v=fλ, T=1/f, ω=2πf', () => {
  const r = wave({ A: 1, f: 2, lambda: 3 })
  expect(r.waveSpeed).toBeCloseTo(6, 5); expect(r.period).toBeCloseTo(0.5, 5); expect(r.angFreq).toBeCloseTo(2*Math.PI*2,5)
})
```
```ts
export interface WaveIn { A: number; f: number; lambda: number }
export function wave({ A, f, lambda }: WaveIn) {
  const waveSpeed = f * lambda, period = f > 0 ? 1 / f : 0
  const angFreq = 2 * Math.PI * f, k = lambda > 0 ? (2 * Math.PI) / lambda : 0
  return { waveSpeed, period, angFreq, k, A }
}
export const yAt = (i: WaveIn, x: number, t: number) => {
  const { angFreq, k } = wave(i)
  return i.A * Math.sin(k * x - angFreq * t)
}
```
- [ ] **Scene.tsx** — a row of ~120 small spheres (or a tube/line) along x; each frame advance `t` (when playing) and set each point's y via `yAt`; publish `{ waveSpeed, period, angFreq }`.
- [ ] **index.ts** params `A` (0.2–3, def 1, step 0.1), `f` (0.2–3 Hz, def 1, step 0.1), `lambda` (1–8 m, def 4, step 0.5); readouts `waveSpeed(m/s), period(s), angFreq(rad/s)`. Register, test, commit.

### Task 9: Lens Optics (analytic)
**Files:** `src/lab/sims/lens-optics/{physics.ts,physics.test.ts,Scene.tsx,index.ts}`; modify `registry.ts`.
- [ ] **Physics test** then impl:
```ts
import { lens } from './physics'
test('thin lens: d=2f gives d=2f, M=-1 (real, inverted)', () => {
  const r = lens({ focal: 1, objDist: 2 })
  expect(r.imageDist).toBeCloseTo(2, 5); expect(r.magnification).toBeCloseTo(-1, 5); expect(r.real).toBe(1)
})
```
```ts
export interface LensIn { focal: number; objDist: number }
export function lens({ focal, objDist }: LensIn) {
  const inv = 1 / focal - 1 / objDist
  const imageDist = inv !== 0 ? 1 / inv : Infinity
  const magnification = -imageDist / objDist
  const real = Number.isFinite(imageDist) && imageDist > 0 ? 1 : 0
  return { imageDist, magnification, real }
}
```
- [ ] **Scene.tsx** — an optical axis (line), a convex lens (thin ellipse/disc at x=0), an upright object arrow at `-objDist`, and an image arrow at `imageDist` (height = `magnification × object height`, flipped if negative); draw two principal rays. Static (no time animation) — recompute on param change; publish `{ imageDist, magnification, imageType: real }`. Guard `imageDist` Infinity (clamp the drawn arrow position).
- [ ] **index.ts** params `focal` (0.5–4 m, def 1.5, step 0.1), `objDist` (0.6–8 m, def 3, step 0.1); readouts `imageDist(m), magnification(×), imageType`. Register, test, commit.

---

## Task 10: Final integration — verify + screenshots

**Files:** none new (verification only); optionally extend `scripts/shoot.mjs` shot list with `/lab` and `/lab/projectile`.

- [ ] **Step 1: Full gates** — `npx tsc --noEmit` (0), `npx vitest run` (all green incl. all 6 physics suites, parity incl. lab, catalog, SimPlayer), `npm run build` (success; confirm each sim is a separate lazy chunk).
- [ ] **Step 2: Visual** — `npm run dev`; add `/lab` and `/lab/projectile` to `scripts/shoot.mjs`; `node scripts/shoot.mjs`; review screenshots (catalog grid + filters; a sim detail with canvas, sliders, HUD, transport). Confirm orbit-drag works manually.
- [ ] **Step 3: Commit** `feat(lab): Phase 2 complete — 6 sims, catalog, detail pages`.
- [ ] **Step 4: Review** — run an adversarial review pass (physics correctness, r3f lifecycle/leaks, a11y of sliders/filters, i18n parity, perf of per-sim frameloop) and fix confirmed findings.

---

## Self-review (plan vs spec)

**Spec coverage:** core types/store/format → T1; SimPlayer/Canvas/ControlPanel/ReadoutPanel → T2; lab i18n + parity → T3; registry/catalog/detail routing + 1st sim → T4; the 6 sims' physics+scenes → T4 (projectile) + T5–T9; WebGL fallback → T2 (SimCanvas); offscreen pause → T2 (`useCanvasActive`); lazy per-sim chunks → registry dynamic imports; tests (physics, registry-via-catalog, components, parity) → T1–T9; verify/build/screenshots → T10. ✅
**Placeholder scan:** physics code is complete and exact per sim; scenes are specified with concrete geometry, the publish contract, and camera. The two inline notes (drop the unused `Player` line in SimDetailPage; add `catalogTitle`/`catalogEyebrow` keys) are explicit corrections, not deferrals. No "TBD/handle edge cases".
**Type consistency:** `SimSceneProps.publish`, `SimDefinition` shape, `ParamSpec/ReadoutSpec` keys, `createReadoutStore/useThrottledReadouts`, `isBuilt/SIM_MODULES`, and `resolveLang` are used consistently across tasks. Each sim publishes exactly the readout keys declared in its `index.ts`. ✅
**Registry note:** add `catalogTitle` + `catalogEyebrow` to the shared key list and all three locales in Task 3 (used by `LabCatalog` in Task 4).

## Execution handoff
After build, spec + plan Phase 3 (Supabase auth + plan gating) separately. Run code review before declaring Phase 2 complete.
