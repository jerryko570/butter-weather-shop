/**
 * Supabase 브라우저용 클라이언트 생성 함수.
 *
 * createClient() 한 번 호출이면, DB와 대화할 대리인 객체를 만들어 돌려준다.
 * 매번 주소·키를 적지 않으려고 감싸둔 것.
 *
 * 관계 정리:
 *   createBrowserClient  ← Supabase가 준 본체 (호출 시 주소·키를 매번 줘야 함)
 *           ↑ 감쌈
 *   createClient         ← 내가 만든 포장지 (주소·키를 미리 넣어둠)
 *           ↑ 호출
 *   supabase             ← 실제로 나온 대리인 객체 (.from().select() 등을 시킴)
 *
 * 그래서 내 코드에서는 createBrowserClient를 직접 부를 일이 거의 없고,
 * 항상 createClient()만 호출한다.
 *
 * 참고: 클라이언트(브라우저)용과 서버용은 분리한다.
 * 서버는 브라우저의 localStorage를 볼 수 없는 별개 환경이기 때문.
 */

import { createBrowserClient } from '@supabase/ssr'
// @supabase/ssr: 세션을 쿠키에 저장해, 서버와 브라우저가 같은 로그인 상태를 공유하게 해주는 패키지.
// 덕분에 서버 렌더링 환경에서도 인증이 그대로 동작한다.

export const createClient = () =>
  // 본체(createBrowserClient)를 호출하면서 주소·키를 대신 넣어주는 포장지 함수.
  // 호출할 때마다 새 대리인 객체를 만들어 반환한다.
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, // 접속할 Supabase 프로젝트 주소
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! // 공개 키 (RLS 정책이 실제 접근을 통제)
  )
