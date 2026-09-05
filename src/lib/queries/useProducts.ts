import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/product'

const PAGE_SIZE = 12

export const useProducts = (category?: string) => {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['products', category],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .range(pageParam as number, (pageParam as number) + PAGE_SIZE - 1)
        .order('created_at', { ascending: false })

      if (category) query = query.eq('category', category)

      const { data, error } = await query
      if (error) throw error
      return data as Product[]
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  })
}

export const useProduct = (slug: string) => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*') // 모든 컬럼이 들어옴
        .eq('slug', slug)
        .eq('is_active', true)
        .single() // 한 행(객체)을 통째로 가져와서 product에 담음
      if (error) throw error
      return data as Product
    },
    staleTime: 1000 * 60 * 10,
  })
}

/* ════════════════════════════════════════════════════════════════
   ▌ 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   useProducts.ts — 상품 조회 (React Query + Supabase)
   · 이 파일 = 서버에서 "읽어오는" 쪽 🔵
       useProducts  목록(복수) — 12개씩 페이지네이션 / 목록 화면
       useProduct   단일(단수) — slug로 상품 1개 / 상세 화면
   · 장바구니(cartStore)와 정반대 축:
       여기 = 서버가 주인인 데이터 (React Query)
       거기 = 브라우저가 주인인 데이터 (Zustand)


   ═════════════════════════════════════════════
   ★★★ 구조 — 훅 안에서 훅을 실행해 그대로 return
   ═════════════════════════════════════════════
   커스텀 훅 안에서 useInfiniteQuery / useQuery를 실행해 return 한다
       넣는 것 = 설정 객체   { queryKey, queryFn, … }
       나오는 것 = 결과 꾸러미 { data, error, isLoading, fetchNextPage, … }
   → 요청·캐시·로딩/에러는 전부 React Query가 관리
   → 나는 "무엇을 어떻게 가져올지"만 적어둔다

   · 이 꾸러미를 page에서 이렇게 받는다
       const { data: product, isLoading, error } = useProduct(slug)


   ═════════════════════════════════════════════
   ★★★ 쿼리 빌더 체인 — await 전엔 "주문서 작성"일 뿐
   ═════════════════════════════════════════════
   supabase
     .from('products')                    테이블 지정 (어느 표에서)
     .select('*')                         컬럼 선택   (어떤 칸을 볼지)
     .eq('is_active', true)               행 필터     (어떤 줄을 꺼낼지)
     .range(시작, 끝)                      페이지      (몇 번째부터 몇 개)
     .order('created_at', {…})            정렬

   ★ 칸(컬럼) vs 줄(행) — 이 구분이 핵심
       .select  = 세로로 자르기 → 이름·이미지·가격 같은 "칸"을 고름
       .eq      = 가로로 자르기 → 조건에 맞는 "행"만 고름

   ★ 여기까지는 DB에 안 간다
     · 체인은 "주문서를 적는 것"일 뿐
     · await query 하는 순간 SQL로 번역돼 DB로 발사됨
   ★ let인 이유
     · 아래 if에서 .eq를 덧붙여 다시 대입(덮어쓰기)해야 해서
       if (category) query = query.eq('category', category)
     · 조건이 있으면 한 줄 더 붙이고, 없으면 건너뜀(= 전체)

   ★ .eq('category', category) — 같은 단어 두 개가 다른 뜻
       앞 'category'  = DB 컬럼명 (고정된 문자열)
       뒤  category   = 이 훅이 받은 값 ('키링' 같은)

   · .from은 "이미 있는 테이블을 지정"하는 것
     테이블을 만드는 건 SQL의 create table (여기서 하는 일 아님)


   ═════════════════════════════════════════════
   ★★★ RLS — 주문서는 검문을 통과해야 한다
   ═════════════════════════════════════════════
   ★ .from / .select / .eq 는 그냥 데이터를 집어오는 게 아니라
     "그 정책의 검사를 받으러 가는 요청"이다
     → 주문서가 DB에 도착하면 RLS(Row Level Security)가 검사한다

   ★ RLS는 "행"을 본다
     나갈 행 하나하나를 검사해서 통과시킬지 말지 정함
       읽기(select) → 볼 수 있는 행만 조용히 골라서 준다 (숨김)
                      → 없는 것처럼 보일 뿐, 에러는 안 남
       쓰기(insert·update) → 권한 없으면 엄격히 입구컷 (에러)

   ★ 스키마(DB)와 코드(훅)가 만나는 첫 지점이 여기다
     · 종류는 다르지만(정책 vs 코드) 실행 시점에 만난다
     · 그래서 "코드는 맞는데 데이터가 안 나온다" = RLS 의심 지점

   · is_active 필터도 같은 결: 공개(published)만 보이게
     → 초안 상품은 목록에도, 상세에도 안 나옴
   · RLS 정책은 되돌릴 수 있다 — 정책만 바꾸는 것이라
     데이터가 날아가지 않고 주문 기록도 안 깨진다


   ═════════════════════════════════════════════
   ★★★ queryFn — React Query가 "대신 실행"하는 함수
   ═════════════════════════════════════════════
   queryFn: async ({ pageParam = 0 }) => { … }
     · 내가 부르는 게 아니라 React Query가 필요할 때 부른다
     · pageParam도 React Query가 넣어준다 (cartStore의 set·state와 같은 구조)

   ★ 출구는 딱 2개
       return data   → 성공
       throw error   → 실패

   ★ Supabase 응답 { data, error }
     · 한쪽이 값이면 다른 쪽은 null
         성공 → data 있음 / error = null
         실패 → data = null / error 있음
     · ★ Supabase는 자동으로 throw하지 않는다
       → 그래서 내가 직접 if (error) throw error 를 써줘야 함

   ★ 던지는 건 나, 받는 건 React Query
       queryFn    → throw error
       RQ         → catch → isError = true, error 칸에 담아둠
       컴포넌트    → isError 보고 에러 UI 렌더
     · RQ는 isError를 켜줄 뿐, 실제 에러 화면은 컴포넌트가 그린다


   ═════════════════════════════════════════════
   ★★★ 페이지네이션 — pageParam 타이밍
   ═════════════════════════════════════════════
   ① 처음      initialPageParam: 0        → queryFn(pageParam = 0)
   ② 사용자가  fetchNextPage() 누름
   ③ 그러면    queryFn이 다시 실행됨 (pageParam = 12)
   ④ 성공 후   getNextPageParam이 "다음 pageParam"을 미리 계산해 둠

   ★ 순서 정리
     pageParam은 queryFn을 "시작할 때" 넣어주고,
     getNextPageParam은 성공한 "다음"에 계산한다

   ★ getNextPageParam — 다음 페이지가 있나?
       lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined
       방금 받은 게 꽉 찼나(=== 12)?
         꽉 참 → allPages.length × 12  (다음 시작 위치)
         덜 참 → undefined            (끝. hasNextPage = false)
     ※ 12개 달랬는데 적게 왔다 = 남은 게 그뿐 = 마지막 페이지

   · .range(pageParam, pageParam + PAGE_SIZE - 1)
     0부터 세니까 -1 (0~11 = 12개)


   ═════════════════════════════════════════════
   ★ queryKey = 캐시 라벨
   ═════════════════════════════════════════════
   queryKey: ['products', category]
   · 같으면 캐시 재사용 / 다르면 새 요청
   · ★ category를 꼭 넣어야 함
     → 빼면 필터를 바꿔도 옛 캐시가 그대로 뜨는 버그


   ═════════════════════════════════════════════
   ★ staleTime — "신선하다"고 믿는 기간
   ═════════════════════════════════════════════
   useProducts  5분  (1000 * 60 * 5)
   useProduct   10분 (1000 * 60 * 10)

   · 그 기간 동안은 재요청 안 하고 캐시를 바로 씀
   · 지나도 즉시 삭제·재요청하는 게 아님
     → "낡음" 표시만 붙고, 트리거(포커스 등) 시 백그라운드로 갱신
   · 상세가 더 긴 이유 = 잘 안 바뀌는 데이터라서


   ═════════════════════════════════════════════
   ★ useProduct (단수) — 목록과 다른 점
   ═════════════════════════════════════════════
   · .single()  → 딱 1개를 "객체"로 반환 (0개거나 2개 이상이면 throw)
   · 그래서 리턴이 Product[] 가 아니라 Product (배열 아님)
   · .eq('slug', slug) + .eq('is_active', true)
     → 그 slug이면서 공개 상태인 상품 1개
   · useQuery 사용 (페이지 개념이 없으니 useInfiniteQuery 아님)


   ═════════════════════════════════════════════
   ★ as = 검사가 아니라 "약속"
   ═════════════════════════════════════════════
   return data as Product[]
   · 런타임 검사를 하지 않는다 — "이 타입이라고 치자"는 선언일 뿐
   · DB 모양이 실제로 달라도 컴파일러는 못 잡음
   · 엄격하게 하려면 Zod 같은 걸로 실제 검증을 붙여야 함


   ═════════════════════════════════════════════
   ★★ { } 두 종류 — 객체냐 코드블록이냐
   ═════════════════════════════════════════════
   ⭐️ 객체의 { }
       옵션(속성)을 "키: 값"으로 나열
       콤마로 구분 / 순서 상관없음
       예) useQuery({ queryKey, queryFn, staleTime })

   ⭐️ 함수의 { }
       실행되는 문장(코드 줄)들의 묶음
       줄바꿈·세미콜론으로 구분 / 위→아래 순서대로 실행
       예) queryFn: async () => { … }

   · 같은 기호지만 완전히 다른 것 — 위치로 구분한다
   · cartStore의 "() => { … } vs () => ({ … })",
     page의 "for (…) { … } vs addItem({ … })" 와 같은 구분


   ─────────────────────────────────────────────
   전체 흐름 한 줄
   ─────────────────────────────────────────────
   주문서 작성(체인) → await로 Supabase 발사 → RLS 검사 통과
   → { data, error } 받음 → if(error) throw / return data
   → React Query가 받아서 (성공: data칸 + 캐시 / 실패: catch → isError)
   → 컴포넌트가 꺼내 씀


   ─────────────────────────────────────────────
   헷갈릴 때 메모
   ─────────────────────────────────────────────
   · 넣는 것 = 설정 객체 / 나오는 것 = 결과 꾸러미 (RQ가 다 관리)

   · 체인은 주문서 작성일 뿐 — await 해야 DB로 발사
     .select = 칸(컬럼) 고르기 / .eq = 줄(행) 고르기
     let인 이유 = if에서 .eq를 덧붙여 덮어쓰려고

   · RLS는 행 단위 검문 — 읽기는 조용히 숨김 / 쓰기는 입구컷
     "코드는 맞는데 데이터가 안 나온다" → RLS 의심
     정책 수정은 되돌릴 수 있음 (데이터·주문 기록 안 깨짐)

   · queryFn은 RQ가 대신 실행 / pageParam도 RQ가 넣어줌
     출구 2개: return data(성공) / throw error(실패)
     Supabase는 자동 throw 안 함 → if(error) throw 직접

   · 던지는 건 나, 받는 건 RQ, 그리는 건 컴포넌트

   · pageParam은 시작할 때 주입 / getNextPageParam은 성공 후 계산
     꽉 찼으면 다음 위치, 덜 찼으면 undefined(끝)

   · queryKey에 category 필수 (빼면 옛 캐시가 뜨는 버그)

   · staleTime 지나도 바로 안 지움 — "낡음" 표시 후 백그라운드 갱신

   · .single() = 1개를 객체로 (0개·2개+면 throw) → Product[] 아니라 Product

   · as는 약속일 뿐 런타임 검사 X

   · { } 는 위치로 구분: 옵션 나열이면 객체 / 문장 묶음이면 코드블록
   ════════════════════════════════════════════════════════════════ */
