/** Frontend-only seed for /explore-questions. Not wired to a database. */

export type ExploreReadingItem = {
  id: string
  title: string
  url?: string
  note?: string
}

export type ExploreComment = {
  id: string
  author: string
  body: string
  createdAt: string
}

export type ExploreFieldId =
  | 'learning'
  | 'mathematics'
  | 'computer-science'
  | 'physics'
  | 'engineering'
  | 'statistics'
  | 'chemistry'
  | 'biology'
  | 'business'

export type ExploreField = {
  id: ExploreFieldId
  label: string
  cluster: string
  /** Layout coordinates in a 1000×340 viewBox. */
  x: number
  y: number
}

export type ExploreQuestion = {
  id: string
  title: string
  body: string
  author: string
  createdAt: string
  field: ExploreFieldId
  readingList: ExploreReadingItem[]
  comments: ExploreComment[]
}

export const EXPLORE_FIELDS: ExploreField[] = [
  { id: 'learning', label: 'Learning', cluster: 'Curriculum', x: 108, y: 86 },
  {
    id: 'mathematics',
    label: 'Mathematics',
    cluster: 'Quantitative',
    x: 248,
    y: 176
  },
  {
    id: 'computer-science',
    label: 'Computer Science',
    cluster: 'Quantitative',
    x: 168,
    y: 278
  },
  { id: 'physics', label: 'Physics', cluster: 'Physical', x: 398, y: 78 },
  {
    id: 'engineering',
    label: 'Engineering',
    cluster: 'Physical',
    x: 548,
    y: 58
  },
  {
    id: 'statistics',
    label: 'Statistics',
    cluster: 'Quantitative',
    x: 398,
    y: 236
  },
  { id: 'chemistry', label: 'Chemistry', cluster: 'Life', x: 568, y: 188 },
  { id: 'biology', label: 'Biology', cluster: 'Life', x: 718, y: 118 },
  { id: 'business', label: 'Business', cluster: 'Markets', x: 868, y: 198 }
]

export const EXPLORE_FIELD_LINKS: Array<[ExploreFieldId, ExploreFieldId]> = [
  ['learning', 'mathematics'],
  ['learning', 'computer-science'],
  ['mathematics', 'computer-science'],
  ['mathematics', 'physics'],
  ['mathematics', 'statistics'],
  ['physics', 'engineering'],
  ['physics', 'chemistry'],
  ['engineering', 'computer-science'],
  ['statistics', 'business'],
  ['statistics', 'chemistry'],
  ['chemistry', 'biology'],
  ['biology', 'learning']
]

export function getExploreField(id: ExploreFieldId): ExploreField | undefined {
  return EXPLORE_FIELDS.find((field) => field.id === id)
}

export const EXPLORE_QUESTIONS_SEED: ExploreQuestion[] = [
  {
    id: 'q-self-taught-degree',
    title: 'How should a self-taught degree actually be structured?',
    body: 'If someone is assembling a serious course of study outside a university, what should come first: a map of the field, a small set of canonical texts, or a community that can tell you when you are lost? I want a structure that still leaves room for wandering.',
    author: 'Maya Chen',
    createdAt: '2026-08-02',
    field: 'learning',
    readingList: [
      {
        id: 'r-1',
        title: 'The Feynman Lectures on Physics',
        url: 'https://www.feynmanlectures.caltech.edu/',
        note: 'A model for a complete, public curriculum.'
      },
      {
        id: 'r-2',
        title: 'MIT OpenCourseWare',
        url: 'https://ocw.mit.edu/',
        note: 'How a university publishes a degree in the open.'
      }
    ],
    comments: [
      {
        id: 'c-1',
        author: 'Jonah',
        body: 'Start with one demanding course you can finish. A map is useful only after you have a sense of what “done” feels like.',
        createdAt: '2026-08-03'
      },
      {
        id: 'c-2',
        author: 'Priya',
        body: 'I would invert that: the map keeps you from collecting random lectures. A syllabus with 12 topics is already a degree-shaped object.',
        createdAt: '2026-08-04'
      }
    ]
  },
  {
    id: 'q-lecture-worth-keeping',
    title: 'What makes a lecture video worth keeping in a syllabus?',
    body: 'There are thousands of recordings for every core subject. Some are clear, some are charming, some are the only place a proof is said out loud. How do we decide which ones belong next to a topic, and which ones are just noise?',
    author: 'Alex Rivera',
    createdAt: '2026-07-28',
    field: 'learning',
    readingList: [
      {
        id: 'r-3',
        title: '3Blue1Brown',
        url: 'https://www.3blue1brown.com/',
        note: 'Visual intuition as a first pass, not a substitute for a textbook.'
      }
    ],
    comments: [
      {
        id: 'c-3',
        author: 'Samira',
        body: 'If I cannot point to the minute where the idea clicks, it is not a syllabus video. It is entertainment adjacent to the topic.',
        createdAt: '2026-07-29'
      }
    ]
  },
  {
    id: 'q-hard-subjects-community',
    title: 'How do communities form around subjects that are hard to talk about?',
    body: 'Analysis, compilers, quantum mechanics: people want company, but the work is lonely. What actually helps — shared problem sets, annotated readings, or a place to ask “stupid” questions without performing expertise?',
    author: 'Eli Park',
    createdAt: '2026-07-19',
    field: 'learning',
    readingList: [
      {
        id: 'r-4',
        title: 'The Art of Doing Science and Engineering',
        note: 'Hamming on how people actually learn difficult things together.'
      },
      {
        id: 'r-5',
        title: 'Socratica',
        url: 'https://www.socratica.info/',
        note: 'A community that treats curiosity as a public practice.'
      }
    ],
    comments: [
      {
        id: 'c-4',
        author: 'Nia',
        body: 'A forum only works if the first replies model the tone. Otherwise it becomes a place to dump answers, not to think in public.',
        createdAt: '2026-07-20'
      },
      {
        id: 'c-5',
        author: 'Omar',
        body: 'Reading lists help more than I expected. A shared text is a reason to come back next week.',
        createdAt: '2026-07-22'
      }
    ]
  },
  {
    id: 'q-epsilon-delta',
    title: 'When does the epsilon-delta definition actually click?',
    body: 'Students can manipulate the algebra and still not believe it. Is the missing piece a picture, a sequence of counterexamples, or sitting with one proof until the quantifiers feel inevitable?',
    author: 'Lina Ortiz',
    createdAt: '2026-08-10',
    field: 'mathematics',
    readingList: [
      {
        id: 'r-6',
        title: 'Understanding Analysis',
        note: 'Abbott’s opening chapters treat rigor as a change in how you see, not a list of tricks.'
      }
    ],
    comments: []
  },
  {
    id: 'q-discrete-before-cs',
    title: 'How much discrete math does a first algorithms course actually need?',
    body: 'Some syllabi front-load proofs and graphs. Others sneak the same ideas in through programming. What is the smallest set of objects a student should own before induction and complexity start to make sense?',
    author: 'Chris Adeyemi',
    createdAt: '2026-08-08',
    field: 'computer-science',
    readingList: [
      {
        id: 'r-7',
        title: 'Mathematics for Computer Science',
        url: 'https://ocw.mit.edu/courses/6-042j-mathematics-for-computer-science-spring-2015/',
        note: 'A public map of the discrete backbone.'
      }
    ],
    comments: []
  },
  {
    id: 'q-newtons-laws',
    title: 'How do you keep Newton’s laws from becoming a list of formulas?',
    body: 'Free-body diagrams, inertial frames, and “the force is not the motion” are easy to recite. What exercise, or what order of topics, makes mechanics feel like a way of seeing rather than a toolkit?',
    author: 'Jonah Hale',
    createdAt: '2026-08-06',
    field: 'physics',
    readingList: [
      {
        id: 'r-8',
        title: 'The Feynman Lectures on Physics, Vol. I',
        url: 'https://www.feynmanlectures.caltech.edu/',
        note: 'Especially the chapters that refuse to let Newton become a slogan.'
      }
    ],
    comments: []
  },
  {
    id: 'q-statics-dynamics',
    title: 'What do students actually miss between statics and dynamics?',
    body: 'The jump is supposed to be “now things move.” In practice it is free-body discipline, rotating frames, and the difference between a constraint and a force. Where should a syllabus slow down?',
    author: 'Renee Walsh',
    createdAt: '2026-08-05',
    field: 'engineering',
    readingList: [],
    comments: []
  },
  {
    id: 'q-stats-before-data',
    title: 'Should statistics start with data or with probability?',
    body: 'One path opens a spreadsheet on day one. The other insists on sample spaces first. Which order makes later courses in economics, biology, and machine learning less of a repair job?',
    author: 'Dev Patel',
    createdAt: '2026-08-04',
    field: 'statistics',
    readingList: [
      {
        id: 'r-9',
        title: 'OpenIntro Statistics',
        url: 'https://www.openintro.org/book/os/',
        note: 'A public text that tries to keep both stories in the room.'
      }
    ],
    comments: []
  },
  {
    id: 'q-mechanisms',
    title: 'What should you understand before memorizing reaction mechanisms?',
    body: 'Arrows and intermediates pile up. Is the real prerequisite acid-base, molecular orbital shape, or a small set of named patterns that later chapters are only remixing?',
    author: 'Sofia Nguyen',
    createdAt: '2026-08-01',
    field: 'chemistry',
    readingList: [],
    comments: []
  },
  {
    id: 'q-anatomy-vocab',
    title: 'How do you study anatomy without it turning into a vocabulary dump?',
    body: 'Lists of structures do not become a body. Does a spatial map, a clinical case, or drawing from memory do more work than another pass through the atlas?',
    author: 'Marcus Bell',
    createdAt: '2026-07-30',
    field: 'biology',
    readingList: [],
    comments: []
  },
  {
    id: 'q-finance-accounting',
    title: 'How should corporate finance sit next to accounting in a self-taught sequence?',
    body: 'Statements first, then valuation? Or a toy firm you keep on paper so the two languages stay attached? I want an order that does not pretend markets are a separate subject from books.',
    author: 'Amelia Cho',
    createdAt: '2026-07-26',
    field: 'business',
    readingList: [],
    comments: []
  },
  {
    id: 'q-networks-direction',
    title: 'Is a networks course better taught from packets up or from applications down?',
    body: 'The layered model is a map, not a syllabus. Starting at HTTP feels real; starting at the wire feels honest. Which direction leaves fewer holes when someone later has to debug a real system?',
    author: 'Theo Marsh',
    createdAt: '2026-07-24',
    field: 'computer-science',
    readingList: [],
    comments: []
  }
]
