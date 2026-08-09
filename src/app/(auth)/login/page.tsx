'use client'

/**
 * 로그인 / 회원가입 — 소셜 전용 (구글·카카오).
 *
 * 소셜은 로그인과 회원가입이 같은 흐름이다. 처음이면 자동 가입 + 로그인,
 * 이미 있으면 그냥 로그인 (OAuthButtons의 signInWithOAuth가 알아서 처리).
 * → 그래서 별도 회원가입 페이지가 필요 없다. (/signup은 여기로 리다이렉트)
 *
 * - ?next=...  : 로그인 후 돌아갈 곳 (보호된 페이지에서 넘어온 경우)
 * - ?error=auth: OAuth 콜백 실패 시 콜백 라우트가 이리로 보낸다 → 에러 안내
 */

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Text from '@/components/ui/Text/Text'
import { OAuthButtons } from '@/components/auth/OAuthButtons'

function LoginContent() {
  const searchParams = useSearchParams()
  const next = searchParams.get('next') ?? '/'

  const [error, setError] = useState<string | null>(null)

  // 콜백에서 ?error=auth로 돌아온 경우 안내
  useEffect(() => {
    if (searchParams.get('error') === 'auth') {
      setError('소셜 로그인에 실패했어요. 다시 시도해주세요.')
    }
  }, [searchParams])

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl bg-white p-8 shadow-sm">
      <div className="space-y-1 text-center">
        <Text
          as="p"
          className="font-serif text-[15px] tracking-[0.12em] text-[var(--color-ink)] uppercase"
        >
          Butter Weather
        </Text>
        <Text as="p" className="text-[12px] text-[var(--color-ink-muted)]">
          로그인 / 회원가입
        </Text>
      </div>

      {/* 소셜 로그인 (처음이면 자동 가입) */}
      <OAuthButtons next={next} />

      {error && (
        <Text as="p" className="text-[12px] text-red-500" role="alert">
          {error}
        </Text>
      )}

      <Text
        as="p"
        className="text-center text-[11px] leading-relaxed text-[var(--color-ink-subtle)]"
      >
        처음이시면 자동으로 가입돼요.
      </Text>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}
