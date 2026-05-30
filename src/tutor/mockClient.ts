import type { ChatMessage, LLMClient, TutorContext } from './types'
import type { Lang } from '@/i18n'

const TOKEN_DELAY_MS = 12

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Deterministic, on-topic canned reply. Real model swaps in via proxyClient. */
function answerFor(ctx: TutorContext, _history: ChatMessage[]): string {
  const topic = ctx.topic
  const byLang: Record<Lang, string> = {
    en: topic
      ? `Great question about ${topic}! Let's reason it through together. Start from the core idea: what is being conserved or what force acts here? Tell me the quantities you know, and I'll guide the next step. (Demo tutor — this reply is simulated.)`
      : `Hi! I'm Axion, your physics tutor. Ask me about any topic from grades 6-11 — motion, forces, energy, electricity, and more. What are you working on? (Demo tutor — this reply is simulated.)`,
    mn: topic
      ? `${topic} сэдвээр сайн асуулт байна! Цуг бодъё. Гол санаанаас эхэлье: энд юу хадгалагдаж байна, ямар хүч үйлчилж байна вэ? Мэдэгдэж буй хэмжигдэхүүнээ хэлээч, би дараагийн алхмыг чиглүүлье. (Туршилтын багш — энэ хариулт загварчилсан.)`
      : `Сайн уу! Би Axion, чиний физикийн багш. 6-11 ангийн аль ч сэдвээр асуу — хөдөлгөөн, хүч, энерги, цахилгаан. Юу хийж байна вэ? (Туршилтын багш — энэ хариулт загварчилсан.)`,
    zh: topic
      ? `关于${topic}的好问题！我们一起推理。先从核心思想入手：这里什么是守恒的，或者有什么力在作用？告诉我你已知的量，我来引导下一步。（演示导师——此回复为模拟。）`
      : `你好！我是 Axion，你的物理老师。可以问我 6-11 年级的任何主题——运动、力、能量、电学。你在学什么？（演示导师——此回复为模拟。）`,
  }
  return byLang[ctx.lang]
}

/** Splits into word-ish tokens, preserving trailing spaces so reassembly is exact. */
function tokenize(text: string): string[] {
  return text.match(/\S+\s*/g) ?? [text]
}

export function mockClient(): LLMClient {
  return {
    async *stream(history, ctx, signal) {
      if (signal?.aborted) return
      const tokens = tokenize(answerFor(ctx, history))
      for (const text of tokens) {
        if (signal?.aborted) return
        await delay(TOKEN_DELAY_MS)
        if (signal?.aborted) return
        yield { type: 'token', text }
      }
      yield { type: 'done' }
    },
  }
}
