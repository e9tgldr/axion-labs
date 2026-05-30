import type { SimDefinition } from '@/lab/types'
import Scene from './Scene'

const def: SimDefinition = {
  id: 'ohm-circuit',
  params: [
    { key: 'V', labelKey: 'param.V', min: 1, max: 24, step: 1, default: 12, unit: 'V' },
    { key: 'R1', labelKey: 'param.R1', min: 1, max: 20, step: 1, default: 4, unit: 'Ω' },
    { key: 'R2', labelKey: 'param.R2', min: 1, max: 20, step: 1, default: 2, unit: 'Ω' },
  ],
  readouts: [
    { key: 'current', labelKey: 'readout.current', unit: 'A' },
    { key: 'resistance', labelKey: 'readout.resistance', unit: 'Ω' },
    { key: 'power', labelKey: 'readout.power', unit: 'W' },
  ],
  Scene,
  camera: { position: [0, 1, 9] },
}

export default def
