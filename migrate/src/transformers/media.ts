/**
 * media.ts — Descarga imágenes de Prismic CDN y las sube al bucket de R2
 * vía la Local API de Payload (sin credenciales).
 */

import https from 'https'
import http from 'http'
import { URL } from 'url'
import type { Payload } from 'payload'

function downloadBuffer(url: string): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const lib = parsedUrl.protocol === 'https:' ? https : http

    lib
      .get(url, (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () => {
          resolve({
            buffer: Buffer.concat(chunks),
            contentType: res.headers['content-type'] || 'image/jpeg',
          })
        })
        res.on('error', reject)
      })
      .on('error', reject)
  })
}

function contentTypeToExt(contentType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  }
  return map[contentType] || '.jpg'
}

/**
 * Descarga una imagen de Prismic y la sube a Payload vía Local API.
 * Si ya fue subida (prismicId ya existe en la colección), devuelve el ID existente.
 */
export async function uploadPrismicImage(
  payload: Payload,
  prismicUrl: string,
  alt = '',
  prismicId?: string,
): Promise<string | null> {
  try {
    // Verificar si ya existe por prismicId
    if (prismicId) {
      const existing = await payload.find({
        collection: 'media',
        where: { prismicId: { equals: prismicId } },
        limit: 1,
      })
      if (existing.docs.length > 0) {
        return String(existing.docs[0].id)
      }
    }

    // Descargar imagen desde Prismic
    const { buffer, contentType } = await downloadBuffer(prismicUrl)
    const ext = contentTypeToExt(contentType)
    const filename = prismicId
      ? `prismic-${prismicId.replace(/[^a-z0-9]/gi, '-')}${ext}`
      : `prismic-${Date.now()}${ext}`

    // Subir vía Local API
    const created = await payload.create({
      collection: 'media',
      data: { alt, prismicId: prismicId ?? '' },
      file: {
        data: buffer,
        mimetype: contentType,
        name: filename,
        size: buffer.length,
      },
    })

    return String(created.id)
  } catch (err) {
    console.error(`  ⚠️ Error uploading image from ${prismicUrl}:`, err)
    return null
  }
}
