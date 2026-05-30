export interface LensIn {
  focal: number
  objDist: number
}

export function lens({ focal, objDist }: LensIn) {
  const inv = 1 / focal - 1 / objDist
  const imageDist = inv !== 0 ? 1 / inv : Infinity
  const magnification = -imageDist / objDist
  const real = Number.isFinite(imageDist) && imageDist > 0 ? 1 : 0
  return { imageDist, magnification, real }
}
