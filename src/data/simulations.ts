import type { Lang } from '@/i18n'

export type Accent = 'orange' | 'pink' | 'violet' | 'amber'
export type Localized = Record<Lang, string>

export interface Simulation {
  id: string
  name: Localized
  topic: Localized
  grade: number
  accent: Accent
  /** short formula shown as a mono tag (language-neutral) */
  formula: string
}

/** Catalog metadata for the landing showcase. Real physics arrives in Phase 2. */
export const SIMULATIONS: Simulation[] = [
  {
    id: 'projectile',
    name: { en: 'Projectile Motion', mn: 'Шидэлтийн хөдөлгөөн', zh: '抛体运动' },
    topic: { en: 'Mechanics', mn: 'Механик', zh: '力学' },
    grade: 9,
    accent: 'orange',
    formula: 'R = v₀²·sin2θ / g',
  },
  {
    id: 'double-pendulum',
    name: { en: 'Double Pendulum', mn: 'Давхар дүүжин', zh: '双摆' },
    topic: { en: 'Chaos', mn: 'Хаос', zh: '混沌' },
    grade: 11,
    accent: 'violet',
    formula: 'θ₁, θ₂ → chaos',
  },
  {
    id: 'incline-friction',
    name: { en: 'Incline & Friction', mn: 'Налуу ба үрэлт', zh: '斜面与摩擦' },
    topic: { en: 'Mechanics', mn: 'Механик', zh: '力学' },
    grade: 9,
    accent: 'amber',
    formula: 'a = g(sinθ − μcosθ)',
  },
  {
    id: 'ohm-circuit',
    name: { en: 'Ohm’s Law Circuit', mn: 'Омын хуулийн хэлхээ', zh: '欧姆定律电路' },
    topic: { en: 'Electricity', mn: 'Цахилгаан', zh: '电学' },
    grade: 8,
    accent: 'pink',
    formula: 'V = I·R',
  },
  {
    id: 'ampere-force',
    name: { en: 'Ampère Force', mn: 'Амперын хүч', zh: '安培力' },
    topic: { en: 'Magnetism', mn: 'Соронзон', zh: '磁学' },
    grade: 11,
    accent: 'violet',
    formula: 'F = B·I·L',
  },
  {
    id: 'lens-optics',
    name: { en: 'Lens Optics', mn: 'Линзний оптик', zh: '透镜光学' },
    topic: { en: 'Optics', mn: 'Оптик', zh: '光学' },
    grade: 10,
    accent: 'orange',
    formula: '1/f = 1/d + 1/d′',
  },
  {
    id: 'waves',
    name: { en: 'Wave Motion', mn: 'Долгионы хөдөлгөөн', zh: '波动' },
    topic: { en: 'Waves', mn: 'Долгион', zh: '波动' },
    grade: 10,
    accent: 'pink',
    formula: 'v = f·λ',
  },
  {
    id: 'momentum',
    name: { en: 'Collisions', mn: 'Мөргөлдөөн', zh: '碰撞' },
    topic: { en: 'Mechanics', mn: 'Механик', zh: '力学' },
    grade: 10,
    accent: 'amber',
    formula: 'Σp = const',
  },
  {
    id: 'centripetal',
    name: { en: 'Centripetal Force', mn: 'Төвд тэмүүлэх хүч', zh: '向心力' },
    topic: { en: 'Mechanics', mn: 'Механик', zh: '力学' },
    grade: 10,
    accent: 'orange',
    formula: 'F = m·ω²·r',
  },
  {
    id: 'capacitor',
    name: { en: 'Capacitor Charging', mn: 'Конденсаторын цэнэглэлт', zh: '电容充电' },
    topic: { en: 'Electricity', mn: 'Цахилгаан', zh: '电学' },
    grade: 11,
    accent: 'violet',
    formula: 'τ = R·C',
  },
  {
    id: 'buoyancy',
    name: { en: 'Archimedes’ Force', mn: 'Архимедийн хүч', zh: '阿基米德力' },
    topic: { en: 'Fluids', mn: 'Шингэн', zh: '流体' },
    grade: 7,
    accent: 'pink',
    formula: 'Fб = ρ·g·V',
  },
  {
    id: 'doppler',
    name: { en: 'Doppler Effect', mn: 'Доплерын эффект', zh: '多普勒效应' },
    topic: { en: 'Waves', mn: 'Долгион', zh: '波动' },
    grade: 11,
    accent: 'amber',
    formula: 'f′ = f·(v±vₒ)/(v∓vₛ)',
  },
]
