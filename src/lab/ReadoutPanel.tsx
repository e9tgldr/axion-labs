import { useTranslation } from 'react-i18next'
import { Readout } from '@/components/ui/Readout'
import { fmt } from './format'
import { useThrottledReadouts, type ReadoutStore } from './useReadoutStore'
import type { ReadoutSpec } from './types'

export function ReadoutPanel({ readouts, store }: { readouts: ReadoutSpec[]; store: ReadoutStore }) {
  const { t } = useTranslation('lab')
  const snap = useThrottledReadouts(store)
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface/50 p-5">
      <h2 className="font-mono text-xs uppercase tracking-widest text-muted">{t('readouts')}</h2>
      <div className="grid grid-cols-2 gap-3">
        {readouts.map((r) => (
          <Readout
            key={r.key}
            label={t(r.labelKey)}
            unit={r.unit}
            value={fmt(snap[r.key] ?? 0, r.decimals ?? 2)}
          />
        ))}
      </div>
    </div>
  )
}
