# babymundi-cms

CMS headless construido con [Payload CMS](https://payloadcms.com/) y desplegado como Cloudflare Worker mediante [OpenNext](https://opennext.js.org/cloudflare). La base de datos es PostgreSQL (Neon) y el almacenamiento de medios usa Cloudflare R2.

---

## Variables de entorno

Copia `.env.example` a `.env` y rellena los valores:

| Variable           | Descripción                                              |
| ------------------ | -------------------------------------------------------- |
| `DATABASE_URL`     | Cadena de conexión PostgreSQL (Neon u otro proveedor)   |
| `PAYLOAD_SECRET`   | Secreto aleatorio para firmar tokens de Payload          |
| `FRONTEND_URL`     | URL del frontend (para links de previsualización)        |
| `RESEND_API_KEY`   | API key de [Resend](https://resend.com) para el email    |
| `EMAIL_FROM_ADDRESS` | Dirección del remitente en los correos                 |
| `EMAIL_FROM_NAME`  | Nombre del remitente en los correos                      |
| `PAYLOAD_LOG_LEVEL` | Nivel de log (`debug`, `info`, `warn`, `error`)         |

> En producción las variables se configuran en el panel de Cloudflare Workers (Settings → Variables and Secrets).

---

## Instalación

```bash
pnpm install
```

---

## Desarrollo local

```bash
# Arrancar servidor de desarrollo (Next.js + Payload admin)
pnpm dev

# Si hay problemas de caché, borrar .next y .open-next antes
pnpm devsafe
```

El admin de Payload estará disponible en `http://localhost:3000/admin`.

---

## Migraciones de esquema (Payload)

Cuando se modifican colecciones o campos en el CMS hay que crear y ejecutar migraciones de base de datos.

```bash
# Crear una nueva migración (genera un fichero en src/migrations/)
pnpm migrate:generate

# Ejecutar migraciones pendientes contra la base de datos
pnpm migrate:run
```

Las migraciones se crean como ficheros TypeScript en `src/migrations/`. Están versionadas en git y se ejecutan automáticamente en el proceso de despliegue.

---

## Migración de datos (Prismic → Payload)

El directorio `migrate/` contiene los scripts para importar contenido desde Prismic. Requiere su propio fichero `.env` — copia `migrate/.env.example` a `migrate/.env`:

| Variable        | Descripción                               |
| --------------- | ----------------------------------------- |
| `PRISMIC_REPO`  | Nombre del repositorio de Prismic         |

### Comandos

```bash
# Explorar los tipos de documentos disponibles en Prismic antes de migrar
pnpm migrate:explore

# Ejecutar la migración completa (en orden: authors → categories → posts → products → stores → pages)
pnpm migrate

# Validar la migración: compara recuentos en Prismic vs Payload
pnpm migrate:validate
```

> **Orden de migración recomendado:** ejecutar primero `explore` para comprobar que los tipos de Prismic coinciden con el mapeo esperado, luego `migrate` y finalmente `validate`.

---

## Tests

### Tests de integración (Vitest)

Ubicados en `tests/int/`. Son tests offline que no requieren conexión a servicios externos.

```bash
# Ejecutar todos los tests de integración
pnpm test:int
```

### Todos los tests

```bash
pnpm test
```

---

## Generación de tipos e importmap

Ejecutar tras cualquier cambio en el esquema de colecciones:

```bash
# Regenerar tipos TypeScript de Payload y de Cloudflare Workers
pnpm generate:types

# Solo tipos de Payload
pnpm generate:types:payload

# Solo tipos de Cloudflare (cloudflare-env.d.ts)
pnpm generate:types:cloudflare

# Regenerar el importmap del admin (necesario al añadir/mover componentes)
pnpm generate:importmap
```

---

## Despliegue en Cloudflare

El proyecto se despliega como un Cloudflare Worker usando `opennextjs-cloudflare`.

### Autenticación con Wrangler

La primera vez, autenticarse con Cloudflare:

```bash
pnpm wrangler login
```

### Despliegue completo

```bash
# Build + migraciones de BD + despliegue del Worker
pnpm deploy
```

Este comando encadena:
1. `next build` — construye la aplicación
2. `pnpm deploy:database` — genera y ejecuta migraciones de esquema
3. `opennextjs-cloudflare build && deploy` — empaqueta y sube el Worker

### Despliegues parciales

```bash
# Solo desplegar la app (sin tocar la base de datos)
pnpm deploy:app

# Solo aplicar migraciones de base de datos
pnpm deploy:database
```

### Preview local del Worker

```bash
pnpm preview
```

---

## Cloudflare R2 (almacenamiento de medios)

Las imágenes se almacenan en un bucket de Cloudflare R2 (`babymundi-assets`). El binding está configurado en `wrangler.jsonc`:

```jsonc
"r2_buckets": [
  { "binding": "R2", "bucket_name": "babymundi-assets" }
]
```

En desarrollo, Wrangler usa un bucket local simulado automáticamente al ejecutar `pnpm dev`.

### Hyperdrive (opcional)

Para acelerar las conexiones a Neon desde el Worker se puede habilitar [Cloudflare Hyperdrive](https://developers.cloudflare.com/hyperdrive/). Instrucciones en el comentario del `wrangler.jsonc`.

---

## Logs en Cloudflare

Por defecto los logs no están habilitados para no consumir cuota. Se pueden activar con un clic desde el panel de Cloudflare → Workers → tu worker → Observability → [Enable Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/#enable-workers-logs).

El logger está configurado en `payload.config.ts` para usar `console.*` (compatible con Workers). El nivel se controla con `PAYLOAD_LOG_LEVEL`.

---

## Limitaciones conocidas

- **Tamaño del Worker:** Cloudflare Workers tiene un límite de 3 MB de bundle. El despliegue requiere el plan de pago. Si al añadir dependencias el bundle crece demasiado, revisar las importaciones.
- **GraphQL:** El soporte de GraphQL en Workers puede ser inestable por [problemas upstream en workerd](https://github.com/cloudflare/workerd/issues/5175).
