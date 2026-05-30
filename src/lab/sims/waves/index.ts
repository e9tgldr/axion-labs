import type { SimDefinition } from '@/lab/types'
import Scene from './Scene'

const def: SimDefinition = {
  id: 'waves',
  params: [
    { key: 'A', labelKey: 'param.A', min: 0.2, max: 3, step: 0.1, default: 1 },
    { key: 'f', labelKey: 'param.f', min: 0.2, max: 3, step: 0.1, default: 1, unit: 'Hz' },
    { key: 'lambda', labelKey: 'param.lambda', min: 1, max: 8, step: 0.5, default: 4, unit: 'm' },
  ],
  readouts: [
    { key: 'waveSpeed', labelKey: 'readout.waveSpeed', unit: 'm/s' },
    { key: 'period', labelKey: 'readout.period', unit: 's' },
    { key: 'angFreq', labelKey: 'readout.angFreq', unit: 'rad/s' },
  ],
  Scene,
  camera: { position: [0, 3, 10] },
}

export default def
