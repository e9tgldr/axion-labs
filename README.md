# Axion Labs

A physics-learning platform — interactive **3D simulations**, a **24/7 AI tutor**, **AI adaptive exams**, and an **annual curriculum for grades 6–11**. Trilingual (Mongolian · English · Chinese), dark sci-fi "lab-HUD" aesthetic.

> A faithful, **rebranded** reimplementation of [phycore.tech](https://phycore.tech/) (Physics Lab Pro / PhysiCore AI).

## Status — Phase 1 (Foundation + Landing) ✅

This repo currently contains the **foundation** and the **marketing landing page**:

- Design system (brand tokens, fonts, UI primitives)
- Trilingual i18n (MN default / EN / ZH) with a language switcher + key-parity test
- Routing + themed "Coming soon" stubs for later phases + a 404 page
- A live, lazy-loaded **3D hero** (Three.js / react-three-fiber) with graceful WebGL / reduced-motion fallback
- 9 landing sections: hero, stats, pillars, simulation showcase (live teaser), AI-tutor mock, adaptive-exams, curriculum, pricing, CTA

### Roadmap
- **Phase 2** — 3D simulation engine + library (reusable `SimCanvas` + controls + HUD; real physics).
- **Phase 3** — Auth + accounts (Supabase: Google OAuth, Postgres, RLS), plan gating.
- **Phase 4** — AI tutor + exam generation (server-side LLM proxy; mock now, real key later).

## Tech stack
React 18 · TypeScript · Vite · Tailwind CSS · react-router · i18next · Three.js (@react-three/fiber) · Vitest + Testing Library.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # vitest (run once)
npm run typecheck  # tsc --noEmit
npm run build      # tsc --noEmit && vite build
```

### Visual screenshots (optional)
```bash
npx playwright install chromium
npm run dev          # in one terminal
node scripts/shoot.mjs   # writes shots/*.png
```

## Brand
- **Name:** Axion Labs · **Palette:** plasma `#fb923c → #f472b6 → #a855f7` on near-black `#070A12`
- **Fonts:** Orbitron (display) · Share Tech Mono (HUD) · Inter (body)

## Docs
- Design spec: `docs/superpowers/specs/2026-05-30-axion-labs-foundation-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-30-axion-labs-phase1-foundation.md`
