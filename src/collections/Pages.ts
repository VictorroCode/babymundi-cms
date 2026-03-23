import type { CollectionConfig } from 'payload'
import { fullEditor } from '../fields/richTextEditors'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    group: 'Estructura',
    defaultColumns: ['title', 'slug', 'status'],
    preview: (doc) => {
      const slug = doc?.slug === 'home' ? '' : doc?.slug
      return `${process.env.FRONTEND_URL}/${slug}`
    },
    livePreview: {
      url: ({ data }) => {
        const slug = data?.slug === 'home' ? '' : data?.slug
        return `${process.env.FRONTEND_URL}/${slug}`
      },
    },
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
      label: 'Título',
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
      name: 'hero',
      type: 'group',
      label: 'Hero / Cabecera',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Sin hero', value: 'none' },
            { label: 'Simple (título + imagen)', value: 'simple' },
            { label: 'Completo (título + subtítulo + CTA)', value: 'full' },
          ],
          defaultValue: 'none',
        },
        { name: 'heading', type: 'text', label: 'Titular' },
        { name: 'subheading', type: 'textarea', label: 'Subtítulo' },
        { name: 'ctaLabel', type: 'text', label: 'Texto del botón CTA' },
        { name: 'ctaUrl', type: 'text', label: 'URL del CTA' },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Imagen del hero',
        },
      ],
    },
    {
      name: 'layout',
      type: 'blocks',
      label: 'Bloques de contenido',
      blocks: [
        {
          slug: 'richTextBlock',
          labels: { singular: 'Texto enriquecido', plural: 'Bloques de texto' },
          fields: [
            {
              name: 'content',
              type: 'richText',
              editor: fullEditor,
              required: true,
            },
          ],
        },
        {
          slug: 'imageBlock',
          labels: { singular: 'Imagen', plural: 'Imágenes' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true },
            { name: 'caption', type: 'text', label: 'Pie de foto' },
          ],
        },
        {
          slug: 'callToActionBlock',
          labels: { singular: 'CTA', plural: 'CTAs' },
          fields: [
            { name: 'heading', type: 'text', required: true },
            { name: 'description', type: 'textarea' },
            { name: 'ctaLabel', type: 'text', label: 'Texto del botón' },
            { name: 'ctaUrl', type: 'text', label: 'URL' },
          ],
        },
        {
          slug: 'featureGridBlock',
          labels: { singular: 'Grid de características', plural: 'Grids de características' },
          fields: [
            { name: 'heading', type: 'text' },
            {
              name: 'features',
              type: 'array',
              fields: [
                { name: 'icon', type: 'text', label: 'Icono (nombre)' },
                { name: 'title', type: 'text', required: true },
                { name: 'description', type: 'textarea' },
              ],
            },
          ],
        },
      ],
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
