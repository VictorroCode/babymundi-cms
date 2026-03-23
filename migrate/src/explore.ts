/**
 * explore.ts — Explorador de la API de Prismic
 *
 * Ejecuta: pnpm migrate:explore
 *
 * Muestra todos los tipos de documentos disponibles en babymundi.prismic.io
 * y un resumen de cuántos documentos hay de cada tipo. Útil antes de
 * ejecutar la migración completa para validar el mapeo de tipos.
 */

import * as prismic from '@prismicio/client'
import 'dotenv/config'

const PRISMIC_ENDPOINT = 'babymundi'

async function explore() {
  const client = prismic.createClient(PRISMIC_ENDPOINT, {
    // Sin access token para API pública
  })

  console.log('🔍 Explorando Prismic: babymundi\n')

  // Obtener todos los tipos disponibles
  const allDocs = await client.getAllByType('*' as any).catch(() => null)

  if (!allDocs) {
    // Fallback: buscar por tipos conocidos
    const types = ['page', 'post', 'blog_post', 'article', 'product', 'store', 'category', 'author']
    console.log('📋 Intentando tipos conocidos...\n')
    for (const type of types) {
      try {
        const docs = await client.getAllByType(type as any)
        if (docs.length > 0) {
          console.log(`  ✅ ${type}: ${docs.length} documentos`)
          if (docs[0]) {
            console.log(`     Campos: ${Object.keys(docs[0].data).join(', ')}`)
          }
        }
      } catch {
        // tipo no existe, continuar
      }
    }
    return
  }

  // Agrupar por tipo
  const byType = allDocs.reduce<Record<string, number>>((acc, doc) => {
    acc[doc.type] = (acc[doc.type] || 0) + 1
    return acc
  }, {})

  console.log('📋 Tipos de documentos encontrados:\n')
  for (const [type, count] of Object.entries(byType)) {
    console.log(`  ${type}: ${count} documentos`)
  }

  console.log('\n📄 Estructura del primer documento por tipo:\n')
  for (const type of Object.keys(byType)) {
    const doc = allDocs.find((d) => d.type === type)
    if (doc) {
      console.log(`── ${type} ──`)
      console.log(`  ID: ${doc.id}`)
      console.log(`  UID: ${doc.uid}`)
      console.log(`  Lang: ${doc.lang}`)
      console.log(`  Tags: ${doc.tags.join(', ')}`)
      console.log(`  Campos: ${Object.keys(doc.data).join(', ')}`)
      console.log()
    }
  }
}

explore().catch(console.error)
