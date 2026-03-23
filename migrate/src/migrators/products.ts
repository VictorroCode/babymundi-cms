/**
 * migrators/products.ts
 */

import type { MigrationContext } from '../index'
import { uploadPrismicImage } from '../transformers/media'
import { prismicRichTextToLexical, type PrismicRichTextField } from '../transformers/richtext'

type StepResult = { success: number; failed: number; skipped: number }

const PRODUCT_TYPES = ['product', 'products']

export async function migrateProducts(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of PRODUCT_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontrados: ${docs.length} productos en Prismic`)

  for (const doc of docs) {
    try {
      const existing = await ctx.payload.find({
        collection: 'products',
        where: { prismicId: { equals: doc.id } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        ctx.idMaps.products.set(doc.id, String(existing.docs[0].id))
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>

      const title = extractText(data.title || data.name) || doc.uid || 'Sin título'
      const slug =
        doc.uid ||
        title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

      const imagePayloadIds: string[] = []
      const imageFields = ['image', 'images', 'main_image', 'cover', 'photo']
      for (const field of imageFields) {
        const val = data[field]
        if (!val) continue
        const urls: string[] = Array.isArray(val)
          ? val.map((i: any) => i?.image?.url || i?.url).filter(Boolean)
          : [val.url].filter(Boolean)
        for (const url of urls) {
          const id = await uploadPrismicImage(
            ctx.payload,
            url,
            title,
            `product-img-${doc.id}-${imagePayloadIds.length}`,
          )
          if (id) imagePayloadIds.push(id)
        }
        if (imagePayloadIds.length > 0) break
      }

      const richTextField: PrismicRichTextField =
        data.description || data.content || data.body || []
      const lexicalDescription =
        Array.isArray(richTextField) && richTextField.length > 0
          ? prismicRichTextToLexical(richTextField)
          : null

      const categoryPrismicIds: string[] = (data.categories || [])
        .map((c: any) => c?.category?.id || c?.id)
        .filter(Boolean)
      const categoryPayloadIds = categoryPrismicIds
        .map((id) => ctx.idMaps.categories.get(id))
        .filter(Boolean) as string[]

      const created = await ctx.payload.create({
        collection: 'products',
        data: {
          title,
          slug,
          brand: data.brand || '',
          excerpt: extractText(data.excerpt || data.short_description) || '',
          price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || undefined,
          affiliateUrl: data.affiliate_url || data.link?.url || '',
          status: doc.first_publication_date ? 'published' : 'draft',
          prismicId: doc.id,
          ...(imagePayloadIds.length
            ? { images: imagePayloadIds.map((id) => ({ image: id })) }
            : {}),
          ...(categoryPayloadIds.length ? { categories: categoryPayloadIds } : {}),
          ...(lexicalDescription ? { description: lexicalDescription } : {}),
        },
      })

      ctx.idMaps.products.set(doc.id, String(created.id))
      console.log(`   ✅ Product: ${title}`)
      result.success++
    } catch (err) {
      console.error(`   ❌ Product ${doc.id}:`, err)
      result.failed++
    }
  }

  return result
}

function extractText(field: any): string {
  if (typeof field === 'string') return field
  if (Array.isArray(field))
    return field
      .filter((b) => b?.text)
      .map((b) => b.text)
      .join(' ')
  return ''
}

export async function migrateProducts(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of PRODUCT_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontrados: ${docs.length} productos en Prismic`)

  for (const doc of docs) {
    try {
      const check = await fetch(
        `${ctx.cmsUrl}/api/products?where[prismicId][equals]=${doc.id}&limit=1`,
        { headers: { Authorization: `JWT ${ctx.token}` } },
      )
      const checkData = (await check.json()) as { docs: { id: string }[] }
      if (checkData.docs.length > 0) {
        ctx.idMaps.products.set(doc.id, checkData.docs[0].id)
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>

      const title = extractText(data.title || data.name) || doc.uid || 'Sin título'
      const slug =
        doc.uid ||
        title
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

      // Imágenes del producto
      const imagePayloadIds: string[] = []
      const imageFields = ['image', 'images', 'main_image', 'cover', 'photo']
      for (const field of imageFields) {
        const val = data[field]
        if (!val) continue
        const urls: string[] = Array.isArray(val)
          ? val.map((i: any) => i?.image?.url || i?.url).filter(Boolean)
          : [val.url].filter(Boolean)
        for (const url of urls) {
          const id = await uploadPrismicImage(
            url,
            title,
            `product-img-${doc.id}-${imagePayloadIds.length}`,
          )
          if (id) imagePayloadIds.push(id)
        }
        if (imagePayloadIds.length > 0) break
      }

      // Descripción rich text
      const richTextField: PrismicRichTextField =
        data.description || data.content || data.body || []
      const lexicalDescription =
        Array.isArray(richTextField) && richTextField.length > 0
          ? prismicRichTextToLexical(richTextField)
          : null

      const categoryPrismicIds: string[] = (data.categories || [])
        .map((c: any) => c?.category?.id || c?.id)
        .filter(Boolean)
      const categoryPayloadIds = categoryPrismicIds
        .map((id) => ctx.idMaps.categories.get(id))
        .filter(Boolean) as string[]

      const payload: Record<string, any> = {
        title,
        slug,
        brand: data.brand || '',
        excerpt: extractText(data.excerpt || data.short_description) || '',
        price: typeof data.price === 'number' ? data.price : parseFloat(data.price) || undefined,
        affiliateUrl: data.affiliate_url || data.link?.url || '',
        status: doc.first_publication_date ? 'published' : 'draft',
        prismicId: doc.id,
        ...(imagePayloadIds.length ? { images: imagePayloadIds.map((id) => ({ image: id })) } : {}),
        ...(categoryPayloadIds.length ? { categories: categoryPayloadIds } : {}),
        ...(lexicalDescription ? { description: lexicalDescription } : {}),
      }

      const res = await fetch(`${ctx.cmsUrl}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const created = (await res.json()) as { doc: { id: string } }
        ctx.idMaps.products.set(doc.id, created.doc.id)
        console.log(`   ✅ Product: ${title}`)
        result.success++
      } else {
        const err = await res.text()
        console.error(`   ❌ Product ${title}: ${err}`)
        result.failed++
      }
    } catch (err) {
      console.error(`   ❌ Product ${doc.id}:`, err)
      result.failed++
    }
  }

  return result
}

function extractText(field: any): string {
  if (typeof field === 'string') return field
  if (Array.isArray(field))
    return field
      .filter((b) => b?.text)
      .map((b) => b.text)
      .join(' ')
  return ''
}
