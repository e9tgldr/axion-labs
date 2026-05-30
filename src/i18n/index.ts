import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import mnCommon from './locales/mn/common.json'
import mnLanding from './locales/mn/landing.json'
import enCommon from './locales/en/common.json'
import enLanding from './locales/en/landing.json'
import zhCommon from './locales/zh/common.json'
import zhLanding from './locales/zh/landing.json'

export const LANGS = ['mn', 'en', 'zh'] as const
export type Lang = (typeof LANGS)[number]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      mn: { common: mnCommon, landing: mnLanding },
      en: { common: enCommon, landing: enLanding },
      zh: { common: zhCommon, landing: zhLanding },
    },
    fallbackLng: ['mn', 'en'],
    supportedLngs: LANGS as unknown as string[],
    defaultNS: 'landing',
    ns: ['common', 'landing'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

i18n.on('languageChanged', (lng) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng
})

export default i18n
