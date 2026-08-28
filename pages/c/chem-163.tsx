import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Chem163() {
  const router = useRouter()

  useEffect(() => {
    router.push('/course/frontiers-in-biophysicschem163')
    window.location.href = '/course/frontiers-in-biophysicschem163'
  }, [router])

  return null
}
