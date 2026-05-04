/**
 * migrators/pages.ts
 */

import type { MigrationContext } from '../index'
import { uploadPrismicImage } from '../transformers/media'
import { prismicRichTextToLexical, type PrismicRichTextField } from '../transformers/richtext'

type StepResult = { success: number; failed: number; skipped: number }

const PAGE_TYPES = ['page', 'landing_page', 'landing-page']

export async function migratePages(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of PAGE_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontradas: ${docs.length} páginas en Prismic`)

  for (const doc of docs) {
    try {
      const existing = await ctx.payload.find({
        collection: 'pages',
        where: { prismicId: { equals: doc.id } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        ctx.idMaps.pages.set(doc.id, String(existing.docs[0].id))
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>
      const title = extractText(data.title) || doc.uid || 'Sin título'
      const slug =
        doc.uid ||
        title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

      let heroImageId: string | null = null
      const heroUrl = data.hero_image?.url || data.banner?.url || data.image?.url
      if (heroUrl) {
        heroImageId = await uploadPrismicImage(ctx.payload, heroUrl, title, `page-hero-${doc.id}`)
      }

      const content: any[] = []

      if (Array.isArray(data.slices) || Array.isArray(data.body)) {
        const slices = data.slices || data.body || []
        for (const slice of slices) {
          const sliceType = slice.slice_type || slice.type
          const primary = slice.primary || {}
          const items = slice.items || []

          switch (sliceType) {
            case 'text':
            case 'rich_text':
            case 'text_block': {
              const rt: PrismicRichTextField = primary.text || primary.content || primary.body || []
              if (Array.isArray(rt) && rt.length > 0) {
                content.push({
                  blockType: 'richTextBlock',
                  content: prismicRichTextToLexical(rt),
                })
              }
              break
            }
            case 'image':
            case 'image_block': {
              const imgUrl = primary.image?.url
              if (imgUrl) {
                const imgId = await uploadPrismicImage(
                  ctx.payload,
                  imgUrl,
                  '',
                  `page-slice-img-${doc.id}-${content.length}`,
                )
                if (imgId) {
                  content.push({
                    blockType: 'imageBlock',
                    image: imgId,
                    caption: primary.caption || '',
                  })
                }
              }
              break
            }
            case 'call_to_action':
            case 'cta': {
              content.push({
                blockType: 'callToActionBlock',
                heading: extractText(primary.heading || primary.title) || '',
                description: extractText(primary.description || primary.text) || '',
                ctaLabel: extractText(primary.cta_label || primary.button_label) || '',
                ctaUrl: primary.cta_link?.url || primary.link?.url || '',
              })
              break
            }
            case 'features':
            case 'feature_grid': {
              content.push({
                blockType: 'featureGridBlock',
                heading: extractText(primary.heading || primary.title) || '',
                features: items.map((item: any) => ({
                  icon: item.icon || '',
                  title: extractText(item.title) || '',
                  description: extractText(item.description) || '',
                })),
              })
              break
            }
            default: {
              const fallbackRt: PrismicRichTextField = primary.text || primary.content || []
              if (Array.isArray(fallbackRt) && fallbackRt.length > 0) {
                content.push({
                  blockType: 'richTextBlock',
                  content: prismicRichTextToLexical(fallbackRt),
                })
              }
            }
          }
        }
      } else if (data.content || data.body) {
        const rt: PrismicRichTextField = data.content || data.body || []
        if (Array.isArray(rt) && rt.length > 0) {
          content.push({
            blockType: 'richTextBlock',
            content: prismicRichTextToLexical(rt),
          })
        }
      }

      const created = await ctx.payload.create({
        collection: 'pages',
        data: {
          title,
          excerpt: extractText(data.hero_description || data.description) || '',
          slug,
          status: doc.first_publication_date ? 'published' : 'draft',
          prismicId: doc.id,
          ...(heroImageId ? { image: heroImageId } : {}),
          showImageInArticle: Boolean(heroImageId),
          ...(content.length ? { content } : {}),
        },
      })

      ctx.idMaps.pages.set(doc.id, String(created.id))
      console.log(`   ✅ Page: ${title}`)
      result.success++
    } catch (err) {
      console.error(`   ❌ Page ${doc.id}:`, err)
      result.failed++
    }
  }

  return result
}
