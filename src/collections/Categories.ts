import type { CollectionConfig } from 'payload'
import { manualSlugField } from '../fields/slug'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: {
    singular: 'Categoría',
    plural: '🗂️ Categorías',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Contenido',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Nombre',
      required: true,
    },
    manualSlugField('name'),
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      options: [
        { label: 'Blog', value: 'blog' },
        { label: 'Producto', value: 'product' },
        { label: 'Tienda', value: 'store' },
        { label: 'General', value: 'general' },
      ],
      defaultValue: 'general',
      admin: { position: 'sidebar' },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'Categoría padre',
      admin: { position: 'sidebar' },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Imagen',
    },
    {
      name: 'prismicId',
      type: 'text',
      label: 'Prismic ID',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
