import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Chem163() {
  const router = useRouter()

  useEffect(() => {
    router.push('/frontiers-in-biophysicschem163')
    window.location.href = '/frontiers-in-biophysicschem163'
  }, [router])

  return null
}
