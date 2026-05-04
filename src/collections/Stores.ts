import type { CollectionConfig } from 'payload'
import { richEditor } from '../fields/richTextEditors'
import { manualSlugField } from '../fields/slug'

export const Stores: CollectionConfig = {
  slug: 'stores',
  labels: {
    singular: 'Tienda',
    plural: '🏬 Tiendas',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Contenido',
    defaultColumns: ['name', 'type', 'country', 'status'],
    preview: (doc) => `${process.env.FRONTEND_URL}/tiendas/${doc?.slug}`,
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
      name: 'name',
      type: 'text',
      label: 'Nombre de la tienda',
      required: true,
    },
    manualSlugField('name'),
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      options: [
        { label: 'Online', value: 'online' },
        { label: 'Física', value: 'physical' },
        { label: 'Mixta', value: 'both' },
      ],
      defaultValue: 'online',
      admin: { position: 'sidebar' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Descripción corta',
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Descripción',
      editor: richEditor,
    },
    {
      name: 'websiteUrl',
      type: 'text',
      label: 'URL de la tienda',
      admin: { position: 'sidebar' },
    },
    {
      name: 'affiliateUrl',
      type: 'text',
      label: 'URL de afiliado',
      admin: { position: 'sidebar' },
    },
    {
      name: 'country',
      type: 'text',
      label: 'País',
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
      name: 'shipsTo',
      type: 'array',
      label: 'Envía a',
      fields: [{ name: 'country', type: 'text', label: 'País' }],
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
      admin: { description: 'Identificador único, ej: amazon-es', position: 'sidebar' },
    },
    {
      name: 'affiliationTag',
      type: 'text',
      label: 'Tag de afiliación',
      admin: { description: 'Tag para URLs de afiliación, ej: ?tag=micodigo', position: 'sidebar' },
    },
    {
      name: 'currency',
      type: 'text',
      label: 'Moneda',
      defaultValue: 'EUR',
      admin: { position: 'sidebar' },
    },

    // --- Media (sync) ---
    {
      name: 'icon',
      type: 'upload',
      relationTo: 'media',
      label: 'Icono',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen (sync)',
    },
  ],
}
