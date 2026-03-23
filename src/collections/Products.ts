import type { CollectionConfig } from 'payload'
import { richEditor } from '../fields/richTextEditors'

export const Products: CollectionConfig = {
  slug: 'products',
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
    {
      name: 'slug',
      type: 'text',
      label: 'Slug',
      required: true,
      unique: true,
      index: true,
      admin: { position: 'sidebar' },
    },
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
  ],
}
