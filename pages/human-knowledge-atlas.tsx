import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async ({ query }) => {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string') params.set(key, value)
    else if (Array.isArray(value) && value[0]) params.set(key, value[0])
  }
  const suffix = params.toString()
  return {
    redirect: {
      destination: suffix ? `/field-atlas?${suffix}` : '/field-atlas',
      permanent: true
    }
  }
}

export default function HumanKnowledgeAtlasRedirect() {
  return null
}
