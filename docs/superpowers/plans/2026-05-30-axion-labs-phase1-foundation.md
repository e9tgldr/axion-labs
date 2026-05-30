# Axion Labs — Phase 1 (Foundation + Landing) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Apply the **frontend-design** skill for all visual components and **test-driven-development** for logic.

**Goal:** Ship a polished, trilingual (MN/EN/ZH), rebranded "Axion Labs" marketing landing page with a live 3D hero, on top of a reusable design-system + i18n + routing scaffold.

**Architecture:** Vite + React 18 + TypeScript SPA. Tailwind provides brand tokens; a small set of hand-built, tested UI primitives compose into layout (Navbar/Footer) and 9 landing sections. i18next (MN default) drives all copy. Three.js via @react-three/fiber renders a lazy-loaded, gracefully-degrading 3D hero. React Router serves `/` plus themed stubs for later phases.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS 3, react-router-dom 6, i18next + react-i18next, @react-three/fiber + @react-three/drei + three, @fontsource (Orbitron / Share Tech Mono / Inter), Vitest + @testing-library/react + jsdom, clsx + tailwind-merge.

**Working directory:** `C:\Users\enkh\axion-labs` (git repo already initialized; the spec is committed).

**Reference palette:** canvas `#070A12`, surface `#121826`, surface-2 `#0E1320`, line `#1E2A3F`; gradient `135deg #fb923c → #f472b6 → #a855f7`; orange `#fb923c`, pink `#f472b6`, violet `#a855f7`, amber `#fbbf24`; text `#E8EDF5`, muted `#94A3B8`.

---

## File structure (created across tasks)

```
axion-labs/
├─ index.html                         T1
├─ package.json / vite.config.ts / tsconfig*.json / tailwind.config.ts / postcss.config.js / vitest.setup.ts   T1
├─ src/
│  ├─ main.tsx  App.tsx               T1 (stub) → T6 (wired)
│  ├─ styles/globals.css              T2
│  ├─ lib/cn.ts                       T2
│  ├─ components/ui/{Button,GlassPanel,GradientText,Pill,Readout,SectionHeading,Container,Logo}.tsx + tests  T3
│  ├─ i18n/index.ts                   T4
│  ├─ i18n/locales/{mn,en,zh}/{common,landing}.json   T4
│  ├─ components/layout/{Navbar,Footer,LanguageSwitcher}.tsx   T5
│  ├─ routes/{ComingSoon,NotFound}.tsx                T5
│  ├─ three/{webgl.ts,HeroScene.tsx,MiniSimTeaser.tsx}   T6 hero / T7 teaser
│  ├─ data/{simulations,pricing,curriculum}.ts        T7
│  └─ features/landing/{LandingPage.tsx, sections/*.tsx}  T7
```

---

## Task 1: Project scaffold + tooling

**Files:** Create `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`, `vitest.setup.ts`, `src/main.tsx`, `src/App.tsx`, `src/vite-env.d.ts`.

- [ ] **Step 1: Scaffold with Vite (non-interactive) and install deps**

Run from `C:\Users\enkh\axion-labs` (the dir already exists with docs/ + .gitignore; scaffold in place):
```powershell
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom i18next react-i18next i18next-browser-languagedetector three @react-three/fiber @react-three/drei clsx tailwind-merge @fontsource/orbitron @fontsource/share-tech-mono @fontsource/inter
npm install -D tailwindcss@3 postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/three
```
If `npm create vite` complains the directory is not empty, choose "Ignore files and continue".

- [ ] **Step 2: Configure Tailwind** — create `postcss.config.js`:
```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

- [ ] **Step 3: `vite.config.ts`** with path alias + vitest config:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: { globals: true, environment: 'jsdom', setupFiles: './vitest.setup.ts' },
})
```

- [ ] **Step 4: `vitest.setup.ts`:**
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 5: tsconfig path alias** — ensure `tsconfig.json` `compilerOptions` includes:
```jsonc
"baseUrl": ".",
"paths": { "@/*": ["src/*"] },
"types": ["vitest/globals", "@testing-library/jest-dom"]
```

- [ ] **Step 6: `package.json` scripts** — ensure:
```jsonc
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc --noEmit"
}
```

- [ ] **Step 7: `index.html`** — set title + lang + favicon (reuse phycore's orbital SVG recolored to plasma):
```html
<!doctype html>
<html lang="mn">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><radialGradient id='g' cx='50%25' cy='50%25' r='50%25'><stop offset='0%25' stop-color='%23fbbf24'/><stop offset='100%25' stop-color='%23a855f7'/></radialGradient></defs><circle cx='50' cy='50' r='16' fill='url(%23g)'/><ellipse cx='50' cy='50' rx='42' ry='14' fill='none' stroke='%23fb923c' stroke-width='5' opacity='0.9'/><ellipse cx='50' cy='50' rx='42' ry='14' fill='none' stroke='%23f472b6' stroke-width='4' opacity='0.6' transform='rotate(60 50 50)'/><ellipse cx='50' cy='50' rx='42' ry='14' fill='none' stroke='%23a855f7' stroke-width='3' opacity='0.6' transform='rotate(120 50 50)'/></svg>" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Axion Labs — Physics, simulated</title>
  </head>
  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>
</html>
```

- [ ] **Step 8: minimal `src/App.tsx` + `src/main.tsx` stubs** so dev server runs (replaced in T6):
```tsx
// src/App.tsx
export default function App() { return <div className="text-text">Axion Labs</div> }
```
```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/globals.css'
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
```
(`globals.css` is created in T2; create an empty file now so the import resolves.)

- [ ] **Step 9: Verify** — `npm run dev` boots without errors; `npm run build` placeholder passes after T2. Then **commit**:
```powershell
git add -A; git commit -m "chore: scaffold Vite+React+TS+Tailwind+Vitest"
```

---

## Task 2: Design tokens (Tailwind theme + global CSS + cn helper)

**Files:** Create `tailwind.config.ts`, `src/styles/globals.css`, `src/lib/cn.ts`.

- [ ] **Step 1: `src/lib/cn.ts`** (test first)

Test `src/lib/cn.test.ts`:
```ts
import { cn } from './cn'
test('merges and dedupes tailwind classes', () => {
  expect(cn('p-2', 'p-4')).toBe('p-4')
  expect(cn('text-text', false && 'hidden', 'font-mono')).toBe('text-text font-mono')
})
```
Run `npm test -- cn` → FAIL (module missing). Implement:
```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))
```
Run `npm test -- cn` → PASS.

- [ ] **Step 2: `tailwind.config.ts`** — brand tokens:
```ts
import type { Config } from 'tailwindcss'
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#070A12', surface: '#121826', 'surface-2': '#0E1320', line: '#1E2A3F',
        orange: '#fb923c', pink: '#f472b6', violet: '#a855f7', amber: '#fbbf24',
        text: '#E8EDF5', muted: '#94A3B8',
      },
      fontFamily: {
        display: ['Orbitron', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        axion: 'linear-gradient(135deg, #fb923c 0%, #f472b6 50%, #a855f7 100%)',
        'axion-soft': 'linear-gradient(135deg, rgba(251,146,60,.15), rgba(168,85,247,.15))',
        grid: 'linear-gradient(#1E2A3F 1px, transparent 1px), linear-gradient(90deg, #1E2A3F 1px, transparent 1px)',
      },
      boxShadow: {
        'glow-orange': '0 0 40px -8px rgba(251,146,60,.5)',
        'glow-violet': '0 0 40px -8px rgba(168,85,247,.5)',
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      animation: { 'fade-up': 'fade-up .6s ease-out both', float: 'float 6s ease-in-out infinite' },
    },
  },
  plugins: [],
} satisfies Config
```

- [ ] **Step 3: `src/styles/globals.css`** — fonts, base, grid overlay, scrollbar:
```css
@import '@fontsource/orbitron/400.css';
@import '@fontsource/orbitron/700.css';
@import '@fontsource/orbitron/900.css';
@import '@fontsource/share-tech-mono/400.css';
@import '@fontsource/inter/400.css';
@import '@fontsource/inter/500.css';
@import '@fontsource/inter/600.css';
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html { scroll-behavior: smooth; }
  body { @apply bg-bg text-text font-sans antialiased; }
  ::selection { background: rgba(168,85,247,.35); }
  ::-webkit-scrollbar { width: 10px; }
  ::-webkit-scrollbar-track { background: #0E1320; }
  ::-webkit-scrollbar-thumb { background: #1E2A3F; border-radius: 8px; }
}
@layer utilities {
  .grid-overlay { background-image: theme('backgroundImage.grid'); background-size: 56px 56px; }
  .text-gradient { @apply bg-axion bg-clip-text text-transparent; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
}
```

- [ ] **Step 4: Verify + commit** — `npm run build` passes; `npm run dev` shows dark bg.
```powershell
git add -A; git commit -m "feat: design tokens (tailwind theme, fonts, global css, cn helper)"
```

---

## Task 3: UI primitives (TDD)

**Files:** Create under `src/components/ui/`: `Container.tsx`, `GradientText.tsx`, `Pill.tsx`, `Readout.tsx`, `SectionHeading.tsx`, `GlassPanel.tsx`, `Button.tsx`, `Logo.tsx` — each with a `.test.tsx`.

General pattern per primitive: write render test → run (FAIL) → implement → run (PASS). Commit once at end of task.

- [ ] **Step 1: `Container.tsx`** — `<div className={cn('mx-auto w-full max-w-6xl px-5 sm:px-8', className)}>`. Test: renders children.

- [ ] **Step 2: `GradientText.tsx`** — `<span className={cn('text-gradient', className)}>`. Test: child text present, has class `text-gradient`.

- [ ] **Step 3: `Pill.tsx`** — mono uppercase tag: `cn('inline-flex items-center gap-1.5 rounded-full border border-line bg-surface/60 px-3 py-1 font-mono text-xs uppercase tracking-widest text-muted', className)`. Test: renders label.

- [ ] **Step 4: `Readout.tsx`** — props `{label, value, unit?}`. Mono HUD stat:
```tsx
export function Readout({ label, value, unit, className }: { label: string; value: string; unit?: string; className?: string }) {
  return (
    <div className={cn('rounded-lg border border-line bg-surface/60 px-4 py-3 font-mono', className)}>
      <div className="text-[10px] uppercase tracking-widest text-muted">{label}</div>
      <div className="text-lg text-text">{value}<span className="ml-1 text-orange">{unit}</span></div>
    </div>
  )
}
```
Test: shows label, value, unit.

- [ ] **Step 5: `SectionHeading.tsx`** — props `{eyebrow?, title, subtitle?, align?}`. Eyebrow uses `Pill`, title `font-display text-3xl sm:text-4xl font-bold`, subtitle `text-muted`. Test: renders title + subtitle.

- [ ] **Step 6: `GlassPanel.tsx`** — frosted card:
```tsx
export function GlassPanel({ className, children, glow }: { className?: string; children: React.ReactNode; glow?: 'orange' | 'violet' }) {
  return <div className={cn('rounded-2xl border border-line bg-surface/50 backdrop-blur-sm p-6', glow === 'orange' && 'shadow-glow-orange', glow === 'violet' && 'shadow-glow-violet', className)}>{children}</div>
}
```
Test: renders children; glow="violet" adds `shadow-glow-violet`.

- [ ] **Step 7: `Button.tsx`** — polymorphic (button | a | RouterLink) with variants:
```tsx
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'
type Variant = 'gradient' | 'outline' | 'ghost'; type Size = 'sm' | 'md' | 'lg'
const base = 'inline-flex items-center justify-center gap-2 rounded-xl font-mono uppercase tracking-wider transition-all disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet'
const variants: Record<Variant,string> = {
  gradient: 'bg-axion text-bg font-semibold hover:shadow-glow-orange hover:brightness-110',
  outline: 'border border-line text-text hover:border-violet hover:text-violet',
  ghost: 'text-muted hover:text-text',
}
const sizes: Record<Size,string> = { sm: 'h-9 px-4 text-xs', md: 'h-11 px-6 text-sm', lg: 'h-14 px-8 text-base' }
export function Button({ variant='gradient', size='md', to, href, className, children, ...rest }:
  { variant?: Variant; size?: Size; to?: string; href?: string; className?: string; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const cls = cn(base, variants[variant], sizes[size], className)
  if (to) return <Link to={to} className={cls}>{children}</Link>
  if (href) return <a href={href} className={cls}>{children}</a>
  return <button className={cls} {...rest}>{children}</button>
}
```
Test (wrap in `<MemoryRouter>` when `to` is used): gradient variant renders `<button>` with class `bg-axion`; `to="/x"` renders an anchor with href `/x`.

- [ ] **Step 8: `Logo.tsx`** — SVG orbital atom, plasma gradient, prop `{size?, withWordmark?}`. Nucleus circle + 3 rotated ellipses (stroke orange/pink/violet), optional "AXION LABS" wordmark in `font-display`. Test: renders an `<svg>`; with `withWordmark` shows text "Axion".

- [ ] **Step 9: Run all primitive tests → PASS; commit:**
```powershell
git add -A; git commit -m "feat(ui): primitives — Button, GlassPanel, GradientText, Pill, Readout, SectionHeading, Container, Logo"
```

---

## Task 4: i18n (MN default, EN, ZH) + locale data + key-parity test

**Files:** Create `src/i18n/index.ts`, `src/i18n/locales/{mn,en,zh}/common.json`, `.../{mn,en,zh}/landing.json`, `src/i18n/keyparity.test.ts`.

- [ ] **Step 1: `src/i18n/index.ts`:**
```ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import mnCommon from './locales/mn/common.json'; import mnLanding from './locales/mn/landing.json'
import enCommon from './locales/en/common.json'; import enLanding from './locales/en/landing.json'
import zhCommon from './locales/zh/common.json'; import zhLanding from './locales/zh/landing.json'
export const LANGS = ['mn', 'en', 'zh'] as const
i18n.use(LanguageDetector).use(initReactI18next).init({
  resources: {
    mn: { common: mnCommon, landing: mnLanding },
    en: { common: enCommon, landing: enLanding },
    zh: { common: zhCommon, landing: zhLanding },
  },
  fallbackLng: ['mn', 'en'], supportedLngs: LANGS, defaultNS: 'landing', ns: ['common', 'landing'],
  detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  interpolation: { escapeValue: false },
})
i18n.on('languageChanged', (lng) => { document.documentElement.lang = lng })
export default i18n
```

- [ ] **Step 2: Author the three `landing.json` files** with identical key sets. Canonical key tree (EN reference values — translate for MN/ZH):
```jsonc
{
  "nav": { "lab": "Lab", "tutor": "AI Tutor", "exams": "Exams", "pricing": "Pricing", "signIn": "Sign In", "enter": "Enter Laboratory" },
  "hero": { "eyebrow": "AXION LABS // PHYSICS SIMULATION ENGINE",
    "title": "Every tool you need to master physics — in one place",
    "subtitle": "Interactive 3D simulations, a 24/7 AI tutor, and adaptive exams. The whole physics laboratory, in your browser.",
    "ctaPrimary": "Enter Laboratory", "ctaGoogle": "Continue with Google",
    "trust": "Annual curriculum · Grades 6–11",
    "r1l": "VELOCITY", "r1v": "9.8", "r1u": "m/s", "r2l": "FORCE", "r2v": "42", "r2u": "N", "r3l": "ENERGY", "r3v": "120", "r3u": "J" },
  "stats": { "sims": "30+ simulations", "grades": "Grades 6–11", "langs": "3 languages", "ai": "24/7 AI tutor" },
  "pillars": { "title": "All the tools you need to learn physics in one place", "eyebrow": "Platform",
    "sim": { "t": "Interactive 3D Simulations", "d": "Conduct interactive physics experiments and adjust every parameter in real time." },
    "test": { "t": "Tests & Exercises", "d": "Check your knowledge with tests and exercises graded instantly." },
    "ai": { "t": "AI Adaptive Learning", "d": "A 24/7 AI-powered physics teaching assistant that adapts to you." } },
  "showcase": { "eyebrow": "The Lab", "title": "Dozens of simulations across every topic", "cta": "Explore the lab" },
  "tutor": { "eyebrow": "AI Tutor", "title": "Your 24/7 physics tutor, in your language",
    "subtitle": "Ask anything — even send a photo of a problem. Step-by-step explanations with formulas.",
    "userMsg": "Why does a ball on an incline accelerate more slowly than in free fall?",
    "botMsg": "On an incline only the component of gravity along the slope acts: a = g·sinθ. Since sinθ ≤ 1, the acceleration is smaller than g.",
    "placeholder": "Ask a physics question…", "followup": "Ask follow-up", "withImage": "AI physics tutor — you can also send images" },
  "exams": { "eyebrow": "Adaptive Exams", "title": "AI generates a fresh exam every time",
    "subtitle": "18 multiple-choice + 2 open questions, adaptive difficulty, instant AI grading.",
    "q": "A body falls freely for 3 s. What is its speed? (g = 9.8 m/s²)", "scoreLabel": "AI score" },
  "curriculum": { "eyebrow": "Curriculum", "title": "Annual physics curriculum for grades 6–11", "gradeLabel": "Grade" },
  "pricing": { "eyebrow": "Pricing", "title": "Start free, upgrade when you’re ready", "perYear": "/ year", "trial": "3-day free trial",
    "student": "Student plans: 6 months ₮49,999 · 1 year ₮89,999", "mostPopular": "Most popular", "choose": "Choose plan",
    "free": { "n": "Free", "p": "₮0" }, "standard": { "n": "Standard", "p": "₮100,000" }, "premium": { "n": "Premium", "p": "₮249,999" } },
  "cta": { "title": "Ready to step into the laboratory?", "subtitle": "Create your account and start your 3-day free trial.", "button": "Enter Laboratory" },
  "footer": { "tagline": "Physics, simulated.", "product": "Product", "company": "Company", "resources": "Resources", "legal": "Legal", "rights": "© 2026 Axion Labs. All rights reserved." },
  "comingSoon": { "title": "Coming soon", "body": "This area unlocks in a later phase. Head back to the landing page.", "back": "Back to home" },
  "notFound": { "title": "Lost in space", "body": "This page drifted out of orbit.", "back": "Back to home" }
}
```
MN values (default language) — translate the above; e.g. `nav.enter` = "ЛАБОРАТОРИД НЭВТРЭХ", `hero.title` = "Физик эзэмшихэд хэрэгтэй бүх хэрэгсэл — нэг дор", `pillars.ai.d` = "24/7 ажилладаг AI туслах багш", `pricing.perYear` = "/ жил", `footer.rights` = "© 2026 Axion Labs. Бүх эрх хуулиар хамгаалагдсан." ZH values — `nav.enter` = "进入实验室", `pricing.perYear` = "/ 年", `footer.rights` = "© 2026 Axion Labs。版权所有。", etc. (Pull authentic MN/ZH strings from the harvested phycore copy where equivalents exist.)

- [ ] **Step 3: `common.json`** per locale — `{ "lang": { "mn": "Монгол", "en": "English", "zh": "中文" } }` (same in all three; values stay in their own script).

- [ ] **Step 4: Key-parity test `src/i18n/keyparity.test.ts`:**
```ts
import { LANGS } from './index'
const flat = (o: any, p = ''): string[] => Object.entries(o).flatMap(([k, v]) =>
  v && typeof v === 'object' ? flat(v, `${p}${k}.`) : [`${p}${k}`])
test.each(['common', 'landing'])('locales share identical %s keys', async (ns) => {
  const sets = await Promise.all(LANGS.map(async (l) => new Set(flat((await import(`./locales/${l}/${ns}.json`)).default))))
  const base = sets[0]
  sets.forEach((s) => { expect([...s].sort()).toEqual([...base].sort()) })
})
```
Run `npm test -- keyparity` → PASS (fix any mismatched keys until green).

- [ ] **Step 5: Commit:**
```powershell
git add -A; git commit -m "feat(i18n): trilingual setup (MN default/EN/ZH) + locale files + key-parity test"
```

---

## Task 5: App shell — layout, language switcher, route stubs

**Files:** Create `src/components/layout/{LanguageSwitcher,Navbar,Footer}.tsx`, `src/routes/{ComingSoon,NotFound}.tsx`.

- [ ] **Step 1: `LanguageSwitcher.tsx`** — segmented МН/EN/中 control bound to `i18n.changeLanguage`; active item gets `text-gradient`/border. Test: renders 3 buttons; clicking "EN" calls changeLanguage('en') (mock `useTranslation`).

- [ ] **Step 2: `Navbar.tsx`** — sticky, `backdrop-blur` + `border-b border-line` when scrolled (track via scroll listener). Left: `<Logo withWordmark>`. Center (md+): nav links to `/lab /tutor /exams /pricing` using `t('nav.*')`. Right: `LanguageSwitcher`, ghost `Button` Sign In → `/login`, gradient `Button` `t('nav.enter')` → `/login`. Mobile: hamburger toggles a panel. Test: renders wordmark + an "Enter" CTA.

- [ ] **Step 3: `Footer.tsx`** — `<Logo>` + tagline; four columns (Product/Company/Resources/Legal) of links (anchors `#`); `LanguageSwitcher`; `t('footer.rights')`. Test: renders rights text.

- [ ] **Step 4: `ComingSoon.tsx`** — centered themed panel using `SectionHeading` (`t('comingSoon.*')`) + `Button` back to `/`. Reads route name from `useLocation` for the eyebrow. Test: renders title.

- [ ] **Step 5: `NotFound.tsx`** — themed 404 with `t('notFound.*')` + back button. Test: renders title.

- [ ] **Step 6: Commit:**
```powershell
git add -A; git commit -m "feat(layout): navbar, footer, language switcher, route stubs (coming-soon, 404)"
```

---

## Task 6: 3D hero + wire router/app shell

**Files:** Create `src/three/webgl.ts`, `src/three/HeroScene.tsx`; rewrite `src/App.tsx`, `src/main.tsx`.

- [ ] **Step 1: `webgl.ts`** (TDD):
```ts
export function isWebGLAvailable(): boolean {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))) }
  catch { return false }
}
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}
export const heroEnabled = () => isWebGLAvailable() && !prefersReducedMotion()
```
Test: in jsdom (no WebGL) `isWebGLAvailable()` is false; mock matchMedia → `prefersReducedMotion()` true.

- [ ] **Step 2: `HeroScene.tsx`** — `@react-three/fiber` `<Canvas>` (dpr capped `[1,1.8]`, `frameloop` pauses offscreen via `useInView` from drei or IntersectionObserver). Content: a points cloud (~2500 particles) on a sphere shell + 3 orbiting electron rings (`<Line>`/torus), slow `useFrame` rotation, mouse-parallax via group rotation lerp toward pointer. Plasma colors via vertex colors (orange→violet by latitude). Export `default function HeroScene`. (No unit test for the GL scene; covered by the fallback test in T7.)

- [ ] **Step 3: Rewrite `src/main.tsx`** to init i18n + Router:
```tsx
import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './i18n'
import './styles/globals.css'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><BrowserRouter><Suspense fallback={null}><App /></Suspense></BrowserRouter></React.StrictMode>
)
```

- [ ] **Step 4: Rewrite `src/App.tsx`** — layout + routes:
```tsx
import { Routes, Route } from 'react-router-dom'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import LandingPage from '@/features/landing/LandingPage'
import { ComingSoon } from '@/routes/ComingSoon'
import { NotFound } from '@/routes/NotFound'
export default function App() {
  return (
    <div className="min-h-screen bg-bg text-text">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          {['/lab','/tutor','/exams','/pricing','/login','/dashboard'].map((p) => <Route key={p} path={p} element={<ComingSoon />} />)}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
```
(`LandingPage` is created in T7; create a one-line stub now returning `<div/>` so the build passes, replaced in T7.)

- [ ] **Step 5: Verify + commit** — `npm run dev` shows navbar + footer; `npm test` green; `npm run build` passes.
```powershell
git add -A; git commit -m "feat(3d): hero scene + webgl detection; wire router and app shell"
```

---

## Task 7: Landing data + sections + final integration

**Files:** Create `src/data/{simulations,pricing,curriculum}.ts`, `src/three/MiniSimTeaser.tsx`, `src/features/landing/LandingPage.tsx`, and `src/features/landing/sections/{Hero,StatsBand,Pillars,SimShowcase,TutorSection,ExamsSection,CurriculumSection,Pricing,CtaBand}.tsx`.

- [ ] **Step 1: `data/simulations.ts`** — array of `{ id, titleKey?, topic, grade, accent }`. Topics from phycore: friction/incline, double-pendulum, ohm-circuit, ampere-force, lens-optics, waves, momentum, centripetal, capacitor, buoyancy, doppler. Use `{ id:'double-pendulum', name:'Double Pendulum', topic:'Mechanics', grade:11, accent:'violet' }` etc. (name shown directly; topic labels via simple inline strings ok for Phase 1).

- [ ] **Step 2: `data/pricing.ts`** — tiers driven by i18n keys:
```ts
export const PLANS = [
  { id:'free', priceKey:'pricing.free.p', nameKey:'pricing.free.n', featureKeys:['feat.simsLimited','feat.aiLimited','feat.testsBasic'], highlight:false },
  { id:'standard', priceKey:'pricing.standard.p', nameKey:'pricing.standard.n', featureKeys:['feat.simsAll','feat.aiTeacher','feat.testsAi'], highlight:true },
  { id:'premium', priceKey:'pricing.premium.p', nameKey:'pricing.premium.n', featureKeys:['feat.everything','feat.aiUnlimited','feat.priority'], highlight:false },
] as const
```
Add the `feat.*` keys to all three `landing.json` files (and re-run key-parity test). EN examples: `feat.simsLimited`="Limited simulations", `feat.simsAll`="All 30+ simulations", `feat.aiTeacher`="AI tutor", `feat.aiUnlimited`="Unlimited AI tutor", `feat.testsAi`="AI-generated tests", `feat.everything`="Everything in Standard", `feat.priority`="Priority support", `feat.testsBasic`="Basic tests", `feat.aiLimited`="Limited AI tutor".

- [ ] **Step 3: `data/curriculum.ts`** — `{ [grade:6..11]: string[] }` topic lists (e.g. grade 6: ["Measurement","Density","Forces"]; grade 11: ["Electromagnetism","Optics","Atomic & nuclear"]). Plain strings for Phase 1.

- [ ] **Step 4: `MiniSimTeaser.tsx`** — small r3f canvas: a single orbiting body / pendulum bob, looping; same fallback rule as hero (static SVG when `!heroEnabled()`).

- [ ] **Step 5: Build the 9 sections.** Each is a self-contained component using `Container`, `SectionHeading`, primitives, and `useTranslation('landing')`. Apply the **frontend-design** skill: generous spacing, `animate-fade-up` on scroll, glass panels, gradient accents, mono HUD labels, responsive grids. Content/copy is the i18n keys authored in T4. Specifics:
  - **Hero.tsx** — full-height; if `heroEnabled()` render `<Suspense fallback={<StaticHero/>}><HeroScene/></Suspense>` absolutely positioned behind content, else `<StaticHero/>` (CSS radial plasma gradient + faint `grid-overlay` + SVG orbital). Foreground: `Pill` eyebrow, `GradientText` h1 (`font-display`), subtitle, two `Button`s (gradient `nav.enter` → `/login`, outline `hero.ctaGoogle`), trust line, and 2–3 floating `Readout` chips (`hero.r*`).
  - **StatsBand.tsx** — 4 `Readout`/mono items in a bordered band.
  - **Pillars.tsx** — `SectionHeading` + 3 `GlassPanel` cards (icon, `pillars.*.t`, `pillars.*.d`); hover glow.
  - **SimShowcase.tsx** — `SectionHeading` + responsive grid of sim cards from `data/simulations.ts` (name, topic tag `Pill`, grade), with one `MiniSimTeaser` featured; `Button` `showcase.cta` → `/lab`.
  - **TutorSection.tsx** — two-column: copy + a static chat mock (`GlassPanel`: user bubble with image thumb pill `tutor.withImage`, bot bubble `tutor.botMsg`, disabled input `tutor.placeholder` + `tutor.followup`).
  - **ExamsSection.tsx** — copy + a sample MCQ card (`exams.q`, four options A–D) + a circular `AI score` ring (SVG) labeled `exams.scoreLabel`.
  - **CurriculumSection.tsx** — grade chips 6–11 (`useState` selected, default 9) → topic list from `data/curriculum.ts`; selected chip gets gradient.
  - **Pricing.tsx** — 3 `GlassPanel` cards from `PLANS`; highlighted card has `glow="violet"` + `mostPopular` badge + scale; price `GradientText`, `pricing.perYear`, feature list with check icons, `Button` `pricing.choose` → `/login`; footnotes `pricing.student` + `pricing.trial`.
  - **CtaBand.tsx** — full-width `bg-axion-soft` panel, centered `cta.title/subtitle` + gradient `Button` → `/login`.

- [ ] **Step 6: `LandingPage.tsx`** — compose in order:
```tsx
import { Hero } from './sections/Hero'; import { StatsBand } from './sections/StatsBand'
import { Pillars } from './sections/Pillars'; import { SimShowcase } from './sections/SimShowcase'
import { TutorSection } from './sections/TutorSection'; import { ExamsSection } from './sections/ExamsSection'
import { CurriculumSection } from './sections/CurriculumSection'; import { Pricing } from './sections/Pricing'
import { CtaBand } from './sections/CtaBand'
export default function LandingPage() {
  return (<>
    <Hero /><StatsBand /><Pillars /><SimShowcase /><TutorSection /><ExamsSection /><CurriculumSection /><Pricing /><CtaBand />
  </>)
}
```

- [ ] **Step 7: Section render tests** — for each section, a smoke test wrapped in `<MemoryRouter>` + i18n provider asserting its translated title/heading text appears and it doesn't throw. Add `src/test/renderWithProviders.tsx` helper (wraps `I18nextProvider` + `MemoryRouter`).

- [ ] **Step 8: WebGL fallback test** — mock `@/three/webgl` `heroEnabled` → false; render `Hero`; assert the static fallback (e.g. `data-testid="static-hero"`) is present and no `<canvas>` is queried.

- [ ] **Step 9: Final verification** — run all gates:
```powershell
npm run typecheck   # tsc --noEmit, 0 errors
npm test            # all green incl. key-parity + fallback
npm run build       # vite build succeeds
npm run dev         # manual: scroll all sections, switch MN/EN/ZH, check mobile width
```

- [ ] **Step 10: Commit:**
```powershell
git add -A; git commit -m "feat(landing): data, MiniSimTeaser, 9 sections, LandingPage + tests; Phase 1 complete"
```

---

## Self-review (against the spec)

**Spec coverage:** brand/tokens → T2; i18n trilingual + switcher + parity → T4/T5; routing + stubs + 404 → T5/T6; all 11 landing units (navbar, hero, stats, pillars, showcase, tutor, exams, curriculum, pricing, cta, footer) → T5 (navbar/footer) + T7 (sections); 3D hero + lazy + fallback → T6/T7; primitives → T3; testing (render, parity, fallback, a11y via semantic markup) → T3/T4/T7; build gates → T7. Pricing values (₮0 / ₮100,000 / ₮249,999, student ₮49,999/₮89,999, 3-day trial) → T4/T7. ✅ No uncovered spec sections.

**Placeholder scan:** No "TBD/implement later"; each step shows code or exact commands. MN/ZH translation values are described with concrete examples + the rule "translate the EN reference / reuse harvested phycore strings" — acceptable since the EN canonical tree is fully specified and parity is test-enforced.

**Type consistency:** `cn` signature, `Button` props (`variant/size/to/href`), `Readout` props (`label/value/unit`), `GlassPanel` `glow`, `heroEnabled()`, `PLANS` shape, and i18n namespaces (`common`,`landing`) are referenced consistently across tasks. ✅

---

## Execution handoff
Phase 1 only. After Phase 1 ships and is reviewed, spec + plan Phases 2–4 separately (3D engine → auth → AI). Run a code review (requesting-code-review / three-brain) before declaring complete.
