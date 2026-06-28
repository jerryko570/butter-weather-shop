'use client'

/**
 * 로그인 — 이메일/비밀번호 + 소셜(구글·카카오).
 *
 * - ?next=...  : 로그인 후 돌아갈 곳 (보호된 페이지에서 넘어온 경우)
 * - ?error=auth: OAuth 콜백 실패 시 콜백 라우트가 이리로 보낸다 → 에러 안내
 */

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Text from '@/components/ui/Text/Text'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

function LoginContent() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 콜백에서 ?error=auth로 돌아온 경우 안내
  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError('소셜 로그인에 실패했어요. 다시 시도해주세요.')
    }
  }, [searchParams])

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

    router.refresh()
    router.push(next)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm"
    >
      <div className="space-y-1 text-center">
        <Text
          as="p"
          className="font-serif text-[15px] tracking-[0.12em] text-[var(--color-ink)] uppercase"
        >
          Butter Weather
        </Text>
        <Text as="p" className="text-[12px] text-[var(--color-ink-muted)]">
          로그인
        </Text>
      </div>

      {/* 소셜 로그인 */}
      <OAuthButtons next={next} />

      {/* 구분선 */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e5e5e5]" />
        <Text as="span" className="text-[11px] text-[var(--color-ink-subtle)]">
          또는 이메일로
        </Text>
        <span className="h-px flex-1 bg-[#e5e5e5]" />
      </div>

      {/* 이메일 로그인 */}
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
        <Text as="p" className="text-[12px] text-red-500" role="alert">
          {error}
        </Text>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[var(--color-ink)] py-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {loading ? '로그인 중…' : '이메일로 로그인'}
      </button>

      <Text
        as="p"
        className="text-center text-[12px] text-[var(--color-ink-muted)]"
      >
        아직 계정이 없으세요?{' '}
        <Link
          href="/signup"
          className="text-[var(--color-ink)] underline underline-offset-2"
        >
          회원가입
        </Link>
      </Text>
    </form>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
