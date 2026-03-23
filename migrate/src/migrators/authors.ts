/**
 * migrators/authors.ts
 * Migra documentos de tipo "author" desde Prismic a Payload.
 */

import type { MigrationContext } from '../index'
import { uploadPrismicImage } from '../transformers/media'

type StepResult = { success: number; failed: number; skipped: number }

const AUTHOR_TYPES = ['author', 'authors']

export async function migrateAuthors(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of AUTHOR_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontrados: ${docs.length} autores en Prismic`)

  for (const doc of docs) {
    try {
      const existing = await ctx.payload.find({
        collection: 'authors',
        where: { prismicId: { equals: doc.id } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        ctx.idMaps.authors.set(doc.id, String(existing.docs[0].id))
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>

      let avatarId: string | null = null
      const avatarUrl = data.avatar?.url || data.photo?.url || data.image?.url
      if (avatarUrl) {
        avatarId = await uploadPrismicImage(
          ctx.payload,
          avatarUrl,
          data.name || '',
          `author-avatar-${doc.id}`,
        )
        if (avatarId) ctx.idMaps.media.set(`author-avatar-${doc.id}`, avatarId)
      }

      const slug =
        doc.uid ||
        (typeof data.name === 'string' ? data.name.toLowerCase().replace(/\s+/g, '-') : doc.id)

      const created = await ctx.payload.create({
        collection: 'authors',
        data: {
          name: data.name || slug,
          slug,
          bio: typeof data.bio === 'string' ? data.bio : data.description || '',
          prismicId: doc.id,
          ...(avatarId ? { avatar: avatarId } : {}),
        },
      })

      ctx.idMaps.authors.set(doc.id, String(created.id))
      console.log(`   ✅ Author: ${data.name || slug}`)
      result.success++
    } catch (err) {
      console.error(`   ❌ Author ${doc.id}:`, err)
      result.failed++
    }
  }

  return result
}

export async function migrateAuthors(ctx: MigrationContext): Promise<StepResult> {
  const result: StepResult = { success: 0, failed: 0, skipped: 0 }

  let docs: Awaited<ReturnType<typeof ctx.client.getAllByType>> = []
  for (const type of AUTHOR_TYPES) {
    try {
      const found = await ctx.client.getAllByType(type as any)
      docs = [...docs, ...found]
    } catch {
      // tipo no existe
    }
  }

  console.log(`   Encontrados: ${docs.length} autores en Prismic`)

  for (const doc of docs) {
    try {
      // Verificar si ya existe
      const check = await fetch(
        `${ctx.cmsUrl}/api/authors?where[prismicId][equals]=${doc.id}&limit=1`,
        { headers: { Authorization: `JWT ${ctx.token}` } },
      )
      const checkData = (await check.json()) as { docs: { id: string }[] }
      if (checkData.docs.length > 0) {
        ctx.idMaps.authors.set(doc.id, checkData.docs[0].id)
        result.skipped++
        continue
      }

      const data = doc.data as Record<string, any>

      // Subir avatar si existe
      let avatarId: string | null = null
      const avatarUrl = data.avatar?.url || data.photo?.url || data.image?.url
      if (avatarUrl) {
        avatarId = await uploadPrismicImage(avatarUrl, data.name || '', `author-avatar-${doc.id}`)
        if (avatarId) ctx.idMaps.media.set(`author-avatar-${doc.id}`, avatarId)
      }

      const slug =
        doc.uid ||
        (typeof data.name === 'string' ? data.name.toLowerCase().replace(/\s+/g, '-') : doc.id)

      const payload: Record<string, any> = {
        name: data.name || slug,
        slug,
        bio: typeof data.bio === 'string' ? data.bio : data.description || '',
        prismicId: doc.id,
        ...(avatarId ? { avatar: avatarId } : {}),
      }

      const res = await fetch(`${ctx.cmsUrl}/api/authors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `JWT ${ctx.token}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        const created = (await res.json()) as { doc: { id: string } }
        ctx.idMaps.authors.set(doc.id, created.doc.id)
        console.log(`   ✅ Author: ${payload.name}`)
        result.success++
      } else {
        const err = await res.text()
        console.error(`   ❌ Author ${payload.name}: ${err}`)
        result.failed++
      }
    } catch (err) {
      console.error(`   ❌ Author ${doc.id}:`, err)
      result.failed++
    }
  }

  return result
}
