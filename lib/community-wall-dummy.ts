export type DummyCommunityResource = {
  id: string
  title: string
  description: string
  link?: string
  pinned?: boolean
  votes: number
  comments: number
  sourceLabel?: string
  /** Optional second line under source (e.g. handle); demo only. */
  sourceHandle?: string
  /** Optional hero image for the link preview (dummy / demo only). */
  previewImage?: string
}

function stableCourseSeed(coursePageId?: string): number {
  const s = (coursePageId || 'course').trim()
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0
  }
  return h
}

export function getDummyCommunityResources(
  coursePageId?: string
): DummyCommunityResource[] {
  const seed = stableCourseSeed(coursePageId)
  const pick = <T>(arr: T[], n: number): T[] => {
    const out: T[] = []
    for (let i = 0; i < n; i++) out.push(arr[(seed + i) % arr.length])
    return out
  }

  const base: DummyCommunityResource[] = [
    {
      id: 'dummy-1',
      title: 'Free fonts website',
      description:
        'Hundreds of free fonts but I suggest only sorting by the font foundry. Etc. Read more.',
      link: 'https://fonts.google.com/',
      pinned: true,
      votes: 1,
      comments: 0,
      sourceLabel: 'Twitter',
      sourceHandle: 'userisgrotesque'
    },
    {
      id: 'dummy-2',
      title: 'My fave textbook!',
      description: 'Helpful for beginners',
      link: 'https://openstax.org/',
      pinned: false,
      votes: 0,
      comments: 0,
      sourceLabel: 'Twitter',
      previewImage:
        'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80'
    },
    {
      id: 'dummy-3',
      title: 'Great lecture series',
      description: 'Clear explanations + good practice problems.',
      link: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
      pinned: false,
      votes: 2,
      comments: 1,
      sourceLabel: 'YouTube'
    },
    {
      id: 'dummy-4',
      title: 'Problem set solutions',
      description: 'Worked solutions for the first few weeks.',
      link: undefined,
      pinned: false,
      votes: 0,
      comments: 0,
      sourceLabel: 'Notes'
    },
    {
      id: 'dummy-5',
      title: 'Post with course tips',
      description: 'Tweet permalink uses the X link preview placeholder.',
      link: 'https://x.com/jack/status/20',
      pinned: false,
      votes: 0,
      comments: 0,
      sourceLabel: 'X',
      sourceHandle: 'jack'
    }
  ]

  const chosen = pick(base, 3).map((r, i) => ({
    ...r,
    id: `${r.id}-${(seed + i) % 9999}`
  }))

  // Ensure exactly one pinned dummy resource.
  const pinnedIndex = chosen.findIndex((r) => r.pinned)
  chosen.forEach((r) => (r.pinned = false))
  chosen[Math.max(0, pinnedIndex)].pinned = true

  return chosen
}
