import type { CollectionConfig } from 'payload'
import { fullEditor } from '../fields/richTextEditors'
import { manualSlugField } from '../fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  labels: {
    singular: 'Post',
    plural: '📝 Posts',
  },
  admin: {
    useAsTitle: 'title',
    group: 'Contenido',
    defaultColumns: ['title', 'author', 'publishedAt', 'status'],
    preview: (doc) => `${process.env.FRONTEND_URL}/blog/${doc?.slug}`,
  },
  access: {
    read: ({ req }) => {
      if (req.user) return true
      return {
        or: [{ status: { equals: 'published' } }],
      }
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  versions: {
    drafts: {
      autosave: {
        interval: 375,
      },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título',
      required: true,
    },
    manualSlugField('title'),
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Extracto',
    },
    {
      name: 'content',
      type: 'richText',
      label: 'Contenido',
      editor: fullEditor,
    },
    {
      name: 'coverImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen de portada',
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
          equals: 'general',
        },
      },
      admin: {
        position: 'sidebar',
        allowCreate: true,
        allowEdit: true,
      },
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
      name: 'publishedAt',
      type: 'date',
      label: 'Fecha de publicación',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'prismicId',
      type: 'text',
      label: 'Prismic ID',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
