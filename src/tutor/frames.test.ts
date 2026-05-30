import { describe, it, expect } from 'vitest'
import { encodeFrame, createFrameDecoder } from './frames'
import type { TutorFrame } from './types'

describe('frames wire format', () => {
  it('encodes a frame as one JSON line', () => {
    expect(encodeFrame({ type: 'token', text: 'hi' })).toBe('{"type":"token","text":"hi"}\n')
  })

  it('round-trips frames through the decoder', () => {
    const dec = createFrameDecoder()
    const enc = new TextEncoder()
    const frames: TutorFrame[] = [
      { type: 'token', text: 'Hello ' },
      { type: 'token', text: 'world' },
      { type: 'done' },
    ]
    const out = frames.flatMap((f) => dec.push(enc.encode(encodeFrame(f))))
    expect(out).toEqual(frames)
  })

  it('buffers a frame split across two chunks', () => {
    const dec = createFrameDecoder()
    const enc = new TextEncoder()
    const whole = encodeFrame({ type: 'token', text: 'split' })
    const bytes = enc.encode(whole)
    const a = bytes.slice(0, 5)
    const b = bytes.slice(5)
    expect(dec.push(a)).toEqual([])
    expect(dec.push(b)).toEqual([{ type: 'token', text: 'split' }])
  })

  it('keeps a multi-byte Cyrillic/Chinese char intact when split across chunks', () => {
    const dec = createFrameDecoder()
    const enc = new TextEncoder()
    const text = 'Шинэ энерги 能量' // 2-byte Cyrillic + 3-byte CJK code points
    const bytes = enc.encode(encodeFrame({ type: 'token', text }))
    // Cut ONE byte into the first multi-byte sequence so a char straddles chunks.
    const cut = bytes.findIndex((b) => b >= 0x80) + 1
    expect(dec.push(bytes.slice(0, cut))).toEqual([])
    expect(dec.push(bytes.slice(cut))).toEqual([{ type: 'token', text }])
  })

  it('flush emits a trailing frame that arrived without a newline', () => {
    const dec = createFrameDecoder()
    const enc = new TextEncoder()
    const b = enc.encode(encodeFrame({ type: 'token', text: 'tail' }))
    expect(dec.push(b.slice(0, b.length - 1))).toEqual([]) // withhold the '\n'
    expect(dec.flush()).toEqual([{ type: 'token', text: 'tail' }])
  })

  it('round-trips a done frame carrying usage', () => {
    const dec = createFrameDecoder()
    const enc = new TextEncoder()
    const f: TutorFrame = { type: 'done', usage: { outputTokens: 42 } }
    expect(dec.push(enc.encode(encodeFrame(f)))).toEqual([f])
  })
})
