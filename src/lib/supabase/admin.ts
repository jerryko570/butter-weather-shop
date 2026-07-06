import { createClient } from '@supabase/supabase-js'

/**
 * 관리자 전용 Supabase 클라이언트 (service role).
 *
 * - service_role 키는 RLS(행 보안)를 "우회"한다. 그래서 어드민이 모든 주문을
 *   읽고/취소 처리할 수 있다. (손님용 anon 키는 RLS에 막혀 남의 주문을 못 봄)
 * - ⚠️ 이 키는 전능하므로 절대 브라우저로 나가면 안 된다.
 *   반드시 서버 코드(Route Handler)에서만 import 할 것. NEXT_PUBLIC_ 아님.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
