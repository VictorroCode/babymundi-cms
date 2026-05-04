import type { CollectionConfig } from 'payload'

const isProduction = process.env.NODE_ENV === 'production'

export const Users: CollectionConfig = {
  slug: 'users',
  labels: {
    singular: 'Usuario',
    plural: '👥 Usuarios',
  },
  admin: {
    useAsTitle: 'email',
  },
  auth: {
    cookies: {
      sameSite: isProduction ? 'None' : 'Lax',
      secure: isProduction,
    },
  },
  fields: [
    {
      name: 'role',
      type: 'select',
      label: 'Rol',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Editor', value: 'editor' },
      ],
      defaultValue: 'editor',
      required: true,
      saveToJWT: true,
      admin: { position: 'sidebar' },
    },
  ],
}
