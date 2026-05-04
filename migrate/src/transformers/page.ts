/**
 * transformers/page.ts
 *
 * Función PURA que convierte un documento Prismic de tipo page/landing_page
 * al shape que espera la colección `pages` de Payload CMS.
 *
 * Sin efectos secundarios, sin I/O — ideal para tests unitarios.
 * Los IDs de media se inyectan externamente (ya resueltos por quien llame).
 */

import { prismicRichTextToLexical, type PrismicRichTextField } from './richtext'

// ─── Tipos Prismic ────────────────────────────────────────────────────────────

export type PrismicSpan = {
  type: string
  start: number
  end: number
  data?: { url?: string; link_type?: string; target?: string }
}

export type PrismicRichTextBlock = {
  type: string
  text?: string
  spans?: PrismicSpan[]
  url?: string
  dimensions?: { width: number; height: number }
  alt?: string
  copyright?: string
}

export type PrismicImageField = {
  url?: string
  dimensions?: { width: number; height: number }
  alt?: string
  copyright?: string | null
}

export type PrismicSlice = {
  slice_type?: string
  type?: string
  primary?: Record<string, any>
  items?: Record<string, any>[]
}

export type PrismicPageDoc = {
  id: string
  uid: string | null
  type: string
  lang: string
  tags: string[]
  first_publication_date: string | null
  last_publication_date?: string | null
  data: {
    title?: PrismicRichTextBlock[]
    hero_title?: PrismicRichTextBlock[]
    hero_description?: PrismicRichTextBlock[] | string
    hero_image?: PrismicImageField
    banner?: PrismicImageField
    image?: PrismicImageField
    description?: PrismicRichTextBlock[] | string
    content?: PrismicRichTextField
    body?: PrismicRichTextField | PrismicSlice[]
    slices?: PrismicSlice[]
    [key: string]: any
  }
}

// ─── Tipos Payload (shape de la colección pages) ──────────────────────────────

export type PayloadRichTextBlock = {
  blockType: 'richTextBlock'
  content: object // LexicalEditorState
}

export type PayloadHeroBlock = {
  blockType: 'heroBlock'
  heading: string
  subheading?: string
  ctaLabel?: string
  ctaUrl?: string
  image?: string
}

export type PayloadImageBlock = {
  blockType: 'imageBlock'
  image: string // ID de media en Payload
  caption: string
}

export type PayloadCTABlock = {
  blockType: 'callToActionBlock'
  heading: string
  description: string
  ctaLabel: string
  ctaUrl: string
}

export type PayloadFeatureGridBlock = {
  blockType: 'featureGridBlock'
  heading: string
  features: { icon: string; title: string; description: string }[]
}

export type PayloadLayoutBlock =
  | PayloadHeroBlock
  | PayloadRichTextBlock
  | PayloadImageBlock
  | PayloadCTABlock
  | PayloadFeatureGridBlock

export type PagePayloadData = {
  title: string
  excerpt: string
  slug: string
  status: 'draft' | 'published'
  prismicId: string
  image?: string
  showImageInArticle: boolean
  content: PayloadLayoutBlock[]
}

// ─── Utilidades ────────────────────────────────────────────────────────────────

export function extractText(field: any): string {
  if (typeof field === 'string') return field
  if (Array.isArray(field))
    return field
      .filter((b) => b?.text)
      .map((b) => b.text)
      .join(' ')
  return ''
}

// ─── Transformer principal ────────────────────────────────────────────────────

/**
 * Transforma un documento Prismic (page / landing_page) al shape de Payload.
 *
 * @param doc          - Documento Prismic completo
 * @param heroImageId  - ID de media de Payload para la imagen principal (null si no existe)
 * @param mediaIds     - Mapa sliceKey → payloadMediaId para imágenes de slices.
 *                       La clave es `page-slice-img-{doc.id}-{sliceIndex}`.
 *                       Pasar `new Map()` en tests para omitir imágenes de slices.
 */
export function transformPrismicPage(
  doc: PrismicPageDoc,
  heroImageId: string | null,
  mediaIds: Map<string, string> = new Map(),
): PagePayloadData {
  const data = doc.data

  const title = extractText(data.title) || doc.uid || 'Sin título'
  const slug =
    doc.uid ||
    title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
  const excerpt = extractText(data.hero_description || data.description) || ''

  // ── Content (slices → blocks) ───────────────────────────────────────────────
  const content: PayloadLayoutBlock[] = []

  const slices: PrismicSlice[] = Array.isArray(data.slices)
    ? data.slices
    : Array.isArray(data.body)
      ? (data.body as PrismicSlice[])
      : []

  if (slices.length > 0) {
    slices.forEach((slice, i) => {
      const sliceType = slice.slice_type ?? slice.type
      const primary = slice.primary ?? {}
      const items = slice.items ?? []

      switch (sliceType) {
        case 'text':
        case 'rich_text':
        case 'text_block': {
          const rt: PrismicRichTextField = primary.text ?? primary.content ?? primary.body ?? []
          if (Array.isArray(rt) && rt.length > 0) {
            content.push({ blockType: 'richTextBlock', content: prismicRichTextToLexical(rt) })
          }
          break
        }

        case 'image':
        case 'image_block': {
          const imgUrl: string | undefined = primary.image?.url
          if (imgUrl) {
            const key = `page-slice-img-${doc.id}-${i}`
            const imgId = mediaIds.get(key) ?? null
            if (imgId) {
              content.push({
                blockType: 'imageBlock',
                image: imgId,
                caption: primary.caption ?? '',
              })
            }
            // Si no hay ID de media (p.ej. en tests sin upload), se omite el bloque.
            // En la migración real, se llama uploadPrismicImage antes de transformar.
          }
          break
        }

        case 'call_to_action':
        case 'cta': {
          content.push({
            blockType: 'callToActionBlock',
            heading: extractText(primary.heading ?? primary.title) ?? '',
            description: extractText(primary.description ?? primary.text) ?? '',
            ctaLabel: extractText(primary.cta_label ?? primary.button_label) ?? '',
            ctaUrl: primary.cta_link?.url ?? primary.link?.url ?? '',
          })
          break
        }

        case 'features':
        case 'feature_grid': {
          content.push({
            blockType: 'featureGridBlock',
            heading: extractText(primary.heading ?? primary.title) ?? '',
            features: items.map((item: any) => ({
              icon: item.icon ?? '',
              title: extractText(item.title) ?? '',
              description: extractText(item.description) ?? '',
            })),
          })
          break
        }

        default: {
          // Fallback: intentar leer rich text del primary
          const fallbackRt: PrismicRichTextField = primary.text ?? primary.content ?? []
          if (Array.isArray(fallbackRt) && fallbackRt.length > 0) {
            content.push({
              blockType: 'richTextBlock',
              content: prismicRichTextToLexical(fallbackRt),
            })
          }
        }
      }
    })
  } else {
    // Sin slices: contenido directo (data.content o data.body como rich text)
    const directRt = data.content ?? (Array.isArray(data.body) ? undefined : undefined)
    const rt: PrismicRichTextField = directRt ?? []
    if (Array.isArray(rt) && rt.length > 0) {
      content.push({ blockType: 'richTextBlock', content: prismicRichTextToLexical(rt) })
    }
  }

  const payload: PagePayloadData = {
    title,
    excerpt,
    slug,
    status: doc.first_publication_date ? 'published' : 'draft',
    prismicId: doc.id,
    showImageInArticle: Boolean(heroImageId),
    content,
  }

  if (heroImageId) {
    payload.image = heroImageId
  }

  return payload
}
