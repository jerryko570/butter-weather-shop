'use client'

/**
 * AccountNav — 네비게이션용 계정 영역 (헤더·사이드바 공용)
 *
 * - 비로그인: 로그인 링크 (소셜 전용 — 로그인=회원가입이라 하나로 통합)
 * - 로그인:   이메일 표시 + 로그아웃
 *
 * linkClass로 각 위치(헤더/사이드바)의 글자 스타일을 맞춘다.
 */

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Text from '@/components/ui/Text/Text'

export function AccountNav({
  linkClass,
  onNavigate,
}: {
  linkClass: string
  onNavigate?: () => void
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  // 최초 사용자 확인 중엔 깜빡임 방지로 아무것도 안 그린다
  if (loading) return null

  const handleSignOut = async () => {
    await signOut()
    onNavigate?.()
    router.refresh()
  }

  if (!user) {
    return (
      <Link href="/login" onClick={onNavigate} className={linkClass}>
        로그인
      </Link>
    )
  }

  return (
    <>
      <Text
        as="span"
        className="truncate text-[11px] text-[var(--color-ink-subtle)]"
      >
        {user.email}
      </Text>
      <button
        type="button"
        onClick={handleSignOut}
        className={`text-left ${linkClass}`}
      >
        로그아웃
      </button>
    </>
  )
}
