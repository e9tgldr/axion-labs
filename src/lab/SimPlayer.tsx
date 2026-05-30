import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SimCanvas } from './SimCanvas'
import { ControlPanel } from './ControlPanel'
import { ReadoutPanel } from './ReadoutPanel'
import { createReadoutStore } from './useReadoutStore'
import { defaultsOf, type SimDefinition } from './types'

export function SimPlayer({ def }: { def: SimDefinition }) {
  const { t } = useTranslation('lab')
  const store = useMemo(() => createReadoutStore(), [])
  const [values, setValues] = useState(() => defaultsOf(def.params))
  const [playing, setPlaying] = useState(true)
  const [resetKey, setResetKey] = useState(0)

  const reset = () => {
    setValues(defaultsOf(def.params))
    setResetKey((k) => k + 1)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
      <SimCanvas def={def} scene={{ params: values, playing, resetKey, publish: store.publish }} />
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <Button size="sm" variant="gradient" onClick={() => setPlaying((p) => !p)}>
            {playing ? t('pause') : t('play')}
          </Button>
          <Button size="sm" variant="outline" onClick={reset}>
            {t('reset')}
          </Button>
        </div>
        <ControlPanel
          params={def.params}
          values={values}
          onChange={(k, v) => setValues((s) => ({ ...s, [k]: v }))}
        />
        <ReadoutPanel readouts={def.readouts} store={store} />
      </div>
    </div>
  )
}
