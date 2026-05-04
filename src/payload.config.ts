import fs from 'fs'
import path from 'path'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { buildConfig } from 'payload'
import { es } from '@payloadcms/translations/languages/es'
import { en } from '@payloadcms/translations/languages/en'
import { fileURLToPath } from 'url'
import { CloudflareContext, getCloudflareContext } from '@opennextjs/cloudflare'
import { GetPlatformProxyOptions } from 'wrangler'
import { r2Storage } from '@payloadcms/storage-r2'
import { resendAdapter } from '@payloadcms/email-resend'
import { seoPlugin } from '@payloadcms/plugin-seo'
import { searchPlugin } from '@payloadcms/plugin-search'
import { richEditor } from './fields/richTextEditors'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Authors } from './collections/Authors'
import { Categories } from './collections/Categories'
import { Pages } from './collections/Pages'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { Stores } from './collections/Stores'
import { Tags } from './collections/Tags'

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
const hyperdriveConnectionString = (
  cloudflare?.env as { HYPERDRIVE?: { connectionString?: string } }
)?.HYPERDRIVE?.connectionString

const adminURL =
  process.env.NEXT_PUBLIC_SERVER_URL || process.env.SERVER_URL || 'http://localhost:3000'
const frontendURL = process.env.FRONTEND_URL || 'http://localhost:4321'
const allowedOrigins = Array.from(new Set([adminURL, frontendURL]))

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
      logout: {
        Button: '/components/LogoutButton',
      },
    },
  },
  auth: {
    jwtOrder: ['cookie'],
  },
  // Permite que la web de Astro llame a la API de Payload
  cors: allowedOrigins,
  // Permite embeber el admin en iframes desde el dominio de Astro (livePreview)
  csrf: allowedOrigins,
  i18n: {
    supportedLanguages: { es, en },
    fallbackLanguage: 'es',
  },
  collections: [Users, Media, Authors, Categories, Tags, Pages, Posts, Products, Stores],
  editor: richEditor,
  secret: process.env.PAYLOAD_SECRET || '',
  email: resendAdapter({
    defaultFromAddress: process.env.EMAIL_FROM_ADDRESS || 'onboarding@resend.dev',
    defaultFromName: process.env.EMAIL_FROM_NAME || 'Babymundi',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      // En producción (Workers): usa Hyperdrive para acelerar las conexiones a Neon
      // En local dev / CLI: usa siempre DATABASE_URL directamente (nunca Hyperdrive)
      connectionString: isProduction
        ? (hyperdriveConnectionString ?? process.env.DATABASE_URL ?? '')
        : (process.env.DATABASE_URL ?? ''),
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  logger: isProduction ? cloudflareLogger : undefined,
  plugins: [
    r2Storage({
      bucket: cloudflare.env.R2,
      collections: { media: true },
    }),
    seoPlugin({
      collections: ['posts', 'categories', 'authors', 'pages'],
      tabbedUI: false,
      generateTitle: ({ doc }) => `${doc?.title || doc?.name || ''} | Babymundi`,
      generateDescription: ({ doc }) => doc?.excerpt || doc?.description || doc?.bio || '',
      generateURL: ({ doc, collectionConfig }) => {
        const paths: Record<string, string> = {
          posts: 'blog',
          categories: 'categorias',
          authors: 'autores',
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
        labels: {
          singular: '🔎 Search',
          plural: '🔎 Search',
        },
        admin: {
          group: 'Utilidades',
        },
      },
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
