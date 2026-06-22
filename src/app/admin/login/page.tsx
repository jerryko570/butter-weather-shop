'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// 어드민 로그인 — Supabase Auth 이메일+비밀번호.
// 로그인 성공 시 세션 쿠키가 심어지고, RLS의 "관리자 이메일만 쓰기" 정책이 열린다.
export default function AdminLoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('로그인에 실패했어요. 이메일·비밀번호를 확인해주세요.')
      return
    }

    // 서버 컴포넌트들이 새 로그인 상태를 읽도록 갱신 후 이동
    router.refresh()
    router.push('/admin/products')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-cloud)] px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm"
      >
        <div className="space-y-1 text-center">
          <p className="font-serif text-[15px] tracking-[0.12em] text-[var(--color-ink)] uppercase">
            Butter Weather
          </p>
          <p className="text-[12px] text-[var(--color-ink-muted)]">
            관리자 로그인
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-[#e5e5e5] px-4 py-3 text-[14px] outline-none focus:border-[var(--color-ink)]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-[#e5e5e5] px-4 py-3 text-[14px] outline-none focus:border-[var(--color-ink)]"
          />
        </div>

        {error && (
          <p className="text-[12px] text-red-500" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[var(--color-ink)] py-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </div>
  )
}
