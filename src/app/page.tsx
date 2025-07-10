'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const player = localStorage.getItem('rhythmEcho_player')
    if (player) {
      router.push('/game')
    }
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-2xl font-bold">Rhythm Echo</h1>
      <Link href="/login" className="bg-blue-500 text-white p-2 rounded">
        게임 시작
      </Link>
    </div>
  )
}
