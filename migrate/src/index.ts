/**
 * index.ts — Orquestador principal de migración Prismic → Payload CMS
 *
 * Ejecuta desde la raíz del proyecto: pnpm migrate
 *
 * Variables de entorno necesarias (copia .env.example a .env y rellena):
 *   PRISMIC_REPO       - nombre del repositorio de Prismic (ej: babymundi)
 *   CLOUDFLARE_REMOTE  - (opcional) "true" para usar D1 + R2 reales en local
 *
 * Orden de migración (respeta dependencias):
 *   1. Authors
 *   2. Categories
 *   3. Posts
 *   4. Products
 *   5. Stores
 *   6. Pages
 */

import * as prismic from '@prismicio/client'
import 'dotenv/config'
import type { Payload } from 'payload'
import { getPayload } from 'payload'
import config from '@payload-config'
import { migrateAuthors } from './migrators/authors'
import { migrateCategories } from './migrators/categories'
import { migratePosts } from './migrators/posts'
import { migrateProducts } from './migrators/products'
import { migrateStores } from './migrators/stores'
import { migratePages } from './migrators/pages'

const PRISMIC_REPO = process.env.PRISMIC_REPO || 'babymundi'

export type MigrationContext = {
  client: prismic.Client
  payload: Payload
  /** Map of prismicId -> payloadId for each collection */
  idMaps: {
    media: Map<string, string>
    authors: Map<string, string>
    categories: Map<string, string>
    posts: Map<string, string>
    products: Map<string, string>
    stores: Map<string, string>
    pages: Map<string, string>
  }
}

async function main() {
  console.log('🚀 Babymundi — Migración Prismic → Payload CMS\n')
  console.log(`📡 Prismic repo: ${PRISMIC_REPO}`)

  // Inicializar Payload (Local API — sin credenciales)
  console.log('⚙️  Iniciando Payload Local API...')
  const payload = await getPayload({ config })
  console.log('   ✅ Payload inicializado\n')

  const client = prismic.createClient(PRISMIC_REPO)

  const ctx: MigrationContext = {
    client,
    payload,
    idMaps: {
      media: new Map(),
      authors: new Map(),
      categories: new Map(),
      posts: new Map(),
      products: new Map(),
      stores: new Map(),
      pages: new Map(),
    },
  }

  const steps = [
    { name: 'Authors', fn: migrateAuthors },
    { name: 'Categories', fn: migrateCategories },
    { name: 'Posts', fn: migratePosts },
    { name: 'Products', fn: migrateProducts },
    { name: 'Stores', fn: migrateStores },
    { name: 'Pages', fn: migratePages },
  ]

  const results: Record<string, { success: number; failed: number; skipped: number }> = {}

  for (const step of steps) {
    console.log(`\n──────────────────────────────────────`)
    console.log(`📦 Migrando: ${step.name}`)
    console.log(`──────────────────────────────────────`)
    try {
      results[step.name] = await step.fn(ctx)
    } catch (err) {
      console.error(`\n❌ Error en migración de ${step.name}:`, err)
      results[step.name] = { success: 0, failed: 1, skipped: 0 }
    }
  }

  // Resumen final
  console.log('\n\n══════════════════════════════════════')
  console.log('📊 RESUMEN DE MIGRACIÓN')
  console.log('══════════════════════════════════════')
  for (const [name, r] of Object.entries(results)) {
    console.log(`  ${name.padEnd(12)} → ✅ ${r.success} | ❌ ${r.failed} | ⏭️  ${r.skipped}`)
  }
  console.log()

  process.exit(0)
}

main().catch((err) => {
  console.error('\n💥 Migración fallida:', err)
  process.exit(1)
})
