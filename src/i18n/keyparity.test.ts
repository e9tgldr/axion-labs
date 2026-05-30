import { describe, test, expect } from 'vitest'
import { LANGS } from './index'

type Json = Record<string, unknown>

const flatten = (obj: Json, prefix = ''): string[] =>
  Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object'
      ? flatten(v as Json, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )

describe('locale key parity', () => {
  test.each(['common', 'landing', 'lab', 'auth'])(
    'all locales share identical "%s" keys',
    async (ns) => {
      const keySets = await Promise.all(
        LANGS.map(async (lng) => {
          const mod = await import(`./locales/${lng}/${ns}.json`)
          return flatten(mod.default as Json).sort()
        }),
      )
      const base = keySets[0]
      keySets.forEach((set) => expect(set).toEqual(base))
    },
  )
})
