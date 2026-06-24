import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Next.js 16부터 middleware → proxy 로 명칭이 바뀌었다.
// 함수 이름도 export const config 도 그대로지만, 파일명은 proxy.ts, 함수는 proxy.
export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isAdminArea =
    pathname.startsWith('/admin') && pathname !== '/admin/login'
  const isCheckout = pathname.startsWith('/checkout')

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // ── 가드: Supabase 환경변수가 없으면 인증 자체를 못 한다 ──
  // 이 경우 사이트 전체를 500으로 죽이지 않고, 공개 경로는 통과시킨다.
  // 단, 보호 경로(어드민·체크아웃)는 안전하게 로그인으로 보낸다(fail-closed).
  if (!supabaseUrl || !supabaseAnonKey) {
    if (isAdminArea) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (isCheckout) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next({ request })
  }

  try {
    let supabaseResponse = NextResponse.next({ request })
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // ── 어드민 보호 ──
    // /admin 은 로그인 필수. 단, 로그인 페이지(/admin/login)는 예외(무한 리다이렉트 방지).
    if (isAdminArea && !user) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    // 이미 로그인했는데 로그인 페이지로 오면 → 상품 관리로 보냄
    if (pathname === '/admin/login' && user) {
      return NextResponse.redirect(new URL('/admin/products', request.url))
    }

    // ── 손님 보호 ── 결제는 로그인 필요
    if (isCheckout && !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return supabaseResponse
  } catch {
    // 인증 확인 중 예외(네트워크·설정 오류 등)가 나도 사이트를 죽이지 않는다.
    // 보호 경로는 fail-closed(로그인으로), 공개 경로는 통과.
    if (isAdminArea) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    if (isCheckout) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    return NextResponse.next({ request })
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
