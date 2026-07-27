import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function Chem163() {
  const router = useRouter()

  useEffect(() => {
    router.push('/modern-atomic-and-optical-physics-iphysics285a')
    window.location.href = '/modern-atomic-and-optical-physics-iphysics285a'
  }, [router])

  return null
}
