'use client'

/**
 * OAuthButtons — 소셜 로그인 버튼 묶음 (로그인·회원가입 공용)
 *
 * 소셜은 "로그인"과 "회원가입"이 같은 흐름이다. signInWithOAuth 한 번이면,
 * 처음이면 가입 + 로그인, 이미 있으면 그냥 로그인으로 처리된다.
 *
 * ★ 제공자 추가법: 아래 PROVIDERS 배열에 한 줄 추가하면 버튼이 자동으로 늘어난다.
 *   - 구글: Supabase 네이티브 (콘솔에서 켜고 키만 넣으면 됨)
 *   - 카카오: Supabase 네이티브 (카카오 디벨로퍼스 앱 등록 + 콘솔에 키)
 *   - 애플(미국 확장 시) / 네이버·위챗(커스텀 OAuth, 나중)도 여기에 추가
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Text from '@/components/ui/Text/Text'
import type { Provider } from '@supabase/supabase-js'

const PROVIDERS: { id: Provider; label: string; className: string }[] = [
  {
    id: 'google',
    label: 'Google로 계속하기',
    className:
      'border border-[#e5e5e5] bg-white text-[var(--color-ink)] hover:bg-[#fafafa]',
  },
  {
    id: 'kakao',
    label: '카카오로 계속하기',
    className: 'bg-[#FEE500] text-[#191600] hover:opacity-90',
  },
]

export function OAuthButtons({ next = '/' }: { next?: string }) {
  const supabase = createClient()
  const [loading, setLoading] = useState<Provider | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleOAuth = async (provider: Provider) => {
    setError(null)
    setLoading(provider)
    // 제공자 로그인 후 돌아올 곳. /auth/callback이 code→세션 교환을 처리하고 next로 보낸다.
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    })
    // 성공 시 브라우저가 제공자 페이지로 이동하므로 아래는 실패했을 때만 실행됨
    if (error) {
      setLoading(null)
      setError('소셜 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.')
    }
  }

  return (
    <div className="space-y-2">
      {PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => handleOAuth(p.id)}
          disabled={loading !== null}
          className={`w-full rounded-lg py-3 text-[13px] font-medium transition-opacity disabled:opacity-50 ${p.className}`}
        >
          {loading === p.id ? '이동 중…' : p.label}
        </button>
      ))}
      {error && (
        <Text as="p" className="text-[12px] text-red-500" role="alert">
          {error}
        </Text>
      )}
    </div>
  )
}
