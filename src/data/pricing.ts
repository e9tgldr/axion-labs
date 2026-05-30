export interface Plan {
  id: 'free' | 'standard' | 'premium'
  nameKey: string
  priceKey: string
  featureKeys: string[]
  highlight: boolean
}

/** Plan tiers; labels/prices resolved via i18n (`landing` namespace). */
export const PLANS: Plan[] = [
  {
    id: 'free',
    nameKey: 'pricing.free.n',
    priceKey: 'pricing.free.p',
    featureKeys: ['feat.simsLimited', 'feat.aiLimited', 'feat.testsBasic'],
    highlight: false,
  },
  {
    id: 'standard',
    nameKey: 'pricing.standard.n',
    priceKey: 'pricing.standard.p',
    featureKeys: ['feat.simsAll', 'feat.aiTeacher', 'feat.testsAi'],
    highlight: true,
  },
  {
    id: 'premium',
    nameKey: 'pricing.premium.n',
    priceKey: 'pricing.premium.p',
    featureKeys: ['feat.everything', 'feat.aiUnlimited', 'feat.priority'],
    highlight: false,
  },
]
