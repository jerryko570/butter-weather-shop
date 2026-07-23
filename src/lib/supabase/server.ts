// Next.js 16에서 cookies()는 비동기 API라서 await가 붙음 (요청 정보를 꺼내기 때문)
// supabase 서버 클라이언트는 누가 요청했는지 (로그인 상태)를 알아야 함 -> 신분 정보가 요청에 딸려온 쿠키에 있음
// 쿠키를 읽어서 이 사람 누구네 하고 클라이언트에 담는거임 -> 나중에 RLS 검사 때 권한 있나 판단의 근거
// createClient는 DB 안다녀옴

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = async () => {
  const cookieStore = await cookies() // await cookies 읽기
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
