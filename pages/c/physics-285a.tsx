import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Chem163() {
  const router = useRouter()

  useEffect(() => {
    router.push('/course/modern-atomic-and-optical-physics-iphysics285a')
    window.location.href = '/course/modern-atomic-and-optical-physics-iphysics285a'
  }, [router])

  return null
}
