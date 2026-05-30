import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { resolveLang } from '@/i18n'
import { SIMULATIONS } from '@/data/simulations'

export function AskTutorButton({ simId }: { simId: string }) {
  const { t, i18n } = useTranslation('tutor')
  const lang = resolveLang(i18n.language)
  const meta = SIMULATIONS.find((s) => s.id === simId)
  if (!meta) return null
  const to = `/tutor?sim=${simId}&topic=${encodeURIComponent(meta.topic[lang])}&grade=${meta.grade}`
  return (
    <Button variant="ghost" size="sm" to={to}>
      💬 {t('askTutor')}
    </Button>
  )
}
