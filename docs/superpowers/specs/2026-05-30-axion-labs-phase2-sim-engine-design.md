# Axion Labs — Phase 2 Design Spec: 3D Simulation Engine + Library

**Date:** 2026-05-30
**Status:** Approved for planning
**Depends on:** Phase 1 (foundation + landing) — design system, i18n, routing, r3f setup (`webgl.ts`, `useCanvasActive`), `SIMULATIONS` catalog data.

---

## 1. Goal

Turn the `/lab` "Coming soon" stub into a real, browsable library of **interactive 3D physics simulations**. Build a reusable simulation framework (a declarative `SimDefinition` + a generic `SimPlayer`) and implement **6 working simulations** with honest physics, presented as true 3D scenes with orbit controls. Trilingual (MN/EN/ZH). No auth/plan gating yet (Phase 3).

### Decisions (locked)
- **6 sims:** Projectile Motion, Double Pendulum, Incline & Friction, Ohm's-Law Circuit (series), Wave Motion, Lens Optics. The other 6 catalog entries render as "Coming soon" locks.
- **Hybrid physics:** closed-form where exact; **RK4 numerical integration** for the double pendulum. Each sim owns its own physics step in a pure, unit-tested module.
- **True 3D + OrbitControls** (`@react-three/drei`); 2D-natured phenomena (circuit, ray diagram) laid out on a plane within the 3D space.
- **No gating** in Phase 2 (all built sims open). The locked look is reserved for not-yet-built sims.

---

## 2. Architecture

A simulation is **data + a Scene + pure physics**. The `SimPlayer` renders controls, the HUD, and transport generically, so every sim shares one UX and adding a sim is cheap.

```
src/lab/
├─ types.ts                # ParamSpec, ReadoutSpec, SimDefinition, SimSceneProps, SimState
├─ registry.ts             # SIM_MODULES: id -> () => import(); builtIds; isBuilt(id)
├─ format.ts               # number formatting (fixed decimals, sign)
├─ useReadoutStore.ts      # mutable readouts ref + publish() + throttled subscribe()
├─ SimPlayer.tsx           # owns params state + transport; composes canvas + panels
├─ SimCanvas.tsx           # <Canvas> + OrbitControls + lights + grid; WebGL fallback; useCanvasActive
├─ ControlPanel.tsx        # one Slider per ParamSpec
├─ ReadoutPanel.tsx        # 10 Hz rAF-throttled HUD from the readout store
├─ LabCatalog.tsx          # /lab — grid of all 12 + topic/grade filters
├─ SimDetailPage.tsx       # /lab/:id — lazy-loads a SimDefinition into SimPlayer
└─ sims/
   ├─ projectile/      { physics.ts, physics.test.ts, Scene.tsx, index.ts }
   ├─ double-pendulum/ { physics.ts, physics.test.ts, Scene.tsx, index.ts }
   ├─ incline-friction/{ physics.ts, physics.test.ts, Scene.tsx, index.ts }
   ├─ ohm-circuit/     { physics.ts, physics.test.ts, Scene.tsx, index.ts }
   ├─ waves/           { physics.ts, physics.test.ts, Scene.tsx, index.ts }
   └─ lens-optics/     { physics.ts, physics.test.ts, Scene.tsx, index.ts }
src/components/ui/Slider.tsx   # new branded range-input primitive
src/i18n/locales/{mn,en,zh}/lab.json   # new 'lab' namespace
```

### 2.1 Core types (`types.ts`)
```ts
export type SimState = Record<string, number>          // current param values

export interface ParamSpec {
  key: string
  labelKey: string            // i18n key in the 'lab' namespace
  min: number; max: number; step: number; default: number
  unit?: string
}
export interface ReadoutSpec {
  key: string
  labelKey: string
  unit?: string
  decimals?: number           // default 2
}
export interface SimSceneProps {
  params: SimState
  playing: boolean
  resetKey: number            // increment to reset internal state
  publish: (values: Record<string, number>) => void   // push readouts (per frame ok)
}
export interface SimDefinition {
  id: string                  // matches a SIMULATIONS catalog id
  params: ParamSpec[]
  readouts: ReadoutSpec[]
  Scene: React.ComponentType<SimSceneProps>
  camera?: { position: [number, number, number]; fov?: number }
}
```

### 2.2 Player data flow
- `SimPlayer` initializes `params` from each `ParamSpec.default`, holds `playing` (default true) and `resetKey`.
- `ControlPanel` renders a `Slider` per param; changing a slider updates `params`.
- `SimCanvas` renders the sim's `Scene` inside a `<Canvas>` with `OrbitControls`, lights, and a ground grid. The Scene advances physics in `useFrame` (gated by `playing`) and calls `publish(readouts)` each frame.
- `useReadoutStore`: `publish` writes into a mutable ref (no React state). `ReadoutPanel` runs its own rAF loop, reading the ref and `setState` at **~10 Hz**, decoupling 60 fps physics from React renders.
- Transport: Play/Pause toggles `playing`; Reset increments `resetKey` and restores `params` to defaults.

### 2.3 Scene contract
Each `Scene` receives `{ params, playing, resetKey, publish }`. Analytic scenes derive positions from `params` + an internal clock; numerical scenes keep integrator state in refs, advance by `dt` each frame when `playing`, and re-seed when `resetKey` changes. All scenes call `publish` with the values named in their `readouts`.

---

## 3. The six simulations

All physics lives in a pure `physics.ts` per sim (no React/three imports) and is unit-tested. SI units.

1. **Projectile Motion** — *analytic.* Params: `v0` (m/s), `angle` (°), `g` (m/s²). Physics: `x=v0cosθ·t`, `y=v0sinθ·t − ½gt²`; range `R=v0²·sin2θ/g`, max height `H=(v0sinθ)²/2g`, flight time `T=2v0sinθ/g`. Readouts: range, max height, flight time, current speed. Scene: ground plane, launcher, projectile following the arc, fading trajectory trail; loops over `T`.
2. **Double Pendulum** — *RK4.* Params: `L1,L2` (m), `m1,m2` (kg), `theta1,theta2` (° initial), `g`. Physics: standard double-pendulum ODE, integrated with fixed-step RK4 (substeps per frame for stability). Readouts: `θ1`, `θ2` (°), total energy (J). Scene: two rods + bobs in 3D, fading trail of the lower bob; `resetKey` re-seeds initial angles.
3. **Incline & Friction** — *analytic.* Params: `angle` (°), `mass` (kg), `mu`. Physics: `a=g(sinθ − μcosθ)` (clamped ≥0 → static), `N=mg cosθ`, `f=μN`. Readouts: acceleration, friction force, normal force, speed. Scene: inclined ramp, sliding block, force arrows; loops (block returns to top on reset/loop).
4. **Ohm's-Law Circuit (series)** — *analytic.* Params: `V` (V), `R1`, `R2` (Ω). Physics: `R=R1+R2`, `I=V/R`, `P=VI`. Readouts: current I (A), total R (Ω), power P (W). Scene: 3D battery + two resistor blocks + wire loop; animated "current" dots whose speed ∝ I.
5. **Wave Motion** — *analytic.* Params: `A` (amplitude), `f` (Hz), `lambda` (m). Physics: `v=fλ`, `T=1/f`, `ω=2πf`, `k=2π/λ`; `y(x,t)=A·sin(kx − ωt)`. Readouts: wave speed, period, angular frequency. Scene: a line of points forming a traveling transverse wave along x.
6. **Lens Optics** — *analytic.* Params: `f` (focal length, m), `d` (object distance, m). Physics: thin lens `1/f = 1/d + 1/d'` → `d' = 1/(1/f − 1/d)`; magnification `M = −d'/d`; real if `d'>0`. Readouts: image distance d′, magnification, real/virtual (1/0). Scene: optical bench — convex lens, object arrow, image arrow, principal ray traces on a plane in 3D.

---

## 4. Catalog & routing

- **`/lab` → `LabCatalog`**: grid of all 12 `SIMULATIONS`. Filter chips for **topic** and **grade** (reuse the chip style from `CurriculumSection`). Built sims (id ∈ `builtIds`) are clickable cards linking to `/lab/:id`; the other 6 render with a "Coming soon" lock badge and are not clickable. Card shows localized name, topic `Pill`, grade, formula.
- **`/lab/:id` → `SimDetailPage`**: looks up the catalog entry + the lazy `SimDefinition`. Renders a header (localized name, description from `lab` ns, formula, "← Back to lab") and the `SimPlayer`. Unknown id, or id not in `builtIds` → render `NotFound`.
- `App.tsx`: replace the single `/lab` `ComingSoon` route with `/lab` and `/lab/:id`. Keep `/tutor /exams /pricing /login /dashboard` stubs.

`registry.ts` is the single source of truth for which sims are built: `builtIds = Object.keys(SIM_MODULES)`. `LabCatalog` and `SimDetailPage` both derive "built" from it (no duplicated flags).

---

## 5. i18n

New **`lab` namespace** in all three locales with matching keys:
- UI: `play`, `pause`, `reset`, `dragHint` ("Drag to rotate"), `comingSoon`, `filterTopic`, `filterGrade`, `allTopics`, `backToLab`, `webglRequired`, `controls`, `readouts`.
- Per-sim: `sims.<id>.desc` (one-line description) and the param/readout labels referenced by each `SimDefinition` (e.g. `param.v0`, `param.angle`, `readout.range`, …). Param/readout label keys are shared where the same quantity recurs (e.g. `param.mass`, `param.g`).

Register `lab` in `src/i18n/index.ts` (`ns: ['common','landing','lab']`, import the three files). Extend `keyparity.test.ts` to also assert parity for `lab`.

---

## 6. Performance & error handling
- Each sim module (`SimDefinition` incl. its Scene) is **lazy-loaded** via `registry.ts` dynamic import, so a sim's three.js scene code is only fetched when its detail page opens. three.js already lives in a shared lazy chunk.
- `SimCanvas` reuses `useCanvasActive` to set `frameloop` to `never` when offscreen/tab hidden; caps `dpr`.
- **WebGL/reduced-motion fallback:** if `!isWebGLAvailable()`, `SimCanvas` renders a notice panel ("3D requires WebGL") instead of `<Canvas>`; the `ControlPanel` and `ReadoutPanel` still render and analytic readouts still compute from `params`, so the page remains informative. (For the RK4 sim, readouts simply show initial-state values without animation.)
- `ReadoutPanel` updates at ~10 Hz to avoid 60 fps React churn.
- Unknown/unbuilt `/lab/:id` → `NotFound`.

---

## 7. Testing
- **Physics unit tests** (pure, no DOM) per sim: projectile range/height/time vs hand-computed values; incline `a` incl. the static clamp; Ohm `I=V/R`, `R=R1+R2`, `P`; wave `v=fλ`, `T`, `ω`; lens `d'`, magnification, sign of real/virtual; **double pendulum: total energy conserved within tolerance over N RK4 steps**.
- **Registry test:** every `builtIds` entry exists in `SIMULATIONS`; defaults lie within each param's `[min,max]`.
- **Component tests** (jsdom, Canvas gated off): `LabCatalog` renders 12 cards, topic/grade filters narrow the set, unbuilt cards aren't links; `SimPlayer` renders one slider per param and the readout labels from a small mock `SimDefinition`; `ControlPanel` slider change updates the displayed value.
- **lab key-parity** added to `keyparity.test.ts`.
- `tsc --noEmit`, `vitest run`, `vite build` all pass; Playwright screenshots of `/lab` and one sim detail.

---

## 8. Out of scope (Phase 2)
Auth, plan gating, saving/progress, the remaining 6 sims' physics, AI tutor/exam integration. The catalog shows the unbuilt 6 as locked "Coming soon" cards.

## 9. Success criteria
1. `/lab` lists all 12 sims with working topic/grade filters; 6 are openable, 6 show coming-soon.
2. Each of the 6 detail pages renders an interactive 3D scene with orbit controls, live sliders, a live HUD, and play/pause/reset.
3. Readouts match the physics formulas; double-pendulum energy stays bounded.
4. Trilingual throughout; `lab` key-parity passes.
5. Graceful WebGL-unavailable fallback.
6. `tsc`, tests, and build all green.
