/**
 * Convierte Prismic Rich Text (Array de nodos) a Lexical JSON de Payload CMS v3.
 *
 * Prismic Rich Text -> Lexical SerializedEditorState
 */

// Tipo interno que cubre el formato de Prismic Rich Text
export type PrismicRichTextField = Array<{
  type: string
  text?: string
  spans?: Array<{
    type: string
    start: number
    end: number
    data?: { url?: string; link_type?: string; target?: string }
  }>
  url?: string
  dimensions?: { width: number; height: number }
  alt?: string
  copyright?: string
}>

// ─── Tipos mínimos de Lexical que Payload espera ─────────────────────────────

interface LexicalTextNode {
  type: 'text'
  text: string
  format: number
  mode: 'normal'
  style: ''
  detail: 0
  version: 1
}

interface LexicalParagraphNode {
  type: 'paragraph'
  version: 1
  direction: 'ltr' | 'rtl' | null
  format: '' | 'left' | 'right' | 'center' | 'justify'
  indent: 0
  children: LexicalTextNode[]
  textFormat: 0
  textStyle: ''
}

interface LexicalHeadingNode {
  type: 'heading'
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  version: 1
  direction: 'ltr' | null
  format: ''
  indent: 0
  children: LexicalTextNode[]
}

interface LexicalListNode {
  type: 'list'
  listType: 'bullet' | 'number'
  version: 1
  direction: 'ltr' | null
  format: ''
  indent: 0
  start: 1
  tag: 'ul' | 'ol'
  children: LexicalListItemNode[]
}

interface LexicalListItemNode {
  type: 'listitem'
  version: 1
  value: number
  checked: false | undefined
  direction: 'ltr' | null
  format: ''
  indent: 0
  children: LexicalTextNode[]
}

interface LexicalLinkNode {
  type: 'link'
  version: 1
  direction: 'ltr' | null
  format: ''
  indent: 0
  url: string
  target: '_blank' | '_self'
  fields: { linkType: 'custom'; newTab: boolean; url: string }
  children: LexicalTextNode[]
}

type LexicalNode =
  | LexicalParagraphNode
  | LexicalHeadingNode
  | LexicalListNode
  | LexicalLinkNode

export interface LexicalEditorState {
  root: {
    type: 'root'
    version: 1
    direction: 'ltr' | null
    format: ''
    indent: 0
    children: LexicalNode[]
  }
}

// ─── Texto format bitmask (Lexical) ──────────────────────────────────────────
const FORMAT = {
  bold: 1,
  italic: 2,
  strikethrough: 4,
  underline: 8,
  code: 16,
  subscript: 32,
  superscript: 64,
} as const

function makeTextNode(text: string, format = 0): LexicalTextNode {
  return {
    type: 'text',
    text,
    format,
    mode: 'normal',
    style: '',
    detail: 0,
    version: 1,
  }
}

// ─── Prismic Span → Lexical TextNode(s) ─────────────────────────────────────

type PrismicSpan = {
  type: string
  start: number
  end: number
  data?: { url?: string; link_type?: string; target?: string }
}

function spansToTextNodes(text: string, spans: PrismicSpan[]): (LexicalTextNode | LexicalLinkNode)[] {
  if (!spans.length) return [makeTextNode(text)]

  const nodes: (LexicalTextNode | LexicalLinkNode)[] = []
  let cursor = 0

  // Ordenar spans por inicio
  const sorted = [...spans].sort((a, b) => a.start - b.start)

  for (const span of sorted) {
    if (span.start > cursor) {
      nodes.push(makeTextNode(text.slice(cursor, span.start)))
    }

    const spanText = text.slice(span.start, span.end)
    let fmt = 0

    if (span.type === 'strong') fmt |= FORMAT.bold
    if (span.type === 'em') fmt |= FORMAT.italic

    if (span.type === 'hyperlink' && span.data?.url) {
      const linkNode: LexicalLinkNode = {
        type: 'link',
        version: 1,
        direction: 'ltr',
        format: '',
        indent: 0,
        url: span.data.url,
        target: span.data.target === '_blank' ? '_blank' : '_self',
        fields: { linkType: 'custom', newTab: span.data.target === '_blank', url: span.data.url },
        children: [makeTextNode(spanText)],
      }
      nodes.push(linkNode)
    } else {
      nodes.push(makeTextNode(spanText, fmt))
    }

    cursor = span.end
  }

  if (cursor < text.length) {
    nodes.push(makeTextNode(text.slice(cursor)))
  }

  return nodes
}

// ─── Conversor principal ────────────────────────────────────────────────────

export function prismicRichTextToLexical(richText: PrismicRichTextField): LexicalEditorState {
  const children: LexicalNode[] = []
  let currentList: LexicalListNode | null = null

  for (const block of richText) {
    const text = ('text' in block ? block.text : '') ?? ''
    const spans = ('spans' in block ? block.spans : []) as PrismicSpan[]

    // Si el bloque no es una lista, resetear currentList
    if (block.type !== 'list-item' && block.type !== 'o-list-item') {
      if (currentList) {
        children.push(currentList)
        currentList = null
      }
    }

    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
      case 'heading4':
      case 'heading5':
      case 'heading6': {
        const tag = block.type.replace('heading', 'h') as LexicalHeadingNode['tag']
        children.push({
          type: 'heading',
          tag,
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: spansToTextNodes(text, spans).filter(
            (n): n is LexicalTextNode => n.type === 'text',
          ),
        })
        break
      }

      case 'paragraph': {
        children.push({
          type: 'paragraph',
          version: 1,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: text ? (spansToTextNodes(text, spans) as LexicalTextNode[]) : [makeTextNode('')],
          textFormat: 0,
          textStyle: '',
        })
        break
      }

      case 'list-item':
      case 'o-list-item': {
        const listType = block.type === 'list-item' ? 'bullet' : 'number'
        const tag = listType === 'bullet' ? 'ul' : 'ol'

        if (!currentList || currentList.listType !== listType) {
          if (currentList) children.push(currentList)
          currentList = {
            type: 'list',
            listType,
            version: 1,
            direction: 'ltr',
            format: '',
            indent: 0,
            start: 1,
            tag,
            children: [],
          }
        }

        const itemNode: LexicalListItemNode = {
          type: 'listitem',
          version: 1,
          value: currentList.children.length + 1,
          checked: undefined,
          direction: 'ltr',
          format: '',
          indent: 0,
          children: spansToTextNodes(text, spans).filter(
            (n): n is LexicalTextNode => n.type === 'text',
          ),
        }
        currentList.children.push(itemNode)
        break
      }

      case 'image': {
        // Imágenes dentro de rich text — se insertan como nodo de párrafo vacío por ahora
        // La imagen ya habrá sido migrada a la colección Media
        children.push({
          type: 'paragraph',
          version: 1,
          direction: null,
          format: '',
          indent: 0,
          children: [makeTextNode('')],
          textFormat: 0,
          textStyle: '',
        })
        break
      }

      default:
        break
    }
  }

  if (currentList) children.push(currentList)

  return {
    root: {
      type: 'root',
      version: 1,
      direction: 'ltr',
      format: '',
      indent: 0,
      children: children.length ? children : [
        {
          type: 'paragraph',
          version: 1,
          direction: null,
          format: '',
          indent: 0,
          children: [makeTextNode('')],
          textFormat: 0,
          textStyle: '',
        },
      ],
    },
  }
}
