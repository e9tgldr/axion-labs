import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Container } from '@/components/ui/Container'
import { Logo } from '@/components/ui/Logo'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Footer() {
  const { t } = useTranslation('landing')

  const columns = [
    {
      heading: t('footer.product'),
      links: [
        { label: t('nav.lab'), to: '/lab' },
        { label: t('nav.tutor'), to: '/tutor' },
        { label: t('nav.exams'), to: '/exams' },
        { label: t('nav.pricing'), to: '/pricing' },
      ],
    },
    {
      heading: t('footer.company'),
      links: [
        { label: t('footer.about'), to: '#' },
        { label: t('footer.contact'), to: '#' },
      ],
    },
    {
      heading: t('footer.resources'),
      links: [
        { label: t('footer.docs'), to: '#' },
        { label: t('footer.help'), to: '#' },
      ],
    },
    {
      heading: t('footer.legal'),
      links: [
        { label: t('footer.privacy'), to: '#' },
        { label: t('footer.terms'), to: '#' },
      ],
    },
  ]

  return (
    <footer className="border-t border-line bg-surface-2">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-4">
            <Logo withWordmark />
            <p className="max-w-xs text-sm text-muted">{t('footer.tagline')}</p>
            <LanguageSwitcher className="w-fit" />
          </div>

          {columns.map((col) => (
            <div key={col.heading} className="flex flex-col gap-3">
              <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
                {col.heading}
              </h3>
              <ul className="flex flex-col gap-2">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.to}
                      className="text-sm text-text/80 transition-colors hover:text-violet"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-line pt-6 font-mono text-xs text-muted">
          {t('footer.rights')}
        </div>
      </Container>
    </footer>
  )
}
