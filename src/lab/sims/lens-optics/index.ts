import type { SimDefinition } from '@/lab/types'
import Scene from './Scene'

const def: SimDefinition = {
  id: 'lens-optics',
  params: [
    { key: 'focal', labelKey: 'param.focal', min: 0.5, max: 4, step: 0.1, default: 1.5, unit: 'm' },
    { key: 'objDist', labelKey: 'param.objDist', min: 0.6, max: 8, step: 0.1, default: 3, unit: 'm' },
  ],
  readouts: [
    { key: 'imageDist', labelKey: 'readout.imageDist', unit: 'm' },
    { key: 'magnification', labelKey: 'readout.magnification', unit: '×' },
    { key: 'imageType', labelKey: 'readout.imageType', unit: '', decimals: 0 },
  ],
  Scene,
  camera: { position: [0, 2, 10] },
}

export default def
