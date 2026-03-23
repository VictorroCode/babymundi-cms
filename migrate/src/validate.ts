/**
 * validate.ts — Validador post-migración
 * Compara recuentos en Prismic vs Payload para verificar la migración.
 *
 * Ejecuta desde la raíz del proyecto: pnpm migrate:validate
 */

import * as prismic from '@prismicio/client'
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '@payload-config'

const PRISMIC_REPO = process.env.PRISMIC_REPO || 'babymundi'

const TYPE_MAP: Record<string, string[]> = {
  posts: ['post', 'blog_post', 'article'],
  products: ['product'],
  stores: ['store', 'tienda', 'shop'],
  pages: ['page'],
  authors: ['author'],
  categories: ['category'],
}

async function validate() {
  console.log('🔍 Validando migración...\n')

  const payload = await getPayload({ config })
  const client = prismic.createClient(PRISMIC_REPO)

  console.log(
    '  Collection'.padEnd(14) + 'Prismic'.padStart(10) + 'Payload'.padStart(10) + '  Status',
  )
  console.log('  ' + '─'.repeat(44))

  for (const [collection, prismicTypes] of Object.entries(TYPE_MAP)) {
    let prismicCount = 0
    for (const type of prismicTypes) {
      try {
        const docs = await client.getAllByType(type as any)
        prismicCount += docs.length
      } catch {
        // tipo no existe
      }
    }

    let payloadCount = -1
    try {
      const result = await payload.find({
        collection: collection as any,
        limit: 1,
      })
      payloadCount = result.totalDocs
    } catch {
      // colección no encontrada
    }

    const ok = payloadCount >= prismicCount
    const status = ok ? '✅' : `⚠️  FALTAN ${prismicCount - payloadCount}`
    console.log(
      `  ${collection.padEnd(14)}${String(prismicCount).padStart(10)}${String(payloadCount).padStart(10)}  ${status}`,
    )
  }
  console.log()

  process.exit(0)
}

validate().catch(console.error)
