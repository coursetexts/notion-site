/**
 * Detect major sites from a bookmark URL and return the domain to use for a favicon.
 * Used on the profile "My bookmarked links" to show a site icon on the left of the link.
 */

const FAVICON_SZ = 32

/** Domain patterns that identify a major site. Order matters: more specific first. */
const MAJOR_SITES: { match: (host: string) => boolean; domain: string }[] = [
  { match: (h) => h === 'scholar.google.com', domain: 'scholar.google.com' },
  { match: (h) => h.endsWith('google.com'), domain: 'google.com' },
  { match: (h) => h.includes('wikipedia.org'), domain: 'wikipedia.org' },
  { match: (h) => h.includes('pubmed') || h === 'ncbi.nlm.nih.gov' || h.endsWith('.ncbi.nlm.nih.gov'), domain: 'pubmed.ncbi.nlm.nih.gov' },
  { match: (h) => h.endsWith('amazon.com') || h.endsWith('amazon.co.uk') || h.endsWith('amazon.de') || h.endsWith('amazon.fr') || h.endsWith('amazon.ca') || h.endsWith('amazon.in') || h.endsWith('amazon.jp'), domain: 'amazon.com' },
  { match: (h) => h === 'facebook.com' || h.endsWith('.facebook.com'), domain: 'facebook.com' },
  { match: (h) => h === 'substack.com' || h.endsWith('.substack.com'), domain: 'substack.com' },
  { match: (h) => h === 'instagram.com' || h.endsWith('.instagram.com'), domain: 'instagram.com' },
  { match: (h) => h === 'tiktok.com' || h.endsWith('.tiktok.com'), domain: 'tiktok.com' },
  { match: (h) => h === 'x.com' || h.endsWith('.x.com'), domain: 'x.com' },
  { match: (h) => h === 'twitter.com' || h.endsWith('.twitter.com'), domain: 'x.com' },
  { match: (h) => h === 'youtube.com' || h.endsWith('.youtube.com') || h === 'youtu.be', domain: 'youtube.com' },
  { match: (h) => h === 'quora.com' || h.endsWith('.quora.com'), domain: 'quora.com' },
  { match: (h) => h === 'stackoverflow.com' || h.endsWith('.stackoverflow.com'), domain: 'stackoverflow.com' },
  { match: (h) => h === 'discord.com' || h.endsWith('.discord.com') || h === 'discord.gg', domain: 'discord.com' },
  { match: (h) => h === 'medium.com' || h.endsWith('.medium.com'), domain: 'medium.com' },
  { match: (h) => h === 'jstor.org' || h.endsWith('.jstor.org'), domain: 'jstor.org' },
  { match: (h) => h === 'researchgate.net' || h.endsWith('.researchgate.net'), domain: 'researchgate.net' },
  { match: (h) => h === 'quizlet.com' || h.endsWith('.quizlet.com'), domain: 'quizlet.com' }
]

function normalizeHost(url: string): string | null {
  try {
    const u = new URL(url)
    let host = u.hostname.toLowerCase()
    if (host.startsWith('www.')) host = host.slice(4)
    return host
  } catch {
    return null
  }
}

/**
 * Returns the domain to use for the favicon if the URL is from a major site, else null.
 */
export function getLinkSiteFaviconDomain(url: string): string | null {
  const host = normalizeHost(url)
  if (!host) return null
  const entry = MAJOR_SITES.find(({ match }) => match(host))
  return entry ? entry.domain : null
}

/**
 * Google favicon API URL for a given domain. Use only when getLinkSiteFaviconDomain returns non-null.
 */
export function getFaviconUrl(domain: string, size: number = FAVICON_SZ): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`
}
