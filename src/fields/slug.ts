import { slugField } from 'payload'

export const toCleanSlug = (input: string): string =>
  input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const manualSlugField = (source: 'title' | 'name') =>
  slugField({
    useAsSlug: source,
    slugify: ({ valueToSlugify }) => {
      if (typeof valueToSlugify !== 'string') return ''
      return toCleanSlug(valueToSlugify)
    },
    overrides: (field) => {
      field.admin = {
        ...field.admin,
        position: 'sidebar',
      }

      if (field.fields[0]?.type === 'checkbox') {
        field.fields[0].defaultValue = false
      }
      return field
    },
  })
