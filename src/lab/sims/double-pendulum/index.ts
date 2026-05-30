import type { SimDefinition } from '@/lab/types'
import Scene from './Scene'

const def: SimDefinition = {
  id: 'double-pendulum',
  params: [
    { key: 'L1', labelKey: 'param.L1', min: 0.5, max: 2, step: 0.1, default: 1, unit: 'm' },
    { key: 'L2', labelKey: 'param.L2', min: 0.5, max: 2, step: 0.1, default: 1, unit: 'm' },
    { key: 'm1', labelKey: 'param.m1', min: 0.5, max: 3, step: 0.1, default: 1, unit: 'kg' },
    { key: 'm2', labelKey: 'param.m2', min: 0.5, max: 3, step: 0.1, default: 1, unit: 'kg' },
    { key: 'theta1', labelKey: 'param.theta1', min: 0, max: 180, step: 1, default: 120, unit: '°' },
    { key: 'theta2', labelKey: 'param.theta2', min: 0, max: 180, step: 1, default: 90, unit: '°' },
    { key: 'g', labelKey: 'param.g', min: 1, max: 20, step: 0.1, default: 9.8, unit: 'm/s²' },
  ],
  readouts: [
    { key: 'theta1', labelKey: 'readout.theta1', unit: '°', decimals: 1 },
    { key: 'theta2', labelKey: 'readout.theta2', unit: '°', decimals: 1 },
    { key: 'energy', labelKey: 'readout.energy', unit: 'J', decimals: 1 },
  ],
  Scene,
  camera: { position: [0, 0, 9] },
}

export default def
