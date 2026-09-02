/**
 * Topic chips for community learning paths on the home catalog.
 * Paths are personal skill goals, not school subjects, so the filters
 * follow what people actually build: languages, coding, creative work,
 * and hands-on making.
 */
export const LEARNING_PATH_TOPICS = [
  { id: 'languages', label: 'Languages' },
  { id: 'coding', label: 'Coding' },
  { id: 'creative', label: 'Creative' },
  { id: 'making', label: 'Making' }
] as const

export type LearningPathTopicId = (typeof LEARNING_PATH_TOPICS)[number]['id']

const SEEDED_TOPICS: Record<string, LearningPathTopicId[]> = {
  'learn-spanish': ['languages'],
  'understand-how-transformers-work-well-enough-to-implement-one': ['coding'],
  'write-a-rom-com-novel': ['creative'],
  'play-a-song-on-guitar': ['creative'],
  'build-a-tree-house': ['making'],
  'host-a-dinner': ['making']
}

const TOPIC_PATTERNS: Record<LearningPathTopicId, RegExp> = {
  languages:
    /\b(spanish|french|german|italian|portuguese|mandarin|chinese|japanese|korean|arabic|hindi|hebrew|latin|russian|dutch|swedish|turkish|vietnamese|thai|swahili|esperanto|language|languages|bilingual|esl|fluent|fluency|vocabulary|grammar|pronunciation|conversation)\b/i,
  coding:
    /\b(code|coding|coder|program|programming|programmer|python|javascript|typescript|react|software|compiler|algorithm|algorithms|machine learning|deep learning|neural|transformer|gpt|llm|api|debug|linux|data structure|computer science|implement|web app|website|frontend|backend|devops)\b/i,
  creative:
    /\b(novel|rom-?com|fiction|poetry|poem|story|screenplay|script|guitar|piano|violin|ukulele|music|song|melody|drawing|painting|illustration|film|photography|design|creative writing|write a)\b/i,
  making:
    /\b(tree ?house|cook|cooking|bake|baking|recipe|dinner|woodworking|carpentry|sew|sewing|knit|knitting|garden|gardening|diy|craft|crafts|furniture|host a|woodwork)\b/i
}

export function parseLearningPathTopicId(
  value: unknown
): LearningPathTopicId | null {
  const raw = Array.isArray(value) ? value[0] : value
  if (typeof raw !== 'string') return null
  const id = raw.trim().toLowerCase()
  return LEARNING_PATH_TOPICS.some((topic) => topic.id === id)
    ? (id as LearningPathTopicId)
    : null
}

export function learningPathTopics(path: {
  slug: string
  title?: string
  goal?: string
  summary?: string
}): LearningPathTopicId[] {
  const seeded = SEEDED_TOPICS[path.slug]
  if (seeded) return seeded

  const haystack = [
    path.slug.replace(/-/g, ' '),
    path.title,
    path.goal,
    path.summary
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return LEARNING_PATH_TOPICS.map((topic) => topic.id).filter((id) =>
    TOPIC_PATTERNS[id].test(haystack)
  )
}
