import type { ReactNode } from 'react'

/** Teks pembelajaran: **tebal** → <strong> */
export function formatLearningInline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

export function splitLearningParagraphs(body: string): string[] {
  return body.split('\n\n').filter(Boolean)
}
