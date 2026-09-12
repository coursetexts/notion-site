/**
 * Server-only Open Graph fetch for /api/link-preview.
 * Do not import from client components (uses got).
 */
import got from 'got'

import {
  isAllowedPreviewUrl,
  type LinkPreviewData
} from '@/lib/link-preview'

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(Number.parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(Number.parseInt(dec, 10))
    )
}

function metaContent(html: string, key: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["'][^>]*>`,
      'i'
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["'][^>]*>`,
      'i'
    )
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return decodeHtmlEntities(match[1].trim())
  }
  return null
}

function documentTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  if (!match?.[1]) return null
  return decodeHtmlEntities(match[1].trim())
}

function absolutizeUrl(base: string, value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value, base).toString()
  } catch {
    return null
  }
}

function siteLabelFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '')
  } catch {
    return url
  }
}

export async function fetchLinkPreview(
  rawUrl: string
): Promise<LinkPreviewData | null> {
  const url = rawUrl.trim()
  if (!isAllowedPreviewUrl(url)) return null

  try {
    const response = await got(url, {
      method: 'GET',
      timeout: { request: 6000 },
      followRedirect: true,
      maxRedirects: 4,
      headers: {
        'user-agent':
          'Mozilla/5.0 (compatible; CoursetextsLinkPreview/1.0; +https://coursetexts.org)',
        accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
      },
      https: { rejectUnauthorized: true }
    })

    const contentType = String(response.headers['content-type'] || '')
    if (contentType && !/text\/html|application\/xhtml/i.test(contentType)) {
      const finalUrl = response.url || url
      return {
        url: finalUrl,
        title: siteLabelFromUrl(finalUrl),
        description: '',
        image: null,
        siteName: siteLabelFromUrl(finalUrl),
        favicon: absolutizeUrl(finalUrl, '/favicon.ico')
      }
    }

    const html = response.body.slice(0, 500_000)
    const finalUrl = response.url || url
    const title =
      metaContent(html, 'og:title') ||
      metaContent(html, 'twitter:title') ||
      documentTitle(html) ||
      siteLabelFromUrl(finalUrl)
    const description =
      metaContent(html, 'og:description') ||
      metaContent(html, 'twitter:description') ||
      metaContent(html, 'description') ||
      ''
    const image = absolutizeUrl(
      finalUrl,
      metaContent(html, 'og:image') ||
        metaContent(html, 'twitter:image') ||
        metaContent(html, 'twitter:image:src')
    )
    const siteName =
      metaContent(html, 'og:site_name') || siteLabelFromUrl(finalUrl)
    const faviconMatch =
      html.match(
        /<link[^>]+rel=["'](?:shortcut )?icon["'][^>]+href=["']([^"']+)["']/i
      ) ||
      html.match(
        /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:shortcut )?icon["']/i
      )
    const favicon = absolutizeUrl(
      finalUrl,
      faviconMatch?.[1] || '/favicon.ico'
    )

    return {
      url: finalUrl,
      title: title.slice(0, 200),
      description: description.slice(0, 400),
      image,
      siteName: siteName.slice(0, 120),
      favicon
    }
  } catch (err) {
    console.warn(
      'fetchLinkPreview failed',
      url,
      err instanceof Error ? err.message : err
    )
    return null
  }
}
