import type { CollectionConfig } from 'payload'
import { manualSlugField } from '../fields/slug'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: {
    singular: 'Autor',
    plural: '✍️ Autores',
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
      name: 'bio',
      type: 'textarea',
      label: 'Biografía',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Avatar',
    },
    {
      name: 'socialLinks',
      type: 'group',
      label: 'Redes sociales',
      fields: [
        { name: 'twitter', type: 'text', label: 'Twitter / X' },
        { name: 'instagram', type: 'text', label: 'Instagram' },
        { name: 'website', type: 'text', label: 'Sitio web' },
      ],
    },
    {
      name: 'prismicId',
      type: 'text',
      label: 'Prismic ID',
      admin: { readOnly: true, position: 'sidebar' },
    },
  ],
}
