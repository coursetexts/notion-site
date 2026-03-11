import type { GetServerSideProps } from 'next'

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/about',
      permanent: false
    }
  }
}

export default function AllResourcesNewRedirectPage() {
  return null
}
