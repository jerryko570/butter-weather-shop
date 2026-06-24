'use client'

// PostHog 분석 — 페이지뷰·이벤트·세션 추적.
// 환경변수(NEXT_PUBLIC_POSTHOG_KEY)가 없으면 아무것도 안 한다(로컬·프리뷰 안전).

import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'
import { Suspense, useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY
const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com'

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return // 키 없으면 초기화 안 함
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // App Router라 수동으로 잡는다 (아래 PageViewTracker)
      capture_pageleave: true,
      person_profiles: 'identified_only', // 식별된 유저만 프로필 생성 (비용·프라이버시)
    })
  }, [])

  // 키가 없으면 Provider 없이 children만 (앱은 정상 동작)
  if (!POSTHOG_KEY) return <>{children}</>

  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  )
}

// App Router는 SPA 라우팅이라 페이지 이동 시 수동으로 $pageview를 보낸다.
function PageViewTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!POSTHOG_KEY) return
    let url = window.location.origin + pathname
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams])

  return null
}
