/**
 * migrators/stores.ts
 */

import type { MigrationContext } from '../index'
import { uploadPrismicImage } from '../transformers/media'
import { prismicRichTextToLexical, type PrismicRichTextField } from '../transformers/richtext'

type StepResult = { success: number; failed: number; skipped: number }

const STORE_TYPES = ['store', 'tienda', 'shop', 'online_store']

export async function migrateStores(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of STORE_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontradas: ${docs.length} tiendas en Prismic`)

  for (const doc of docs) {
    try {
      const existing = await ctx.payload.find({
        collection: 'stores',
        where: { prismicId: { equals: doc.id } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        ctx.idMaps.stores.set(doc.id, String(existing.docs[0].id))
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>
      const name = extractText(data.name || data.title) || doc.uid || 'Sin nombre'
      const slug =
        doc.uid ||
        name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

      let logoId: string | null = null
      const logoUrl = data.logo?.url || data.image?.url
      if (logoUrl) {
        logoId = await uploadPrismicImage(ctx.payload, logoUrl, name, `store-logo-${doc.id}`)
      }

      const richTextField: PrismicRichTextField = data.description || data.content || []
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

      const websiteUrl = data.website?.url || data.url?.url || data.link?.url || ''

      const created = await ctx.payload.create({
        collection: 'stores',
        data: {
          name,
          slug,
          type: websiteUrl ? 'online' : 'physical',
          excerpt: extractText(data.excerpt || data.short_description) || '',
          websiteUrl,
          affiliateUrl: data.affiliate_url || '',
          country: data.country || 'ES',
          status: doc.first_publication_date ? 'published' : 'draft',
          prismicId: doc.id,
          ...(logoId ? { logo: logoId } : {}),
          ...(categoryPayloadIds.length ? { categories: categoryPayloadIds } : {}),
          ...(lexicalDescription ? { description: lexicalDescription } : {}),
        },
      })

      ctx.idMaps.stores.set(doc.id, String(created.id))
      console.log(`   ✅ Store: ${name}`)
      result.success++
    } catch (err) {
      console.error(`   ❌ Store ${doc.id}:`, err)
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

export async function migrateStores(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of STORE_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontradas: ${docs.length} tiendas en Prismic`)

  for (const doc of docs) {
    try {
      const check = await fetch(
        `${ctx.cmsUrl}/api/stores?where[prismicId][equals]=${doc.id}&limit=1`,
        { headers: { Authorization: `JWT ${ctx.token}` } },
      )
      const checkData = (await check.json()) as { docs: { id: string }[] }
      if (checkData.docs.length > 0) {
        ctx.idMaps.stores.set(doc.id, checkData.docs[0].id)
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>
      const name = extractText(data.name || data.title) || doc.uid || 'Sin nombre'
      const slug =
        doc.uid ||
        name
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, '')

      let logoId: string | null = null
      const logoUrl = data.logo?.url || data.image?.url
      if (logoUrl) {
        logoId = await uploadPrismicImage(logoUrl, name, `store-logo-${doc.id}`)
      }

      const richTextField: PrismicRichTextField = data.description || data.content || []
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

      const websiteUrl = data.website?.url || data.url?.url || data.link?.url || ''

      const payload: Record<string, any> = {
        name,
        slug,
        type: websiteUrl ? 'online' : 'physical',
        excerpt: extractText(data.excerpt || data.short_description) || '',
        websiteUrl,
        affiliateUrl: data.affiliate_url || '',
        country: data.country || 'ES',
        status: doc.first_publication_date ? 'published' : 'draft',
        prismicId: doc.id,
        ...(logoId ? { logo: logoId } : {}),
        ...(categoryPayloadIds.length ? { categories: categoryPayloadIds } : {}),
        ...(lexicalDescription ? { description: lexicalDescription } : {}),
      }

      const res = await fetch(`${ctx.cmsUrl}/api/stores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const created = (await res.json()) as { doc: { id: string } }
        ctx.idMaps.stores.set(doc.id, created.doc.id)
        console.log(`   ✅ Store: ${name}`)
        result.success++
      } else {
        const err = await res.text()
        console.error(`   ❌ Store ${name}: ${err}`)
        result.failed++
      }
    } catch (err) {
      console.error(`   ❌ Store ${doc.id}:`, err)
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
