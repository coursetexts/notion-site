import type { GetServerSideProps } from 'next'

function catalogView(raw: string | string[] | undefined, hasTopic: boolean): string {
  const value = Array.isArray(raw) ? raw[0] || '' : raw || ''
  if (
    value === 'academic' ||
    value === 'courses' ||
    value === 'university'
  ) {
    return 'academic'
  }
  if (value === 'goals' || value === 'learning-paths' || value === 'paths') {
    return 'goals'
  }
  if (value === 'degrees' || value === 'degree') return 'degrees'
  if (value === 'research' || value === 'questions') return 'research'
  if (hasTopic && !value) return 'goals'
  return 'all'
}

/** Old catalog URLs now live at /paths/all-paths. */
export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const params = new URLSearchParams()
  const topic = ctx.query.topic
  const hasTopic = Array.isArray(topic) ? Boolean(topic[0]) : Boolean(topic)

  for (const [key, value] of Object.entries(ctx.query)) {
    if (key === 'view') continue
    const entry = Array.isArray(value) ? value[0] : value
    if (entry) params.set(key, entry)
  }

  params.set('view', catalogView(ctx.query.view, hasTopic))

  return {
    redirect: {
      destination: `/paths/all-paths?${params.toString()}`,
      permanent: true
    }
  }
}

export default function PathsAllCoursesRedirect() {
  return null
}
