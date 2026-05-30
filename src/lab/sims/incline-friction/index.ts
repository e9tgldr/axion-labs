import type { SimDefinition } from '@/lab/types'
import Scene from './Scene'

const def: SimDefinition = {
  id: 'incline-friction',
  params: [
    { key: 'angle', labelKey: 'param.angle', min: 5, max: 60, step: 1, default: 25, unit: '°' },
    { key: 'mass', labelKey: 'param.mass', min: 0.5, max: 10, step: 0.5, default: 2, unit: 'kg' },
    { key: 'mu', labelKey: 'param.mu', min: 0, max: 1, step: 0.05, default: 0.2 },
    { key: 'g', labelKey: 'param.g', min: 1, max: 20, step: 0.1, default: 9.8, unit: 'm/s²' },
  ],
  readouts: [
    { key: 'accel', labelKey: 'readout.accel', unit: 'm/s²' },
    { key: 'friction', labelKey: 'readout.friction', unit: 'N' },
    { key: 'normal', labelKey: 'readout.normal', unit: 'N' },
    { key: 'speed', labelKey: 'readout.speed', unit: 'm/s' },
  ],
  Scene,
  camera: { position: [0, 3, 11] },
}

export default def
