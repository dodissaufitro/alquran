export type ImportedDocument = {
  body: string
  summary?: string
  readMinutes?: number
  titleHint?: string
}

export type ImportedChapterSlice = {
  title: string
  summary: string
  body: string
  readMinutes: number
}

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export function estimateReadMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function normalizePlainText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function elementToInlineText(el: Element): string {
  let out = ''
  for (const node of el.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? ''
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const child = node as Element
      const tag = child.tagName.toLowerCase()
      const inner = elementToInlineText(child)
      if (tag === 'strong' || tag === 'b') out += `**${inner.trim()}**`
      else if (tag === 'br') out += '\n'
      else out += inner
    }
  }
  return out
}

function htmlToLearningBody(html: string): string {
  const root = document.createElement('div')
  root.innerHTML = html

  const blockTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'blockquote']
  const paragraphs: string[] = []

  for (const el of root.querySelectorAll(blockTags.join(','))) {
    const text = normalizePlainText(elementToInlineText(el))
    if (text) paragraphs.push(text)
  }

  if (paragraphs.length === 0) {
    const fallback = normalizePlainText(root.textContent ?? '')
    if (fallback) {
      return fallback
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean)
        .join('\n\n')
    }
    return ''
  }

  return paragraphs.join('\n\n')
}

async function importDocx(arrayBuffer: ArrayBuffer): Promise<string> {
  const mammoth = await import('mammoth')
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer })
  let body = htmlToLearningBody(htmlResult.value)

  if (!body.trim()) {
    const plain = await mammoth.extractRawText({ arrayBuffer })
    body = normalizePlainText(plain.value)
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
      .join('\n\n')
  }

  return body
}

async function importPdf(arrayBuffer: ArrayBuffer): Promise<string> {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href

  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const pageTexts: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const content = await page.getTextContent()
    const parts: string[] = []
    let lastY: number | null = null

    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue
      const y = 'transform' in item && Array.isArray(item.transform) ? item.transform[5] : null
      if (lastY !== null && y !== null && Math.abs(y - lastY) > 8) {
        parts.push('\n')
      }
      parts.push(item.str)
      if (y !== null) lastY = y
    }

    const pageText = normalizePlainText(parts.join(' '))
    if (pageText) pageTexts.push(pageText)
  }

  const merged = pageTexts.join('\n\n')
  return normalizePlainText(merged)
}

export function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim()
}

function stripHeadingMarkers(text: string): string {
  return text
    .replace(/^\*\*|\*\*$/g, '')
    .replace(/^#+\s*/, '')
    .trim()
}

/** Pecah teks impor menjadi beberapa bab (judul pendek / **judul** = pemisah bab). */
export function chaptersFromImportedBody(body: string): ImportedChapterSlice[] {
  const paragraphs = normalizePlainText(body)
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)

  if (paragraphs.length === 0) return []

  const looksLikeHeading = (p: string): boolean => {
    const plain = stripHeadingMarkers(p)
    if (plain.length > 120) return false
    if (/^bab\s*\d+/i.test(plain)) return true
    if (/^\d+[\).]\s+\S/.test(plain)) return true
    if (/^\*\*.+\*\*$/.test(p.trim())) return true
    if (/^#{1,3}\s/.test(p)) return true
    if (plain.length <= 80 && !/[.!?…]["']?\s/.test(plain)) return true
    return false
  }

  const slices: ImportedChapterSlice[] = []
  let pendingTitle: string | null = null
  let buffer: string[] = []

  const flush = () => {
    if (buffer.length === 0) return
    const chapterBody = buffer.join('\n\n')
    const first = buffer[0] ?? ''
    const title = pendingTitle ?? `Bab ${slices.length + 1}`
    slices.push({
      title,
      body: chapterBody,
      summary: first.length > 160 ? `${first.slice(0, 157).trim()}…` : first,
      readMinutes: estimateReadMinutes(chapterBody),
    })
    buffer = []
    pendingTitle = null
  }

  for (const p of paragraphs) {
    if (looksLikeHeading(p)) {
      flush()
      pendingTitle = stripHeadingMarkers(p) || `Bab ${slices.length + 1}`
    } else {
      if (!pendingTitle && buffer.length === 0 && slices.length === 0) {
        pendingTitle = `Bab 1`
      }
      buffer.push(p)
    }
  }
  flush()

  if (slices.length > 0) return slices

  return [
    {
      title: 'Bab 1',
      body: normalizePlainText(body),
      summary: paragraphs[0].length > 160 ? `${paragraphs[0].slice(0, 157).trim()}…` : paragraphs[0],
      readMinutes: estimateReadMinutes(body),
    },
  ]
}

export async function importDocumentFile(file: File): Promise<ImportedDocument> {
  const name = file.name.toLowerCase()
  const buffer = await file.arrayBuffer()

  let body: string
  if (name.endsWith('.pdf') || file.type === 'application/pdf') {
    body = await importPdf(buffer)
  } else if (name.endsWith('.docx') || file.type === DOCX_MIME) {
    body = await importDocx(buffer)
  } else if (name.endsWith('.doc')) {
    throw new Error('File .doc (Word lama) tidak didukung. Buka di Word lalu simpan sebagai .docx.')
  } else {
    throw new Error('Format tidak didukung. Gunakan file .docx (Word) atau .pdf.')
  }

  if (!body.trim()) {
    throw new Error('Tidak ada teks yang berhasil diekstrak dari dokumen.')
  }

  const paragraphs = body.split('\n\n').filter(Boolean)
  const first = paragraphs[0] ?? ''
  const summary = first.length > 160 ? `${first.slice(0, 157).trim()}…` : first

  return {
    body,
    summary: summary || undefined,
    readMinutes: estimateReadMinutes(body),
    titleHint: titleFromFilename(file.name),
  }
}
