import type { CollectionConfig } from 'payload'
import { fullEditor } from '../fields/richTextEditors'
import { manualSlugField } from '../fields/slug'

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: {
    singular: 'Página',
    plural: '📄 Páginas',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Contenido',
    defaultColumns: ['title', 'slug', 'status'],
    preview: (doc) => {
      const slug = doc?.slug === 'home' ? '' : doc?.slug
      return `${process.env.FRONTEND_URL}/${slug}`
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
      name: 'excerpt',
      type: 'textarea',
      label: 'Entradilla',
      admin: {
        description: 'Pequeño adelanto que se muestra debajo del título.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen principal',
      admin: {
        description: 'Imagen para listados y cabecera.',
      },
    },
    {
      name: 'showImageInArticle',
      type: 'checkbox',
      label: 'Mostrar imagen dentro del artículo',
      defaultValue: true,
    },
    manualSlugField('title'),
    {
      name: 'pageType',
      type: 'select' as const,
      options: [
        { label: 'Artículo', value: 'Article' },
        { label: 'Guía', value: 'Guide' },
        { label: 'Landing', value: 'Landing' },
      ],
      admin: { description: 'Subtipo de página en Prismic (data.type)' },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      label: 'Autor',
      admin: { position: 'sidebar' },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'Categorías',
      admin: {
        position: 'sidebar',
        allowCreate: true,
        allowEdit: true,
      },
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'Etiquetas',
      filterOptions: {
        type: {
          in: ['general', 'page'],
        },
      },
      admin: {
        position: 'sidebar',
        allowCreate: true,
        allowEdit: true,
      },
    },
    {
      name: 'content',
      type: 'blocks',
      label: 'Bloques de contenido',
      blocks: [
        {
          slug: 'heroBlock',
          labels: { singular: 'Hero', plural: 'Bloques Hero' },
          fields: [
            { name: 'heading', type: 'text', label: 'Titular', required: true },
            { name: 'subheading', type: 'textarea', label: 'Subtítulo' },
            { name: 'ctaLabel', type: 'text', label: 'Texto del botón' },
            { name: 'ctaUrl', type: 'text', label: 'URL del botón' },
            { name: 'image', type: 'upload', relationTo: 'media', label: 'Imagen' },
          ],
        },
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
    // --- Metadata ---
    {
      name: 'publishedAt',
      type: 'date' as const,
      label: 'Fecha de publicación',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
}
