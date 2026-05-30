# Axion Labs — Design Spec

**Date:** 2026-05-30
**Status:** Phase 1 approved for planning
**Origin:** Faithful, rebranded reimplementation of phycore.tech (Physics Lab Pro / PhysiCore AI).

---

## 1. Product summary

Axion Labs is a physics-learning platform for secondary students (grades 6–11). It combines:

- **Interactive 3D physics simulations** (Three.js / react-three-fiber) — adjust parameters, watch live behavior, read instantaneous values off a HUD.
- **A 24/7 AI physics tutor** — image-capable chat that explains concepts and works problems, in the student's language.
- **AI-generated adaptive exams** — 18 multiple-choice + 2 open questions per test, adaptive difficulty, instant AI grading.
- **An annual curriculum** mapped to grades 6–11.

It is **trilingual** (Mongolian default, English, Chinese), dark sci-fi "mission-control / lab HUD" aesthetic, with subscription tiers (Free / Standard / Premium + student plans, 3-day trial).

### Brand
- **Name:** Axion Labs
- **Logo:** orbital-atom motif (nucleus + three elliptical electron rings) in the plasma gradient.
- **Palette:** canvas `#070A12`, surface `#121826`; signature gradient `135deg #fb923c → #f472b6 → #a855f7` (plasma orange → pink → violet); accents amber `#fbbf24`, violet `#a855f7`; text `#E8EDF5`, muted `#94A3B8`; thin orange/violet HUD borders + faint grid.
- **Fonts:** Orbitron (display), Share Tech Mono (HUD/labels/numbers/eyebrows), Inter (body). Self-hosted via `@fontsource`.

### Tech stack (whole platform)
- React 18 + TypeScript + Vite
- Tailwind CSS (custom theme tokens) + a small set of hand-built UI primitives
- React Router (client routing)
- i18next + react-i18next (MN/EN/ZH)
- Three.js via @react-three/fiber + @react-three/drei (3D)
- Supabase (Auth + Postgres + RLS) — Phase 3
- A thin server-side LLM proxy (mock now, real key later) — Phase 4
- Vitest + React Testing Library (tests)

---

## 2. Phase decomposition

The platform is several independent subsystems. Each phase gets its own spec → plan → build cycle. They share the foundation built in Phase 1.

| Phase | Subsystem | Ships |
|---|---|---|
| **1. Foundation + Landing** | Design system, i18n, routing, marketing site | Trilingual public landing page + live 3D hero; brand + tech bedrock. |
| **2. 3D Simulation Engine** | react-three-fiber framework + library | Reusable `SimCanvas` + control panel + HUD readout; starter sims; lab catalog. |
| **3. Auth + Accounts** | Supabase Auth + Postgres + RLS | Google sign-in, profiles, progress, plan model + feature gating, pricing→checkout placeholder. |
| **4. AI Tutor + Exams** | LLM proxy + tutor chat + adaptive tests | Image-capable streaming tutor, test generation (18 MCQ + 2 open) + grading + results, lessons. |

**Build order:** foundation-first (Phase 1 establishes brand tokens, i18n infra, and routing that everything depends on).

**This spec details Phase 1.** Phases 2–4 are sketched for context only and will be specced separately.

---

## 3. Phase 1 — detailed design

### 3.1 Goal
Ship a polished, trilingual, faithful-but-rebranded marketing landing page for Axion Labs, on top of the project scaffold (design system, i18n, routing) that all later phases build on. A real animated 3D hero establishes the "3D simulation" identity immediately.

### 3.2 Architecture & units

Each unit has one clear purpose, a defined interface, and is independently understandable/testable.

```
axion-labs/
├─ index.html
├─ vite.config.ts            # Vite + React + path aliases (@/…)
├─ tailwind.config.ts        # theme tokens: colors, fonts, gradient, glow shadows
├─ postcss.config.js
├─ tsconfig.json
├─ src/
│  ├─ main.tsx               # React root, i18n init, router mount
│  ├─ App.tsx                # router + layout
│  ├─ styles/
│  │  └─ globals.css         # base, grid overlay, scrollbar, selection, font faces
│  ├─ lib/
│  │  └─ cn.ts               # className merge helper (clsx + tailwind-merge)
│  ├─ i18n/
│  │  ├─ index.ts            # i18next config (MN default, EN, ZH; fallback MN→EN)
│  │  └─ locales/
│  │     ├─ mn/{common,landing}.json
│  │     ├─ en/{common,landing}.json
│  │     └─ zh/{common,landing}.json
│  ├─ components/ui/         # primitives — pure, presentational, tested
│  │  ├─ Button.tsx          # variants: gradient | outline | ghost; sizes
│  │  ├─ GlassPanel.tsx      # frosted surface w/ orange/violet glow border
│  │  ├─ GradientText.tsx
│  │  ├─ Pill.tsx            # mono badge/tag
│  │  ├─ Readout.tsx         # mono HUD stat (label + value + unit)
│  │  ├─ SectionHeading.tsx  # eyebrow + title + subtitle
│  │  ├─ Container.tsx
│  │  └─ Logo.tsx            # SVG orbital-atom, plasma gradient, sizable
│  ├─ components/layout/
│  │  ├─ Navbar.tsx          # logo, nav links, LanguageSwitcher, Sign In + ENTER LABORATORY
│  │  ├─ Footer.tsx          # columns, language switcher, © 2026 Axion Labs
│  │  └─ LanguageSwitcher.tsx
│  ├─ three/
│  │  ├─ HeroScene.tsx       # r3f canvas: orbital-atom / particle field, parallax
│  │  ├─ MiniSimTeaser.tsx   # small live canvas used in the showcase section
│  │  └─ webgl.ts            # WebGL-support detection + reduced-motion check
│  ├─ features/landing/
│  │  ├─ LandingPage.tsx     # composes the sections in order
│  │  └─ sections/
│  │     ├─ Hero.tsx
│  │     ├─ StatsBand.tsx
│  │     ├─ Pillars.tsx
│  │     ├─ SimShowcase.tsx
│  │     ├─ TutorSection.tsx
│  │     ├─ ExamsSection.tsx
│  │     ├─ CurriculumSection.tsx
│  │     ├─ Pricing.tsx
│  │     └─ CtaBand.tsx
│  ├─ routes/
│  │  ├─ ComingSoon.tsx      # in-theme stub for /lab, /tutor, /exams, /pricing, /login, /dashboard
│  │  └─ NotFound.tsx        # themed 404
│  └─ data/
│     ├─ simulations.ts      # catalog metadata (id, i18n key, topic, grade, accent)
│     ├─ pricing.ts          # plan tiers + features
│     └─ curriculum.ts       # grades 6–11 → topics
└─ docs/superpowers/specs/…
```

### 3.3 Design system / tokens
- **Tailwind theme extension:** `colors` (bg, surface, surface-2, orange, pink, violet, amber, text, muted, line), `fontFamily` (display=Orbitron, mono="Share Tech Mono", sans=Inter), `backgroundImage.axion` (the 135° gradient), `boxShadow` (glow-orange, glow-violet), `borderColor` HUD lines.
- **globals.css:** dark canvas background, fixed faint grid overlay, custom scrollbar, gradient text selection, `@fontsource` imports, `prefers-reduced-motion` utility.
- **UI primitives** are pure/presentational and each has a render test. `Button` exposes `variant`, `size`, `as` (anchor/button/Link). `cn()` merges classes safely.

### 3.4 i18n
- `i18next` + `react-i18next`; **MN is default and fallback root**, then EN; ZH third. Namespaces: `common`, `landing`.
- `LanguageSwitcher` toggles МН / EN / 中 and persists choice (localStorage). `<html lang>` updates on change.
- **Key-parity invariant:** a Vitest test asserts the key sets of `mn`, `en`, `zh` are identical per namespace (catches missing translations).

### 3.5 Routing / app shell
- React Router. `/` → `LandingPage`. Stubs (themed `ComingSoon`): `/lab`, `/tutor`, `/exams`, `/pricing`, `/login`, `/dashboard`. `*` → `NotFound`. Navbar + Footer wrap all routes. Dark theme only in Phase 1 (light theme deferred).

### 3.6 Landing sections (order + content)
All copy lives in `locales/*/landing.json`; values below are the English reference.

1. **Navbar** — Logo "Axion Labs"; links: Лаборатори/Lab, AI багш/AI Tutor, Шалгалт/Exams, Үнэ/Pricing; LanguageSwitcher; *Sign In*; gradient **ENTER LABORATORY**. Sticky, blurs on scroll.
2. **Hero** — full-viewport; `HeroScene` 3D background; mono eyebrow `AXION LABS // PHYSICS SIMULATION ENGINE`; Orbitron gradient headline *"Every tool you need to master physics — in one place"*; subtext; CTAs **ENTER LABORATORY** + *Continue with Google*; trust line *"Annual curriculum · Grades 6–11"*; 2–3 floating mono `Readout` chips (e.g. velocity, force, energy).
3. **StatsBand** — mono readouts: 30+ simulations · Grades 6–11 · 3 languages · 24/7 AI tutor.
4. **Pillars** — three `GlassPanel` cards: Interactive 3D Simulations ("Conduct interactive physics experiments") · Tests & Exercises ("Check your knowledge with tests and exercises") · AI Adaptive Learning ("A 24/7 AI-powered physics teaching assistant").
5. **SimShowcase** — gallery of sim cards (friction/incline, double-pendulum, circuit/Ohm, optics, waves, momentum) with topic + grade tags; **one live `MiniSimTeaser` canvas**; *Explore the lab* CTA → `/lab`.
6. **TutorSection** — static chat-mockup UI (user asks a physics question w/ image thumb; tutor replies with steps + KaTeX-style formula); "Your 24/7 physics tutor, in your language."
7. **ExamsSection** — "AI generates 18 multiple-choice + 2 open questions, adaptive difficulty, instant AI grading"; sample question card + score ring visual.
8. **CurriculumSection** — grade chips 6 · 7 · 8 · 9 · 10 · 11; selecting one reveals that grade's topic list (static data).
9. **Pricing** — three tiers from `data/pricing.ts`: **Free ₮0**, **Standard ₮100,000/yr**, **Premium ₮249,999/yr**; student plans note (6-mo ₮49,999 / 1-yr ₮89,999) + **3-day free trial**; "Most popular" highlight on Standard; gradient CTA per card → `/login`.
10. **CtaBand** — large gradient call to action → **ENTER LABORATORY**.
11. **Footer** — Logo; columns (Product / Company / Resources / Legal); LanguageSwitcher; social icons; `© 2026 Axion Labs`.

### 3.7 Signature 3D hero
- `HeroScene` (r3f): a GPU particle field arranged as an orbital atom / wireframe globe with orbiting electrons; slow auto-rotate + subtle mouse-parallax; plasma-emissive (orange→violet) points; bloom optional/cheap.
- **Performance:** Three + the scene are **lazy-loaded** (`React.lazy` + dynamic import) so they don't block first paint; `<Suspense>` shows the static gradient. Animation **pauses when offscreen** (IntersectionObserver) and caps DPR.
- **Fallbacks:** `webgl.ts` detects WebGL support; if unsupported **or** `prefers-reduced-motion`, render a static CSS gradient + SVG orbital backdrop instead of the canvas.

### 3.8 Error handling
- 3D: WebGL-unsupported / reduced-motion → static fallback (above). Canvas error boundary → fallback, never a blank hero.
- i18n: missing key → MN → EN fallback; never shows raw keys.
- Routing: unknown path → themed `NotFound` with a link home.

### 3.9 Testing
- **Vitest + React Testing Library.** Render tests for each UI primitive (variants render expected classes/markup) and each landing section (renders heading + key CTAs, no crashes).
- **Locale key-parity test** (mn/en/zh identical key sets per namespace).
- **WebGL fallback test:** when detection returns false, `Hero` renders the static fallback, not the canvas.
- **a11y checks:** sections use semantic landmarks/headings; images have alt text; interactive elements keyboard-reachable; reduced-motion respected.
- Build must pass `tsc --noEmit` and `vite build`.

### 3.10 Out of scope for Phase 1 (deferred)
Real authentication, database, payments, working simulation physics beyond the single decorative teaser, real AI calls, light theme, and additional locales. These are Phases 2–4. Routes for them exist as themed stubs.

---

## 4. Success criteria (Phase 1)
1. `npm run dev` serves a landing page that visually reads as a faithful, rebranded Axion Labs at all breakpoints (mobile → desktop).
2. Language switcher cycles MN/EN/ZH; all visible copy translates; no raw keys.
3. The 3D hero animates on WebGL devices and degrades gracefully otherwise (and under reduced-motion).
4. All landing sections present, in order, matching §3.6.
5. `npm test`, `tsc --noEmit`, and `vite build` all pass.
6. Stub routes + themed 404 reachable from the nav/footer.
