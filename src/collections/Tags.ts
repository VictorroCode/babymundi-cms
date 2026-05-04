import type { CollectionConfig } from 'payload'
import { manualSlugField } from '../fields/slug'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: {
    singular: 'Etiqueta',
    plural: '🏷️ Etiquetas',
  },
  admin: {
    useAsTitle: 'name',
    group: 'Contenido',
    defaultColumns: ['name', 'slug', 'type'],
  },
  access: {
    read: () => true,
    create: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => req.user?.role === 'admin',
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
      name: 'type',
      type: 'select',
      label: 'Tipo',
      options: [
        { label: 'General', value: 'general' },
        { label: 'Producto', value: 'product' },
        { label: 'Página', value: 'page' },
      ],
      defaultValue: 'general',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Descripción',
    },
  ],
}
