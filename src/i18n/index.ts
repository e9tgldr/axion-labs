import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import mnCommon from './locales/mn/common.json'
import mnLanding from './locales/mn/landing.json'
import mnLab from './locales/mn/lab.json'
import enCommon from './locales/en/common.json'
import enLanding from './locales/en/landing.json'
import enLab from './locales/en/lab.json'
import zhCommon from './locales/zh/common.json'
import zhLanding from './locales/zh/landing.json'
import zhLab from './locales/zh/lab.json'

export const LANGS = ['mn', 'en', 'zh'] as const
export type Lang = (typeof LANGS)[number]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      mn: { common: mnCommon, landing: mnLanding, lab: mnLab },
      en: { common: enCommon, landing: enLanding, lab: enLab },
      zh: { common: zhCommon, landing: zhLanding, lab: zhLab },
    },
    fallbackLng: 'en',
    supportedLngs: LANGS as unknown as string[],
    defaultNS: 'landing',
    ns: ['common', 'landing', 'lab'],
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  })

/** Narrow any detected language string to a supported Lang (default: Mongolian). */
export const resolveLang = (lng: string | undefined): Lang =>
  (LANGS as readonly string[]).includes(lng ?? '') ? (lng as Lang) : 'mn'

const syncDocumentLang = (lng: string) => {
  if (typeof document !== 'undefined') document.documentElement.lang = lng
}

// Sync <html lang> on initial load (languageChanged does not fire for the
// language resolved during init) and on every subsequent change.
syncDocumentLang(i18n.language)
i18n.on('languageChanged', syncDocumentLang)

export default i18n
