'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const isValid = /^[A-Za-z0-9가-힣]{2,12}$/.test(name)
    if (!isValid) {
      setError('2-12자 한글/영문/숫자만 입력하세요.')
      return
    }
    const data = {
      name,
      playerKey: `rhythmEcho_player_${Date.now()}`,
      createdAt: new Date().toISOString(),
    }
    localStorage.setItem('rhythmEcho_player', JSON.stringify(data))
    router.push('/game')
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          className="border p-2 rounded"
          value={name}
          placeholder="플레이어 이름"
          onChange={(e) => setName(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          시작하기
        </button>
      </form>
    </div>
  )
}
