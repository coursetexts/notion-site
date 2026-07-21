function normalizeSchoolKey(meta: string): string {
  return meta
    .split('/')[0]
    .trim()
    .toLowerCase()
    .replace(/^university of\s+/, '')
    .replace(/\s+university$/, '')
}

/**
 * Preserve the source order within each school while round-robining schools.
 * Notion groups courses by institution, so taking the first page without this
 * step can make a multi-school catalog look like a single-school catalog.
 */
export function diversifyCoursesBySchool<T extends { meta: string }>(
  courses: T[]
): T[] {
  const buckets = new Map<string, T[]>()

  for (const course of courses) {
    const key = normalizeSchoolKey(course.meta) || 'unknown'
    const bucket = buckets.get(key)

    if (bucket) {
      bucket.push(course)
    } else {
      buckets.set(key, [course])
    }
  }

  const diversified: T[] = []

  for (let index = 0; diversified.length < courses.length; index += 1) {
    for (const bucket of buckets.values()) {
      const course = bucket[index]
      if (course) diversified.push(course)
    }
  }

  return diversified
}
