/** Dummy community rankings. Replace when degree/course popularity is wired up. */

export type PopularDegree = {
  id: string
  name: string
  blurb: string
  field: string
  followers: number
  courseCount: number
}

export type PopularCourse = {
  slug: string
  title: string
  blurb: string
  degree: string
  learners: number
}

export const POPULAR_DEGREES: PopularDegree[] = [
  {
    id: 'computer-science',
    name: 'Computer Science',
    blurb:
      'The degree people keep opening when they want to write software, not just talk about it.',
    field: 'STEM',
    followers: 1842,
    courseCount: 42
  },
  {
    id: 'mechanical-engineering',
    name: 'Mechanical Engineering',
    blurb:
      'A path through mechanics, materials, and design — the map that keeps a machine from remaining a sketch.',
    field: 'Engineering',
    followers: 1210,
    courseCount: 38
  },
  {
    id: 'physics',
    name: 'Physics',
    blurb:
      'From classical mechanics to the questions the Field Atlas still marks unresolved.',
    field: 'STEM',
    followers: 986,
    courseCount: 31
  },
  {
    id: 'biology',
    name: 'Biology',
    blurb:
      'Cells, systems, and the lab work that turns a living thing into something you can actually study.',
    field: 'Life sciences',
    followers: 874,
    courseCount: 36
  }
]

export const POPULAR_COURSES: PopularCourse[] = [
  {
    slug: 'linear-algebra',
    title: 'Linear Algebra',
    blurb:
      'The course that keeps showing up on paths from transformers to physics.',
    degree: 'Mathematics',
    learners: 3104
  },
  {
    slug: 'data-structures',
    title: 'Data Structures',
    blurb:
      'Lists, trees, and hash tables — the fluency computer science degrees keep asking for.',
    degree: 'Computer Science',
    learners: 2671
  },
  {
    slug: 'calculus-i',
    title: 'Calculus I',
    blurb: 'Limits, derivatives, and the first language of change most STEM paths share.',
    degree: 'Mathematics',
    learners: 2440
  },
  {
    slug: 'organic-chemistry',
    title: 'Organic Chemistry',
    blurb:
      'Mechanisms and structure — the bottleneck course biology and chemistry students still gather around.',
    degree: 'Chemistry',
    learners: 1988
  }
]
