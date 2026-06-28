'use client'

/**
 * 회원가입 — 이메일/비밀번호 + 소셜(구글·카카오).
 *
 * - 이메일 가입: supabase.auth.signUp. 프로젝트에 "이메일 확인"이 켜져 있으면
 *   세션이 바로 안 생기고 확인 메일이 발송된다 → 안내 화면을 보여준다.
 *   꺼져 있으면 즉시 로그인되어 홈(또는 next)으로 이동.
 * - 소셜 가입: OAuthButtons (로그인과 동일 흐름).
 */

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Text from '@/components/ui/Text/Text'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

function SignupContent() {
  const router = useRouter()
  const supabase = createClient()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sentEmail, setSentEmail] = useState(false) // 확인 메일 안내 화면

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    setLoading(false)

    if (error) {
      setError(
        '회원가입에 실패했어요. 이미 가입된 이메일이거나 비밀번호가 너무 짧을 수 있어요. (최소 6자)'
      )
      return
    }

    if (data.session) {
      // 이메일 확인이 꺼져 있어 바로 로그인된 경우
      router.refresh()
      router.push(next)
    } else {
      // 확인 메일 발송된 경우
      setSentEmail(true)
    }
  }

  // 확인 메일 안내
  if (sentEmail) {
    return (
      <div className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-8 text-center shadow-sm">
        <Text
          as="p"
          className="font-serif text-[15px] tracking-[0.12em] text-[var(--color-ink)] uppercase"
        >
          확인 메일을 보냈어요
        </Text>
        <Text
          as="p"
          className="text-[13px] leading-relaxed text-[var(--color-ink-muted)]"
        >
          {email}로 보낸 메일의 링크를 누르면 가입이 완료돼요. 메일이 안 보이면
          스팸함도 확인해주세요.
        </Text>
        <Link
          href="/login"
          className="inline-block w-full rounded-lg bg-[var(--color-ink)] py-3 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          로그인하러 가기
        </Link>
      </div>
    )
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
          회원가입
        </Text>
      </div>

      {/* 소셜 가입 */}
      <OAuthButtons next={next} />

      {/* 구분선 */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[#e5e5e5]" />
        <Text as="span" className="text-[11px] text-[var(--color-ink-subtle)]">
          또는 이메일로
        </Text>
        <span className="h-px flex-1 bg-[#e5e5e5]" />
      </div>

      {/* 이메일 가입 */}
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
          placeholder="비밀번호 (6자 이상)"
          required
          minLength={6}
          autoComplete="new-password"
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
        {loading ? '가입 중…' : '이메일로 가입하기'}
      </button>

      <Text
        as="p"
        className="text-center text-[12px] text-[var(--color-ink-muted)]"
      >
        이미 계정이 있으세요?{' '}
        <Link
          href="/login"
          className="text-[var(--color-ink)] underline underline-offset-2"
        >
          로그인
        </Link>
      </Text>
    </form>
  )
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupContent />
    </Suspense>
  )
}
