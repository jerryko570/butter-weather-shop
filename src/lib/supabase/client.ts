// 브라우저(클라이언트)에서 사용할 Supabase 연결 함수를 가져온다.
// createBrowserClient: 브라우저에서 사용할 Supabase 연결 객체를 만드는 함
// '@supabase/ssr': Next.js / SSR 환경 대응 (Supabase 공식 라이브러리)
import { createBrowserClient } from '@supabase/ssr'

// createClient(): 연결 객체 생성 (URL, KEY)
export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
