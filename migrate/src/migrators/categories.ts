/**
 * migrators/categories.ts
 */

import type { MigrationContext } from '../index'
import { uploadPrismicImage } from '../transformers/media'

type StepResult = { success: number; failed: number; skipped: number }

const CATEGORY_TYPES = ['category', 'categories']

export async function migrateCategories(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of CATEGORY_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontradas: ${docs.length} categorías en Prismic`)

  for (const doc of docs) {
    try {
      const existing = await ctx.payload.find({
        collection: 'categories',
        where: { prismicId: { equals: doc.id } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        ctx.idMaps.categories.set(doc.id, String(existing.docs[0].id))
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>

      let imageId: string | null = null
      const imageUrl = data.image?.url || data.cover?.url
      if (imageUrl) {
        imageId = await uploadPrismicImage(
          ctx.payload,
          imageUrl,
          data.name || '',
          `category-img-${doc.id}`,
        )
        if (imageId) ctx.idMaps.media.set(`category-img-${doc.id}`, imageId)
      }

      const name =
        typeof data.name === 'string'
          ? data.name
          : Array.isArray(data.name)
            ? data.name[0]?.text || 'Sin nombre'
            : 'Sin nombre'

      const slug =
        doc.uid ||
        name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

      const created = await ctx.payload.create({
        collection: 'categories',
        data: {
          name,
          slug,
          description: data.description || '',
          prismicId: doc.id,
          type: inferCategoryType(doc.tags),
          ...(imageId ? { image: imageId } : {}),
        },
      })

      ctx.idMaps.categories.set(doc.id, String(created.id))
      console.log(`   ✅ Category: ${name}`)
      result.success++
    } catch (err) {
      console.error(`   ❌ Category ${doc.id}:`, err)
      result.failed++
    }
  }

  return result
}

function inferCategoryType(tags: string[]): string {
  if (tags.some((t) => t.toLowerCase().includes('product'))) return 'product'
  if (tags.some((t) => t.toLowerCase().includes('store'))) return 'store'
  if (tags.some((t) => t.toLowerCase().includes('blog') || t.toLowerCase().includes('post')))
    return 'blog'
  return 'general'
}

export async function migrateCategories(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of CATEGORY_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontradas: ${docs.length} categorías en Prismic`)

  for (const doc of docs) {
    try {
      const check = await fetch(
        `${ctx.cmsUrl}/api/categories?where[prismicId][equals]=${doc.id}&limit=1`,
        { headers: { Authorization: `JWT ${ctx.token}` } },
      )
      const checkData = (await check.json()) as { docs: { id: string }[] }
      if (checkData.docs.length > 0) {
        ctx.idMaps.categories.set(doc.id, checkData.docs[0].id)
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>

      let imageId: string | null = null
      const imageUrl = data.image?.url || data.cover?.url
      if (imageUrl) {
        imageId = await uploadPrismicImage(imageUrl, data.name || '', `category-img-${doc.id}`)
        if (imageId) ctx.idMaps.media.set(`category-img-${doc.id}`, imageId)
      }

      const name =
        typeof data.name === 'string'
          ? data.name
          : Array.isArray(data.name)
            ? data.name[0]?.text || 'Sin nombre'
            : 'Sin nombre'

      const slug =
        doc.uid ||
        name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

      const payload: Record<string, any> = {
        name,
        slug,
        description: data.description || '',
        prismicId: doc.id,
        type: inferCategoryType(doc.tags),
        ...(imageId ? { image: imageId } : {}),
      }

      const res = await fetch(`${ctx.cmsUrl}/api/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const created = (await res.json()) as { doc: { id: string } }
        ctx.idMaps.categories.set(doc.id, created.doc.id)
        console.log(`   ✅ Category: ${name}`)
        result.success++
      } else {
        const err = await res.text()
        console.error(`   ❌ Category ${name}: ${err}`)
        result.failed++
      }
    } catch (err) {
      console.error(`   ❌ Category ${doc.id}:`, err)
      result.failed++
    }
  }

  return result
}

function inferCategoryType(tags: string[]): string {
  if (tags.some((t) => t.toLowerCase().includes('product'))) return 'product'
  if (tags.some((t) => t.toLowerCase().includes('store'))) return 'store'
  if (tags.some((t) => t.toLowerCase().includes('blog') || t.toLowerCase().includes('post')))
    return 'blog'
  return 'general'
}
