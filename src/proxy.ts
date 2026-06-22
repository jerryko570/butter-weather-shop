import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16부터 middleware → proxy 로 명칭이 바뀌었다.
// 함수 이름도 export const config 도 그대로지만, 파일명은 proxy.ts, 함수는 proxy.
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  // ── 어드민 보호 ──
  // /admin 은 로그인 필수. 단, 로그인 페이지(/admin/login)는 예외(안 그러면 무한 리다이렉트).
  const isAdminArea =
    pathname.startsWith('/admin') && pathname !== '/admin/login'
  if (isAdminArea && !user) {
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }
  // 이미 로그인했는데 로그인 페이지로 오면 → 상품 관리로 보냄
  if (pathname === '/admin/login' && user) {
    return NextResponse.redirect(new URL('/admin/products', request.url))
  }

  // ── 손님 보호 ──
  // 결제는 로그인 필요 (기존 정책 유지)
  const isCheckout = pathname.startsWith('/checkout')
  if (isCheckout && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
