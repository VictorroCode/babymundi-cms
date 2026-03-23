/**
 * richTextEditors.ts
 *
 * Configuraciones de editor Lexical reutilizables según el nivel de complejidad:
 *
 *  - simpleEditor  → Descripción corta. Solo formato básico (negrita, cursiva, listas, links).
 *  - richEditor    → Contenido estándar. Añade encabezados, citas, código inline, imágenes, relaciones.
 *  - fullEditor    → Posts / páginas completas. Todo lo anterior más tablas, bloques de código, uploads embebidos.
 */

import {
  lexicalEditor,
  BoldFeature,
  ItalicFeature,
  UnderlineFeature,
  StrikethroughFeature,
  SubscriptFeature,
  SuperscriptFeature,
  InlineCodeFeature,
  LinkFeature,
  OrderedListFeature,
  UnorderedListFeature,
  ChecklistFeature,
  BlockquoteFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  FixedToolbarFeature,
  AlignFeature,
  IndentFeature,
  ParagraphFeature,
  UploadFeature,
  RelationshipFeature,
  BlocksFeature,
  TreeViewFeature,
} from '@payloadcms/richtext-lexical'
import { Block } from 'payload'

// ─── Bloque de llamada a la acción embebida en contenido ──────────────────────
const CalloutBlock: Block = {
  slug: 'callout',
  labels: { singular: 'Destacado', plural: 'Destacados' },
  fields: [
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      options: [
        { label: 'Información', value: 'info' },
        { label: 'Advertencia', value: 'warning' },
        { label: 'Consejo', value: 'tip' },
      ],
      defaultValue: 'info',
    },
    {
      name: 'content',
      type: 'textarea',
      label: 'Contenido',
      required: true,
    },
  ],
}

// ─── Editor simple (descripciones cortas, excerpts enriquecidos) ─────────────
export const simpleEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    LinkFeature({ enabledCollections: ['pages', 'posts', 'products', 'stores'] }),
    OrderedListFeature(),
    UnorderedListFeature(),
    InlineToolbarFeature(),
  ],
})

// ─── Editor estándar (Products, Stores) ──────────────────────────────────────
export const richEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    SubscriptFeature(),
    SuperscriptFeature(),
    InlineCodeFeature(),
    LinkFeature({ enabledCollections: ['pages', 'posts', 'products', 'stores'] }),
    OrderedListFeature(),
    UnorderedListFeature(),
    ChecklistFeature(),
    BlockquoteFeature(),
    AlignFeature(),
    IndentFeature(),
    HorizontalRuleFeature(),
    UploadFeature({
      collections: {
        media: {
          fields: [
            { name: 'caption', type: 'text', label: 'Pie de foto' },
            {
              name: 'size',
              type: 'select',
              label: 'Tamaño',
              options: ['small', 'medium', 'full'],
              defaultValue: 'full',
            },
          ],
        },
      },
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

// ─── Editor completo (Posts, Pages) ──────────────────────────────────────────
export const fullEditor = lexicalEditor({
  features: [
    ParagraphFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h2', 'h3', 'h4', 'h5'] }),
    BoldFeature(),
    ItalicFeature(),
    UnderlineFeature(),
    StrikethroughFeature(),
    SubscriptFeature(),
    SuperscriptFeature(),
    InlineCodeFeature(),
    LinkFeature({ enabledCollections: ['pages', 'posts', 'products', 'stores'] }),
    OrderedListFeature(),
    UnorderedListFeature(),
    ChecklistFeature(),
    BlockquoteFeature(),
    AlignFeature(),
    IndentFeature(),
    HorizontalRuleFeature(),
    UploadFeature({
      collections: {
        media: {
          fields: [
            { name: 'caption', type: 'text', label: 'Pie de foto' },
            {
              name: 'size',
              type: 'select',
              label: 'Tamaño',
              options: [
                { label: 'Pequeño', value: 'small' },
                { label: 'Mediano', value: 'medium' },
                { label: 'Completo', value: 'full' },
              ],
              defaultValue: 'full',
            },
          ],
        },
      },
    }),
    RelationshipFeature({
      enabledCollections: ['posts', 'products', 'stores'],
    }),
    BlocksFeature({
      blocks: [CalloutBlock],
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})
