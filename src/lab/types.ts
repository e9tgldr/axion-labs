import type { ComponentType } from 'react'

export type SimState = Record<string, number>

export interface ParamSpec {
  key: string
  labelKey: string
  min: number
  max: number
  step: number
  default: number
  unit?: string
}

export interface ReadoutSpec {
  key: string
  labelKey: string
  unit?: string
  decimals?: number
}

export interface SimSceneProps {
  params: SimState
  playing: boolean
  resetKey: number
  publish: (values: Record<string, number>) => void
}

export interface SimDefinition {
  id: string
  params: ParamSpec[]
  readouts: ReadoutSpec[]
  Scene: ComponentType<SimSceneProps>
  camera?: { position: [number, number, number]; fov?: number }
}

export const defaultsOf = (params: ParamSpec[]): SimState =>
  Object.fromEntries(params.map((p) => [p.key, p.default]))
