import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import config from '@/payload.config'
import type { Media, Page } from '@/payload-types'

type RichTextNode = {
  type?: string
  text?: string
  tag?: string
  format?: number
  url?: string
  fields?: { url?: string; newTab?: boolean }
  children?: RichTextNode[]
  listType?: 'number' | 'bullet' | 'check'
}

const hasFormat = (value: number | undefined, bit: number): boolean =>
  typeof value === 'number' && (value & bit) !== 0

function renderInlineNode(node: RichTextNode, key: string): React.ReactNode {
  if (node.type === 'text') {
    let content: React.ReactNode = node.text ?? ''

    if (hasFormat(node.format, 16)) content = <code key={`${key}-code`}>{content}</code>
    if (hasFormat(node.format, 8)) content = <u key={`${key}-underline`}>{content}</u>
    if (hasFormat(node.format, 4)) content = <s key={`${key}-strike`}>{content}</s>
    if (hasFormat(node.format, 2)) content = <em key={`${key}-italic`}>{content}</em>
    if (hasFormat(node.format, 1)) content = <strong key={`${key}-bold`}>{content}</strong>

    return <React.Fragment key={key}>{content}</React.Fragment>
  }

  if (node.type === 'linebreak') {
    return <br key={key} />
  }

  if (node.type === 'link') {
    const href = node.fields?.url || node.url || '#'
    return (
      <a
        key={key}
        href={href}
        rel={node.fields?.newTab ? 'noopener noreferrer' : undefined}
        target={node.fields?.newTab ? '_blank' : undefined}
      >
        {renderInlineChildren(node.children, `${key}-children`)}
      </a>
    )
  }

  return (
    <React.Fragment key={key}>
      {renderInlineChildren(node.children, `${key}-children`)}
    </React.Fragment>
  )
}

function renderInlineChildren(
  nodes: RichTextNode[] | undefined,
  keyPrefix: string,
): React.ReactNode {
  if (!Array.isArray(nodes)) return null
  return nodes.map((child, index) => renderInlineNode(child, `${keyPrefix}-${index}`))
}

function renderLexicalNodes(nodes: RichTextNode[] | undefined, keyPrefix: string): React.ReactNode {
  if (!Array.isArray(nodes)) return null

  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`

    if (node.type === 'heading') {
      const tag =
        node.tag === 'h1' || node.tag === 'h2' || node.tag === 'h3' || node.tag === 'h4'
          ? node.tag
          : 'h2'

      if (tag === 'h1')
        return <h1 key={key}>{renderInlineChildren(node.children, `${key}-inline`)}</h1>
      if (tag === 'h2')
        return <h2 key={key}>{renderInlineChildren(node.children, `${key}-inline`)}</h2>
      if (tag === 'h3')
        return <h3 key={key}>{renderInlineChildren(node.children, `${key}-inline`)}</h3>
      return <h4 key={key}>{renderInlineChildren(node.children, `${key}-inline`)}</h4>
    }

    if (node.type === 'paragraph') {
      return <p key={key}>{renderInlineChildren(node.children, `${key}-inline`)}</p>
    }

    if (node.type === 'list') {
      const items = Array.isArray(node.children) ? node.children : []
      if (node.listType === 'number') {
        return (
          <ol key={key}>
            {items.map((item, itemIndex) => (
              <li key={`${key}-item-${itemIndex}`}>
                {renderInlineChildren(item.children, `${key}-item-inline-${itemIndex}`)}
              </li>
            ))}
          </ol>
        )
      }

      return (
        <ul key={key}>
          {items.map((item, itemIndex) => (
            <li key={`${key}-item-${itemIndex}`}>
              {renderInlineChildren(item.children, `${key}-item-inline-${itemIndex}`)}
            </li>
          ))}
        </ul>
      )
    }

    return (
      <React.Fragment key={key}>
        {renderLexicalNodes(node.children, `${key}-children`)}
      </React.Fragment>
    )
  })
}

function getMediaUrl(media: number | Media | null | undefined): string | null {
  if (!media || typeof media === 'number') return null
  if (!media.url) return null
  return media.url
}

function PageBlocks({ blocks }: { blocks: NonNullable<Page['content']> }) {
  return (
    <section className="page-content">
      {blocks.map((block, blockIndex) => {
        const fallbackKey = `${block.blockType}-${blockIndex}`

        if (block.blockType === 'heroBlock') {
          const heroImage = getMediaUrl(block.image)

          return (
            <section className="content-hero" key={block.id || fallbackKey}>
              <div>
                <h2>{block.heading}</h2>
                {block.subheading ? <p>{block.subheading}</p> : null}
                {block.ctaLabel && block.ctaUrl ? (
                  <a className="content-hero-cta" href={block.ctaUrl}>
                    {block.ctaLabel}
                  </a>
                ) : null}
              </div>
              {heroImage ? (
                <Image
                  alt={block.heading}
                  className="content-hero-image"
                  height={720}
                  src={heroImage}
                  width={1200}
                />
              ) : null}
            </section>
          )
        }

        if (block.blockType === 'richTextBlock') {
          const nodes = (block.content as { root?: { children?: RichTextNode[] } })?.root?.children
          return (
            <section className="content-richtext" key={block.id || fallbackKey}>
              {renderLexicalNodes(nodes, block.id || fallbackKey)}
            </section>
          )
        }

        if (block.blockType === 'imageBlock') {
          const blockImage = getMediaUrl(block.image)
          if (!blockImage) return null

          return (
            <figure className="content-image" key={block.id || fallbackKey}>
              <Image alt={block.caption || ''} height={900} src={blockImage} width={1400} />
              {block.caption ? <figcaption>{block.caption}</figcaption> : null}
            </figure>
          )
        }

        if (block.blockType === 'callToActionBlock') {
          return (
            <section className="content-cta" key={block.id || fallbackKey}>
              <h3>{block.heading}</h3>
              {block.description ? <p>{block.description}</p> : null}
              {block.ctaLabel && block.ctaUrl ? <a href={block.ctaUrl}>{block.ctaLabel}</a> : null}
            </section>
          )
        }

        if (block.blockType === 'featureGridBlock') {
          return (
            <section className="content-features" key={block.id || fallbackKey}>
              {block.heading ? <h3>{block.heading}</h3> : null}
              <div className="content-features-grid">
                {block.features?.map((feature, index) => (
                  <article key={`${feature.title}-${index}`}>
                    {feature.icon ? <span>{feature.icon}</span> : null}
                    <h4>{feature.title}</h4>
                    {feature.description ? <p>{feature.description}</p> : null}
                  </article>
                ))}
              </div>
            </section>
          )
        }

        return null
      })}
    </section>
  )
}

export default async function FrontendPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config: await config })

  const pages = await payload.find({
    collection: 'pages',
    depth: 2,
    limit: 1,
    pagination: false,
    where: {
      and: [{ slug: { equals: slug } }, { status: { equals: 'published' } }],
    },
  })

  const page = pages.docs[0]
  if (!page) notFound()

  const headerImageUrl = getMediaUrl(page.image)

  return (
    <article className="frontend-page">
      <header className="page-header">
        <h1>{page.title}</h1>
        {page.excerpt ? <p className="page-excerpt">{page.excerpt}</p> : null}
        {page.showImageInArticle && headerImageUrl ? (
          <Image
            alt={page.title}
            className="page-image"
            height={900}
            src={headerImageUrl}
            width={1600}
          />
        ) : null}
      </header>

      {page.content && page.content.length > 0 ? <PageBlocks blocks={page.content} /> : null}
    </article>
  )
}
