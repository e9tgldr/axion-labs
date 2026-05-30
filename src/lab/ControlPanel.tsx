import { useTranslation } from 'react-i18next'
import { Slider } from '@/components/ui/Slider'
import type { ParamSpec, SimState } from './types'

export function ControlPanel({
  params,
  values,
  onChange,
}: {
  params: ParamSpec[]
  values: SimState
  onChange: (key: string, v: number) => void
}) {
  const { t } = useTranslation('lab')
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-line bg-surface/50 p-5">
      <h3 className="font-mono text-xs uppercase tracking-widest text-muted">{t('controls')}</h3>
      {params.map((p) => (
        <Slider
          key={p.key}
          label={t(p.labelKey)}
          unit={p.unit}
          value={values[p.key]}
          min={p.min}
          max={p.max}
          step={p.step}
          onChange={(v) => onChange(p.key, v)}
        />
      ))}
    </div>
  )
}
