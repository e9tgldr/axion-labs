import { Component, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

/**
 * Normalize the math delimiters LLMs emit inconsistently into $...$/$$...$$,
 * but leave fenced code blocks (```...```) untouched so code samples aren't
 * mangled (spec §8).
 */
function normalizeMath(src: string): string {
  return src
    .split(/(```[\s\S]*?```)/g)
    .map((seg, i) =>
      i % 2 === 1
        ? seg // fenced code — leave as-is
        : seg
            .replace(/\\\[(.+?)\\\]/gs, (_m, x) => `$$${x}$$`)
            .replace(/\\\((.+?)\\\)/gs, (_m, x) => `$${x}$`),
    )
    .join('')
}

/** Raw-text fallback if KaTeX/markdown throws on a malformed formula (spec §8). */
class SafeRender extends Component<{ raw: string; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    return this.state.failed ? (
      <p className="whitespace-pre-wrap text-sm">{this.props.raw}</p>
    ) : (
      this.props.children
    )
  }
}

export function Markdown({ children }: { children: string }) {
  return (
    <SafeRender raw={children}>
      <div className="prose prose-invert max-w-none text-sm leading-relaxed">
        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
          {normalizeMath(children)}
        </ReactMarkdown>
      </div>
    </SafeRender>
  )
}
