import type { TutorFrame } from './types'

/** One frame → one newline-delimited JSON line (the on-wire unit). */
export function encodeFrame(frame: TutorFrame): string {
  return JSON.stringify(frame) + '\n'
}

/**
 * Stateful decoder for a streamed byte response. `push` is fed raw Uint8Array
 * chunks (from a fetch ReadableStream reader) and returns the frames that have
 * fully arrived. TextDecoder({stream:true}) keeps multi-byte UTF-8 characters
 * (Mongolian Cyrillic, Chinese) intact when they straddle a chunk boundary.
 */
export function createFrameDecoder() {
  const decoder = new TextDecoder()
  let buffer = ''
  const drain = (): TutorFrame[] => {
    const out: TutorFrame[] = []
    let nl: number
    while ((nl = buffer.indexOf('\n')) >= 0) {
      const line = buffer.slice(0, nl).trim()
      buffer = buffer.slice(nl + 1)
      if (line) out.push(JSON.parse(line) as TutorFrame)
    }
    return out
  }
  return {
    push(chunk: Uint8Array): TutorFrame[] {
      buffer += decoder.decode(chunk, { stream: true })
      return drain()
    },
    flush(): TutorFrame[] {
      buffer += decoder.decode()
      const line = buffer.trim()
      buffer = ''
      return line ? [JSON.parse(line) as TutorFrame] : []
    },
  }
}
