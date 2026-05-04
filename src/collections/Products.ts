import type { CollectionConfig } from 'payload'
import { richEditor } from '../fields/richTextEditors'
import { manualSlugField } from '../fields/slug'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: {
    singular: 'Producto',
    plural: '🛍️ Productos',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Contenido',
    defaultColumns: ['title', 'brand', 'price', 'status'],
    preview: (doc) => `${process.env.FRONTEND_URL}/productos/${doc?.slug}`,
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  versions: {
    drafts: { autosave: { interval: 375 } },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Nombre del producto',
      required: true,
    },
    manualSlugField('title'),
    {
      name: 'brand',
      type: 'text',
      label: 'Marca',
      admin: { position: 'sidebar' },
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Descripción corta',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Descripción completa',
      editor: richEditor,
    },
    {
      name: 'images',
      type: 'array',
      label: 'Imágenes',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'price',
      type: 'number',
      label: 'Precio (€)',
      admin: { position: 'sidebar' },
    },
    {
      name: 'currency',
      type: 'select',
      options: [
        { label: 'Euro (€)', value: 'EUR' },
        { label: 'Dólar ($)', value: 'USD' },
      ],
      defaultValue: 'EUR',
      admin: { position: 'sidebar' },
    },
    {
      name: 'affiliateUrl',
      type: 'text',
      label: 'URL de afiliado',
      admin: { position: 'sidebar' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Categorías',
      admin: { position: 'sidebar' },
    },
    {
      name: 'ageRange',
      type: 'group',
      label: 'Rango de edad',
      fields: [
        { name: 'min', type: 'number', label: 'Mínimo (meses)' },
        { name: 'max', type: 'number', label: 'Máximo (meses)' },
      ],
    },
    {
      name: 'rating',
      type: 'number',
      label: 'Valoración (1-5)',
      min: 1,
      max: 5,
      admin: { position: 'sidebar' },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Borrador', value: 'draft' },
        { label: 'Publicado', value: 'published' },
      ],
      defaultValue: 'draft',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'prismicId',
      type: 'text',
      label: 'Prismic ID',
      admin: { readOnly: true, position: 'sidebar' },
    },

    // --- Sync / Identity ---
    {
      name: 'uid',
      type: 'text',
      label: 'UID',
      unique: true,
      admin: { description: 'Identificador único para abrir en modal', position: 'sidebar' },
    },
    {
      name: 'externalSource',
      type: 'select',
      label: 'Fuente externa',
      options: [
        { label: 'Raindrop', value: 'raindrop' },
        { label: 'Prismic', value: 'prismic' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'externalId',
      type: 'text',
      label: 'ID externo',
      index: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'sourceUrl',
      type: 'text',
      label: 'URL origen',
      admin: { position: 'sidebar' },
    },
    {
      name: 'url',
      type: 'text',
      label: 'URL normalizada',
      unique: true,
      index: true,
      admin: { description: 'URL normalizada del producto', position: 'sidebar' },
    },
    {
      name: 'sourceName',
      type: 'text',
      label: 'Nombre original',
      admin: { description: 'Nombre original del producto en la fuente' },
    },
    {
      name: 'name',
      type: 'text',
      label: 'Nombre normalizado',
      admin: { description: 'Nombre normalizado del producto' },
    },

    // --- Store / Classification ---
    {
      name: 'store',
      type: 'relationship',
      relationTo: 'stores',
      label: 'Tienda',
      admin: { position: 'sidebar' },
    },
    {
      name: 'category',
      type: 'select',
      label: 'Categoría (sync)',
      options: [
        { label: 'Juguete', value: 'juguete' },
        { label: 'Juego de Mesa', value: 'juego-de-mesa' },
        { label: 'Libros y cuentos', value: 'libros-y-cuentos' },
        { label: 'Cuidados', value: 'cuidados' },
        { label: 'Alimentación', value: 'alimentacion' },
        { label: 'Ropa', value: 'ropa' },
        { label: 'Mobiliario', value: 'mobiliario' },
        { label: 'Electrónica', value: 'electronica' },
        { label: 'Otros', value: 'otros' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Etiquetas',
      filterOptions: {
        type: {
          in: ['general', 'product'],
        },
      },
      admin: {
        allowCreate: true,
        allowEdit: true,
      },
    },
    {
      name: 'authors',
      type: 'array',
      label: 'Autores',
      fields: [{ name: 'author', type: 'text', required: true }],
      admin: { description: 'Para libros, juegos de mesa, etc.' },
    },

    // --- Stock / Pricing sync ---
    {
      name: 'priceUpdatedAt',
      type: 'date',
      label: 'Precio actualizado',
      admin: { position: 'sidebar' },
    },
    {
      name: 'lastSyncAttemptAt',
      type: 'date',
      label: 'Último intento de sync',
      admin: { position: 'sidebar' },
    },
    {
      name: 'stockStatus',
      type: 'select',
      label: 'Estado de stock',
      options: [
        { label: 'En stock', value: 'in_stock' },
        { label: 'Sin stock', value: 'out_of_stock' },
        { label: 'Desconocido', value: 'unknown' },
      ],
      defaultValue: 'unknown',
      admin: { position: 'sidebar' },
    },
    {
      name: 'disableMode',
      type: 'select',
      label: 'Modo de desactivación',
      options: [
        { label: 'Temporal', value: 'temporary' },
        { label: 'Permanente', value: 'permanent' },
        { label: 'Revisión manual', value: 'manual_review' },
      ],
      admin: { position: 'sidebar' },
    },

    // --- Media (sync) ---
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen (sync)',
    },

    // --- Raw data ---
    {
      name: 'rawSourceData',
      type: 'json',
      label: 'Datos originales',
      admin: { description: 'JSON original para auditoría y para la IA' },
    },
  ],
}
