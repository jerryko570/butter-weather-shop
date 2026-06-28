/**
 * [OAuth 콜백 라우트]
 * 구글 로그인 후, 구글이 사용자를 이 주소로 돌려보낸다(?code=... 를 붙여서).
 * 그 code를 Supabase 세션(로그인 쿠키)으로 교환하고, 원래 가려던 곳으로 보낸다.
 *
 * 흐름: /login 에서 구글 클릭 → 구글 로그인 → /auth/callback?code=... → (여기서 세션 발급) → next 페이지
 *
 * ⚠️ 이 라우트가 동작하려면 Supabase 콘솔에 이 주소가 Redirect URL로 등록돼 있어야 한다.
 *    (Authentication → URL Configuration → Redirect URLs)
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // 로그인 전에 가려던 페이지. 없으면 홈으로.
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    // code → 세션 교환. 성공하면 로그인 쿠키가 심어진다.
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // code가 없거나 교환 실패 → 로그인 페이지로 (에러 표시)
  return NextResponse.redirect(`${origin}/login?error=auth`)
}
