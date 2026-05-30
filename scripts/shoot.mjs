import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.URL || 'http://localhost:5173'
const OUT = process.env.OUT || 'shots'
mkdirSync(OUT, { recursive: true })

const shots = [
  { name: 'desktop-mn-full', path: '/', w: 1440, h: 900, lang: 'mn', full: true },
  { name: 'desktop-en-hero', path: '/', w: 1440, h: 900, lang: 'en', full: false },
  { name: 'lab-catalog-mn', path: '/lab', w: 1440, h: 900, lang: 'mn', full: false },
  { name: 'lab-catalog-en', path: '/lab', w: 1440, h: 900, lang: 'en', full: false },
  { name: 'sim-projectile', path: '/lab/projectile', w: 1440, h: 900, lang: 'en', full: false },
  { name: 'sim-double-pendulum', path: '/lab/double-pendulum', w: 1440, h: 900, lang: 'en', full: false },
  { name: 'sim-ohm-circuit', path: '/lab/ohm-circuit', w: 1440, h: 900, lang: 'en', full: false },
  { name: 'sim-waves', path: '/lab/waves', w: 1440, h: 900, lang: 'en', full: false },
  { name: 'sim-lens-optics', path: '/lab/lens-optics', w: 1440, h: 900, lang: 'en', full: false },
  { name: 'sim-incline-friction', path: '/lab/incline-friction', w: 1440, h: 900, lang: 'en', full: false },
]

const browser = await chromium.launch({
  args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-gl=angle'],
})

for (const s of shots) {
  const ctx = await browser.newContext({ viewport: { width: s.w, height: s.h }, deviceScaleFactor: 1 })
  await ctx.addInitScript((lang) => {
    try { localStorage.setItem('i18nextLng', lang) } catch {}
  }, s.lang)
  const page = await ctx.newPage()
  await page.goto(BASE + s.path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1500) // fonts + 3D first frame + entrance anims
  if (s.full) {
    await page.evaluate(async () => {
      await new Promise((res) => {
        let y = 0
        const t = setInterval(() => {
          window.scrollBy(0, 600); y += 600
          if (y >= document.body.scrollHeight) { clearInterval(t); window.scrollTo(0, 0); res() }
        }, 60)
      })
    })
    await page.waitForTimeout(700)
  }
  await page.screenshot({ path: `${OUT}/${s.name}.png`, fullPage: s.full })
  console.log('shot:', s.name)
  await ctx.close()
}

await browser.close()
console.log('DONE')
