/**
 * migrators/posts.ts
 */

import type { MigrationContext } from '../index'
import { uploadPrismicImage } from '../transformers/media'
import { prismicRichTextToLexical, type PrismicRichTextField } from '../transformers/richtext'

type StepResult = { success: number; failed: number; skipped: number }

const POST_TYPES = ['post', 'blog_post', 'article', 'blog-post']

export async function migratePosts(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of POST_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontrados: ${docs.length} posts en Prismic`)

  for (const doc of docs) {
    try {
      const existing = await ctx.payload.find({
        collection: 'posts',
        where: { prismicId: { equals: doc.id } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        ctx.idMaps.posts.set(doc.id, String(existing.docs[0].id))
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

      let coverId: string | null = null
      const coverUrl = data.cover_image?.url || data.image?.url || data.featured_image?.url
      if (coverUrl) {
        coverId = await uploadPrismicImage(ctx.payload, coverUrl, title, `post-cover-${doc.id}`)
      }

      const richTextField: PrismicRichTextField = data.content || data.body || data.text || []
      const lexicalContent =
        Array.isArray(richTextField) && richTextField.length > 0
          ? prismicRichTextToLexical(richTextField)
          : null

      const authorPrismicId = data.author?.id
      const authorPayloadId = authorPrismicId ? ctx.idMaps.authors.get(authorPrismicId) : undefined

      const categoryPrismicIds: string[] = (data.categories || [])
        .map((c: any) => c?.category?.id || c?.id)
        .filter(Boolean)
      const categoryPayloadIds = categoryPrismicIds
        .map((id) => ctx.idMaps.categories.get(id))
        .filter(Boolean) as string[]

      const created = await ctx.payload.create({
        collection: 'posts',
        data: {
          title,
          slug,
          excerpt: extractText(data.excerpt) || extractText(data.description) || '',
          status: doc.first_publication_date ? 'published' : 'draft',
          publishedAt: doc.first_publication_date,
          prismicId: doc.id,
          ...(coverId ? { coverImage: coverId } : {}),
          ...(authorPayloadId ? { author: authorPayloadId } : {}),
          ...(categoryPayloadIds.length ? { categories: categoryPayloadIds } : {}),
          ...(lexicalContent ? { content: lexicalContent } : {}),
          ...(doc.tags?.length ? { tags: doc.tags.map((tag: string) => ({ tag })) } : {}),
        },
      })

      ctx.idMaps.posts.set(doc.id, String(created.id))
      console.log(`   ✅ Post: ${title}`)
      result.success++
    } catch (err) {
      console.error(`   ❌ Post ${doc.id}:`, err)
      result.failed++
    }
  }

  return result
}

function extractText(field: any): string {
  if (typeof field === 'string') return field
  if (Array.isArray(field)) {
    return field
      .filter((b) => b?.text)
      .map((b) => b.text)
      .join(' ')
  }
  return ''
}

export async function migratePosts(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of POST_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontrados: ${docs.length} posts en Prismic`)

  for (const doc of docs) {
    try {
      const check = await fetch(
        `${ctx.cmsUrl}/api/posts?where[prismicId][equals]=${doc.id}&limit=1`,
        { headers: { Authorization: `JWT ${ctx.token}` } },
      )
      const checkData = (await check.json()) as { docs: { id: string }[] }
      if (checkData.docs.length > 0) {
        ctx.idMaps.posts.set(doc.id, checkData.docs[0].id)
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>

      // Título
      const title = extractText(data.title) || doc.uid || 'Sin título'

      // Slug
      const slug =
        doc.uid ||
        title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

      // Imagen de portada
      let coverId: string | null = null
      const coverUrl = data.cover_image?.url || data.image?.url || data.featured_image?.url
      if (coverUrl) {
        coverId = await uploadPrismicImage(coverUrl, title, `post-cover-${doc.id}`)
      }

      // Contenido rich text
      const richTextField: PrismicRichTextField = data.content || data.body || data.text || []
      const lexicalContent =
        Array.isArray(richTextField) && richTextField.length > 0
          ? prismicRichTextToLexical(richTextField)
          : null

      // Autor
      const authorPrismicId = data.author?.id
      const authorPayloadId = authorPrismicId ? ctx.idMaps.authors.get(authorPrismicId) : undefined

      // Categorías
      const categoryPrismicIds: string[] = (data.categories || [])
        .map((c: any) => c?.category?.id || c?.id)
        .filter(Boolean)
      const categoryPayloadIds = categoryPrismicIds
        .map((id) => ctx.idMaps.categories.get(id))
        .filter(Boolean) as string[]

      const payload: Record<string, any> = {
        title,
        slug,
        excerpt: extractText(data.excerpt) || extractText(data.description) || '',
        status: doc.first_publication_date ? 'published' : 'draft',
        publishedAt: doc.first_publication_date,
        prismicId: doc.id,
        ...(coverId ? { coverImage: coverId } : {}),
        ...(authorPayloadId ? { author: authorPayloadId } : {}),
        ...(categoryPayloadIds.length ? { categories: categoryPayloadIds } : {}),
        ...(lexicalContent ? { content: lexicalContent } : {}),
        ...(doc.tags?.length ? { tags: doc.tags.map((tag: string) => ({ tag })) } : {}),
      }

      const res = await fetch(`${ctx.cmsUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const created = (await res.json()) as { doc: { id: string } }
        ctx.idMaps.posts.set(doc.id, created.doc.id)
        console.log(`   ✅ Post: ${title}`)
        result.success++
      } else {
        const err = await res.text()
        console.error(`   ❌ Post ${title}: ${err}`)
        result.failed++
      }
    } catch (err) {
      console.error(`   ❌ Post ${doc.id}:`, err)
      result.failed++
    }
  }

  return result
}

function extractText(field: any): string {
  if (typeof field === 'string') return field
  if (Array.isArray(field)) {
    return field
      .filter((b) => b?.text)
      .map((b) => b.text)
      .join(' ')
  }
  return ''
}
