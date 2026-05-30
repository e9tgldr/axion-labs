import type { SimDefinition } from '@/lab/types'
import Scene from './Scene'

const def: SimDefinition = {
  id: 'projectile',
  params: [
    { key: 'v0', labelKey: 'param.v0', min: 5, max: 40, step: 1, default: 20, unit: 'm/s' },
    { key: 'angle', labelKey: 'param.angle', min: 5, max: 85, step: 1, default: 45, unit: '°' },
    { key: 'g', labelKey: 'param.g', min: 1, max: 20, step: 0.1, default: 9.8, unit: 'm/s²' },
  ],
  readouts: [
    { key: 'range', labelKey: 'readout.range', unit: 'm' },
    { key: 'maxHeight', labelKey: 'readout.maxHeight', unit: 'm' },
    { key: 'flightTime', labelKey: 'readout.flightTime', unit: 's' },
    { key: 'speed', labelKey: 'readout.speed', unit: 'm/s' },
  ],
  Scene,
  camera: { position: [0, 2, 11] },
}

export default def
