import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/product'

const PAGE_SIZE = 12

/** 목록(복수) — 12개씩 페이지네이션 / 목록 화면에서 사용 */
export const useProducts = (category?: string) => {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['products', category],
    queryFn: async ({ pageParam = 0 }) => {
      // 함수 본문: 코드 줄
      let query = supabase
        .from('products')
        .select('*') // 어떤 정보 칸을 볼건지
        .eq('is_active', true) // 어떤 행을 꺼낼건지 (ex.이름,이미지,가격 등)
        // 스키마(DB)와 코드(훅) 연결되는 첫번째 지점
        // 되돌릴 수 있음. 데이터 안날라감. 주문 기록 안깨짐
        // .from/.select/.eq => 그 정책의 검사를 받으러 가는 요청 / RLS(규칙)
        // 주문서가 RLS를 통과해야 결과가 나옴
        // 종류는 다르지만 실행 때 만나고, 주문서가 DB 가면 RLS가 결과로 나갈 행 하나하나 검사
        // 읽기만 볼 수 있는 행만 조용히 골라주고(숨김) 쓰기면 권한 없음 엄격히 입구컷
        // RLS는 행을 본다
        .range(pageParam as number, (pageParam as number) + PAGE_SIZE - 1)
        .order('created_at', { ascending: false })

      if (category) query = query.eq('category', category)

      const { data, error } = await query
      if (error) throw error
      return data as Product[]
    },
    // 별도옵션: 유저가 fetchNextPage 누름 -> queyFn 실행 (pageParam=12)
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  })
}

/** 단일(단수) — slug로 상품 1개 / 상세 화면에서 사용 */
export const useProduct = (slug: string) => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true) // published(공개)만 — 초안은 상세도 안 보이게
        .single()
      if (error) throw error
      return data as Product
    },
    staleTime: 1000 * 60 * 10,
  })
}

/* ═══════════════════════════════════════════════════════════════════
   📚 핵심 노트 — 이것만 알면 됨
   ═══════════════════════════════════════════════════════════════════

   ① 구조
      커스텀 훅 안에서 useInfiniteQuery / useQuery를 실행해 return.
      · 넣는 것 = 설정 객체 { queryKey, queryFn, ... }
      · 나오는 것 = 결과 꾸러미 { data, error, isLoading, fetchNextPage, ... }
      -> 요청·캐시·로딩/에러는 전부 React Query가 관리

   ② queryKey = 캐시 라벨
      같으면 캐시 재사용 / 다르면 새 요청.
      [주의] category를 꼭 넣어야 함 (빼면 필터 바꿔도 옛 캐시가 뜨는 버그)

   ③ queryFn = React Query가 "대신 실행"하는 함수
      출구 2개:  return data -> 성공  /  throw error -> 실패

   ④ 쿼리빌더 체인은 await 전엔 "주문서 작성"만 (DB에 안 감)
      .from(테이블) .select(컬럼) .eq(필터) .range(페이지) .order(정렬)
      · await query 하는 순간 SQL로 번역돼 DB로 발사
      · let인 이유 -> 아래 if에서 .eq를 덧붙여 덮어써야 해서

   ⑤ if (category) -> 특정만 .eq 실행 / 없으면 건너뜀(전체)
      .eq('category', category)
         앞 'category' = DB 컬럼명(고정) / 뒤 category = 받은 값('키링')

   ⑥ Supabase 응답 { data, error }
      한쪽이 값이면 다른 쪽은 null. (성공: error=null / 실패: data=null)
      [주의] Supabase는 자동 throw 안 함 -> 내가 직접 if(error) throw

   ⑦ 던지는 건 나(queryFn), 받는 건 React Query(catch)
      React Query는 isError를 켜줄 뿐, 실제 에러 화면은 컴포넌트가 그림.
         queryFn  ->  throw error
         RQ       ->  catch -> isError=true, error칸에 담음
         컴포넌트  ->  isError 보고 에러 UI 렌더

   ⑧ pageParam 타이밍
      React Query가 queryFn "시작할 때" 넣어줌 (처음 = initialPageParam: 0)
      성공한 "다음"에 getNextPageParam이 "다음 pageParam"을 계산해 둠.

   ⑨ getNextPageParam — 다음 페이지 있나?
      방금 받은 게 꽉 찼나(=== 12)?
         꽉 참 -> allPages.length × 12 (다음 시작 위치)
         덜 참 -> undefined (끝, hasNextPage=false)
      ※ 12개 달랬는데 적게 옴 = 남은 게 그뿐 = 마지막

   ⑩ staleTime
      그 기간 동안 데이터를 "신선"하다고 믿고 재요청 X (캐시 바로 씀).
      지나도 즉시 삭제·재요청 X -> "낡음" 표시만 -> 트리거 시 백그라운드 갱신.

   ⑪ useProduct (단수)
      .single() -> 딱 1개를 객체로 반환 (0개·2개+면 throw)
      return은 Product[] 아니라 Product (배열 아님)

   ⑫ as = 검사 아닌 "약속"
      return data as Product[] -> 런타임 검사 X.
      DB 모양이 달라도 컴파일러는 못 잡음. (안전하게 하려면 Zod 등으로 검증)

   ── 전체 흐름 한 줄 ──────────────────────────────────────────────
   주문서 작성 -> await로 Supabase 발사 -> { data, error } 받음
   -> if(error) throw / return data -> React Query가 받아서
   (성공: data칸+캐시 / 실패: catch->isError) -> 컴포넌트가 꺼내 씀

   ⭐️ 객체의 { }
   - 옵션(속성), 키: 값, 구분: 콤마로 나열, 순서 상관없음

   ⭐️ 함수의 { }
   - 문장(코드줄), 실행되는 명령들, 줄바꿈/세미클론, 위-> 아래 순서대로 실행
   ═══════════════════════════════════════════════════════════════════ */
