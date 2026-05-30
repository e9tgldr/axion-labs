import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const URL = process.env.URL || 'http://localhost:5173/'
const OUT = process.env.OUT || 'shots'
mkdirSync(OUT, { recursive: true })

const shots = [
  { name: 'desktop-mn-hero', w: 1440, h: 900, lang: 'mn', full: false },
  { name: 'desktop-mn-full', w: 1440, h: 900, lang: 'mn', full: true },
  { name: 'desktop-en-hero', w: 1440, h: 900, lang: 'en', full: false },
  { name: 'mobile-mn-hero', w: 390, h: 844, lang: 'mn', full: false },
  { name: 'mobile-mn-full', w: 390, h: 844, lang: 'mn', full: true },
]

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'],
})

for (const s of shots) {
  const ctx = await browser.newContext({
    viewport: { width: s.w, height: s.h },
    deviceScaleFactor: 1,
  })
  await ctx.addInitScript((lang) => {
    try {
      localStorage.setItem('i18nextLng', lang)
    } catch {}
  }, s.lang)
  const page = await ctx.newPage()
  await page.goto(URL, { waitUntil: 'networkidle' })
  // let fonts + entrance animations + 3D settle, and reveal-on-scroll fire
  await page.waitForTimeout(1200)
  if (s.full) {
    await page.evaluate(async () => {
      await new Promise((res) => {
        let y = 0
        const t = setInterval(() => {
          window.scrollBy(0, 600)
          y += 600
          if (y >= document.body.scrollHeight) {
            clearInterval(t)
            window.scrollTo(0, 0)
            res()
          }
        }, 60)
      })
    })
    await page.waitForTimeout(800)
  }
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: s.full })
  console.log('shot:', s.name)
  await ctx.close()
}

await browser.close()
console.log('DONE')
