import fs from 'fs'
import path from 'path'
import { sqliteD1Adapter } from '@payloadcms/db-d1-sqlite'
import { buildConfig } from 'payload'
import { es } from '@payloadcms/translations/languages/es'
import { en } from '@payloadcms/translations/languages/en'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { formBuilderPlugin } from '@payloadcms/plugin-form-builder'
import { richEditor } from './fields/richTextEditors'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { Stores } from './collections/Stores'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const realpath = (value: string) => (fs.existsSync(value) ? fs.realpathSync(value) : undefined)

const isCLI = process.argv.some((value) => realpath(value).endsWith(path.join('payload', 'bin.js')))
const isProduction = process.env.NODE_ENV === 'production'

const createLog =
  (level: string, fn: typeof console.log) => (objOrMsg: object | string, msg?: string) => {
    if (typeof objOrMsg === 'string') {
      fn(JSON.stringify({ level, msg: objOrMsg }))
    } else {
      fn(JSON.stringify({ level, ...objOrMsg, msg: msg ?? (objOrMsg as { msg?: string }).msg }))
    }
  }

const cloudflareLogger = {
  level: process.env.PAYLOAD_LOG_LEVEL || 'debug',
  trace: createLog('trace', console.debug),
  debug: createLog('debug', console.debug),
  info: createLog('info', console.log),
  warn: createLog('warn', console.warn),
  error: (objOrMsg: object | string, msg?: string) => {
    // Always log errors with full stack traces
    if (objOrMsg instanceof Error) {
      console.error(
        JSON.stringify({ level: 'error', msg: objOrMsg.message, stack: objOrMsg.stack }),
      )
    } else {
      createLog('error', console.error)(objOrMsg, msg)
    }
  },
  fatal: (objOrMsg: object | string, msg?: string) => {
    if (objOrMsg instanceof Error) {
      console.error(
        JSON.stringify({ level: 'fatal', msg: objOrMsg.message, stack: objOrMsg.stack }),
      )
    } else {
      createLog('fatal', console.error)(objOrMsg, msg)
    }
  },
  silent: () => {},
} as any // Use PayloadLogger type when it's exported

const isRemoteBindings = isProduction || process.env.CLOUDFLARE_REMOTE === 'true'
const cloudflare =
  isCLI || !isProduction
    ? await getCloudflareContextFromWrangler(isRemoteBindings)
    : await getCloudflareContext({ async: true })

console.log(
  `[DB] mode=${isProduction ? 'production' : isCLI ? 'cli' : 'dev'} | remoteBindings=${isRemoteBindings} | CLOUDFLARE_REMOTE=${process.env.CLOUDFLARE_REMOTE ?? '(unset)'} | NODE_ENV=${process.env.NODE_ENV}`,
)

export default buildConfig({
  admin: {
    user: Users.slug,
    meta: {
      titleSuffix: '— babymundi',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: '/components/Logo',
        Icon: '/components/Icon',
      },
    },
    livePreview: {
      // Colecciones que tienen vista previa en el panel
      collections: ['posts', 'products', 'stores', 'pages'],
      breakpoints: [
        { label: 'Móvil', name: 'mobile', width: 375, height: 667 },
        { label: 'Tablet', name: 'tablet', width: 768, height: 1024 },
        { label: 'Escritorio', name: 'desktop', width: 1440, height: 900 },
      ],
    },
  },
  // Permite que la web de Astro llame a la API de Payload
  cors: [
    process.env.FRONTEND_URL || 'http://localhost:4321',
    'http://localhost:4321', // Astro dev server
  ].filter(Boolean),
  // Permite embeber el admin en iframes desde el dominio de Astro (livePreview)
  csrf: [process.env.FRONTEND_URL || 'http://localhost:4321', 'http://localhost:4321'].filter(
    Boolean,
  ),
  i18n: {
    supportedLanguages: { es, en },
    fallbackLanguage: 'es',
  },
  collections: [Users, Media, Authors, Categories, Pages, Posts, Products, Stores],
  editor: richEditor,
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: sqliteD1Adapter({ binding: cloudflare.env.D1 }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    seoPlugin({
      collections: ['posts', 'products', 'stores', 'pages'],
      generateTitle: ({ doc }) => `${doc?.title} | Babymundi`,
      generateDescription: ({ doc }) => doc?.excerpt || doc?.description || '',
      generateURL: ({ doc, collectionConfig }) => {
        const paths: Record<string, string> = {
          posts: 'blog',
          products: 'productos',
          stores: 'tiendas',
          pages: '',
        }
        const base = process.env.FRONTEND_URL || ''
        const prefix = paths[collectionConfig.slug] ?? collectionConfig.slug
        return prefix ? `${base}/${prefix}/${doc?.slug}` : `${base}/${doc?.slug}`
      },
    }),
    searchPlugin({
      collections: ['posts', 'products', 'stores'],
      defaultPriorities: {
        posts: 10,
        products: 20,
        stores: 30,
      },
      searchOverrides: {
        admin: {
          group: 'Utilidades',
        },
      },
    }),
    formBuilderPlugin({
      fields: { payment: false },
      formOverrides: { admin: { group: 'Formularios' } },
      formSubmissionOverrides: { admin: { group: 'Formularios' } },
    }),
  ],
})

// Adapted from https://github.com/opennextjs/opennextjs-cloudflare/blob/d00b3a13e42e65aad76fba41774815726422cc39/packages/cloudflare/src/api/cloudflare-context.ts#L328C36-L328C46
function getCloudflareContextFromWrangler(remoteBindings = false): Promise<CloudflareContext> {
  return import(/* webpackIgnore: true */ `${'__wrangler'.replaceAll('_', '')}`).then(
    ({ getPlatformProxy }) =>
      getPlatformProxy({
        environment: process.env.CLOUDFLARE_ENV,
        remoteBindings,
      } satisfies GetPlatformProxyOptions),
  )
}
