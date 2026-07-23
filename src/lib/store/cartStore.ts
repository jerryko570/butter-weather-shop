/* ════════════════════════════════════════════════════════════════
   ▌ 코드 원본 ─ 주석 없이 실제로 돌아가는 코드
   ════════════════════════════════════════════════════════════════ */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  slug: string
  name: string
  price_krw: number
  price_usd: number | null
  image: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  totalKrw: () => number
  totalUsd: () => number
  totalCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity === 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      totalKrw: () =>
        get().items.reduce((sum, i) => sum + i.price_krw * i.quantity, 0),
      totalUsd: () =>
        get().items.reduce(
          (sum, i) => sum + (i.price_usd ?? 0) * i.quantity,
          0
        ),
      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'butter-weather-cart' }
  )
)

/* ════════════════════════════════════════════════════════════════
   ▌ 코드 + 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   cartStore.ts — 장바구니 전역 상태 (Zustand)
   · 스토어 = 장바구니가 사는 "창고 1개" = 앱 전체가 공유해서 보는 데이터 보관소
   · ★ 전역 상태 = 앱 어디서든 이 창고를 열어
       "지금 장바구니 뭐 있지?"(읽기) / "이거 담아!"(쓰기) 를 함
   · persist로 localStorage에 자동 백업 → 새로고침해도 장바구니 유지


   ─────────────────────────────────────────────
   ★★ 전체 모양 = 커링 구조 (함수가 함수를 낳음) — 3층
   ─────────────────────────────────────────────
   create<CartStore>()(  persist(  (set,get)=>({…}) , {name:…}  )  )
   ───────┬────────      ───┬───   ───────┬────────   ────┬───
       겉: create          중간: persist    속: 알갱이      옵션
      (스토어 만들기)      (저장 미들웨어)   (상태+함수)

   ★ 평가 순서는 "안쪽 → 바깥쪽" (재료를 먼저 만들어야 넣을 수 있으니까)
     ① (set,get)=>({…})  알갱이 함수 준비
     ② persist(알갱이, 옵션) 실행 → 감싼 결과 완성  ← 재료 완성
     ③ create<CartStore>() 실행 → 함수 B 반환
     ④ B(②의 결과) 실행 → 최종 스토어
   → 즉 괄호 안 persist(...)가 먼저 계산돼야 B에 넣을 수 있다


   ─────────────────────────────────────────────
   ★★ (set, get) => ({ … }) — 주입 → 실행 → 객체
   ─────────────────────────────────────────────
   (set, get)  =>  ({ items: [], addItem: … })
   ────┬────       ──────────┬──────────────
    입력(입구)              출력(출구)
    zustand가 주입          함수가 돌려주는 객체 = 스토어 내용물

   흐름: zustand가 (set,get) 자리에 도구를 주입 → 그 함수가 실행됨
         → 객체를 돌려줌 → 그게 스토어 알맹이가 됨
   · 나는 "정의"만 써두고, 실행은 프레임워크(zustand/persist)가 함

   ★ 왜 ({ … }) 처럼 소괄호로 감쌌나?
       () => { … }   ← 중괄호만 = "코드 블록"으로 읽힘 (문장 묶음)
       () => ({ … }) ← 소괄호로 감싸야 "객체를 돌려준다"로 읽힘
     화살표 함수에서 객체를 바로 반환할 땐 소괄호 필수

   ★ 일반 함수와 같은 구조
       const 더하기 = (a, b) => a + b
         입력(매개변수) = (a, b)  ← 누가 넣어줌
         출력(반환값)   = a + b   ← 함수가 돌려줌
       더하기(3, 5) → 8   (입력이 있어야 출력이 나옴)


   ─────────────────────────────────────────────
   ★ 매개변수 = "저장"이 아니라 함수가 일하려고 받는 재료
   ─────────────────────────────────────────────
   · 매개변수(item, id, quantity, set, get …)는 어딘가에 보관되는 값이 아님
   · 함수가 일할 때 잠깐 받아 쓰는 재료 → 일 끝나면 사라짐
   · 진짜 "저장"되는 건 창고 안의 상태(items, isOpen)뿐
   예) addItem(item) → item은 담는 동안만 쓰이고 소멸 / 결과로 items가 갱신됨


   ─────────────────────────────────────────────
   ★ import 경로 = zustand 폴더 구조
   ─────────────────────────────────────────────
   zustand (도구상자)
     ├ create               ← 메인 방: 핵심 기능 (스토어 만들기)
     └ middleware (부가 칸)  ← 하위 폴더: 부가기능들
          ├ persist         ← 저장 (localStorage)
          └ devtools        ← 디버깅

   · from 'zustand'             → 메인
   · from 'zustand/middleware'  → 부가기능 방
   → 저장 같은 부가기능(장바구니·다크모드·로그인 유지)은 미들웨어 폴더에 따로


   ─────────────────────────────────────────────
   ★ 이름 규칙 — 파일명 vs 훅명
   ─────────────────────────────────────────────
   cartStore.ts                      ← 파일명: "무엇을 담았나(스토어)" 기준
   export const useCartStore = …     ← 훅명: use 붙임 (컴포넌트에서 훅으로 쓰니까)
   → 파일은 "창고 자체", 밖으로 내보내는 건 "그 창고를 쓰는 훅"


   ─────────────────────────────────────────────
   ★★ create<CartStore>()( … ) — 괄호가 2개인 진짜 이유
   ─────────────────────────────────────────────
   export const useCartStore = create<CartStore>()( persist(…) )
                ─────┬──────   ────────┬──── ─┬─  ─────┬─────
             최종을 담음          create()  타입 때문에  진짜 내용
          (= create 실행 결과)              비워둔 칸

   ▸ 실행이 2번 = 함수가 2개
       1) create<CartStore>()  → 첫 실행 → "함수 하나(B)"를 돌려받음 (이름 없음, 안 보임)
       2) B(persist(…))        → 두 번째 실행 → 그 함수 B에 persist 결과를 인자로 넣음
     ★ create 와 B 는 서로 다른 함수! (create가 뱉은 결과가 B)

   ▸ 왜 이렇게? — TypeScript 규칙 때문
       create는 속으로 타입이 여러 개 필요:  create<상태타입, 미들웨어타입, …>
       TS 규칙: 타입 인자를 하나라도 직접 쓰면 나머지도 다 써야 함 (부분 추론 X)
       → ()로 한 번 끊어 2단계로 우회:
           1단계: 상태타입만 고정하고 함수 반환
           2단계: 나머지 타입은 넘긴 인자(persist)를 보고 추론

   언제 2번, 언제 1번?
     타입 O + 미들웨어 O  →  create<CartStore>()( persist(…) )   ← 지금 이 파일
     타입만 (미들웨어 X)  →  create<CartStore>((set) => ({ … }))


   ─────────────────────────────────────────────
   ★ persist(콜백, 옵션) — 인자 2개
   ─────────────────────────────────────────────
   persist(
     (set, get) => ({ … }),          ← 인자1: 콜백 (스토어 알맹이)
     { name: 'butter-weather-cart' } ← 인자2: 옵션 (localStorage 키 이름)
   )
   · persist가 그 콜백을 "받아뒀다가" 나중에 set·get을 채워 실행해 준다
   · name = 브라우저 개발자도구 > Application > localStorage 에서 보이는 키


   ─────────────────────────────────────────────
   ★★ 이건 "클라이언트 상태" — React Query(서버 상태)와 다른 축
   ─────────────────────────────────────────────
   React Query (useProducts·usePurchase)   Zustand (여기)
     서버가 주인인 데이터                    브라우저가 주인인 데이터
     상품·주문 (DB에 있음)                   장바구니·패널 열림 (내 화면 상태)
     캐시·staleTime·isLoading 관리          그냥 내가 넣고 빼면 끝
     네트워크 O                              네트워크 X
   → "서버에서 가져오는 것"은 RQ, "내 브라우저에서만 사는 것"은 Zustand


   ─────────────────────────────────────────────
   ★ create vs persist (창고 만들기 vs 자동 저장)
   ─────────────────────────────────────────────
   create   : 스토어(창고) 만드는 기본 도구
   persist  : 미들웨어 = create 중간에 끼어드는 "중간 처리기"

   persist X → create → 상태가 메모리에만 → 새로고침하면 사라짐
   persist O → create → persist가 중간에서 가로챔
                        → localStorage에도 저장 → 새로고침해도 살아있음


   ─────────────────────────────────────────────
   ★ set vs get — 쓰기와 읽기 (매개변수로 받음)
   ─────────────────────────────────────────────
   set : 스토어를 새 상태로 바꾸고 리렌더 시킴 (쓰기)
         → set({...}) 또는 set((state) => ({...}))
   get : 현재 스토어 상태를 돌려줌 (읽기)
         → get().items  (합계 계산처럼 지금 값이 필요할 때)

   · 이 둘은 zustand가 내부에서 만들어 매개변수로 넣어주는 "도구 2개"
   · set은 "덮어쓰기가 아니라 병합" — 넘긴 키만 바뀌고 나머지는 그대로
     예) set({ isOpen: true }) 해도 items는 안 건드림
   · 이전 값이 필요하면 set((state) => …) 형태로 (state = 지금 상태)


   ─────────────────────────────────────────────
   1. 타입 정의 — 시그니처 읽는 법
   ─────────────────────────────────────────────
   ★ interface 블록은 전부 "양식(설계도)" — 값이 하나도 없다
     "이런 모양이어야 한다"만 적어둔 것. 실제 값은 아래 create 안에서 채움

   ▸ 함수 타입 한 줄 읽는 공식
       addItem      : (item: …)      => void
       ───┬───         ────┬────        ──┬──
        이름          받는 재료(매개변수)  돌려주는 값
                                        (void = 없음. 상태만 바꿈)

   // CartItem = 상품 1개 모양
   interface CartItem {
     id: string            // 상품 id
     slug: string          // 주소용
     name: string          // 이름
     price_krw: number     // 한화 (숫자)
     price_usd: number | null  // 달러 (없을 수도 있어서 | null)
     image: string         // 대표 이미지
     quantity: number      // 수량 ← 장바구니라서 추가된 칸 (상품 원본엔 없음)
   }

   // 창고 전체 모양 (+기능)
   interface CartStore {

     ── 상태 ──────────────────────────────
     items: CartItem[]   // 담긴 상품들의 배열 = 장바구니의 핵심 데이터
                         //   비어있으면 [] , 담기면 [사과, 배]
     isOpen: boolean     // 장바구니 창 열렸는지

     ── 함수 ──────────────────────────────
     addItem: (item: Omit<CartItem, 'quantity'>) => void
       👉 quantity 뺀 상품 정보를 item으로 받고 반환 없음
       ★ Omit<CartItem, 'quantity'> = CartItem에서 quantity만 뺀 타입
         (담을 때 수량을 안 넘기니까 — 함수가 알아서 1을 붙임)

     removeItem: (id: string) => void
       👉 id(문자열)를 받아서 아무것도 안 돌려주는 함수

     updateQuantity: (id: string, quantity: number) => void
       👉 id(문자열) + quantity(숫자)를 받고 돌려줄 것 없음(void). 0이면 삭제

     clearCart: () => void
       👉 아무것도 안 받고( () ), 돌려줄 것도 없음

     openCart / closeCart: () => void
       👉 () = 실행만 하면 되는 동작 (isOpen만 토글)

     ── 계산 ──────────────────────────────
     totalKrw / totalUsd / totalCount: () => number
       👉 받는 것 없이 "숫자를 돌려줌" (파생값)
       ※ 차이: => void(상태만 바꿈) vs => number(값을 돌려줌)
   }
   → 상태(데이터) + 동작(함수) + 계산(파생)을 한 인터페이스에 다 적음


   ─────────────────────────────────────────────
   2. 동작들 — 한 줄씩
   ─────────────────────────────────────────────
   addItem: (item) => set((state) => {
     const existing = state.items.find((i) => i.id === item.id)
     if (existing) {
       // 이미 있으면 → 그 항목만 quantity + 1
       return { items: state.items.map((i) =>
         i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) }
     }
     // 없으면 → 뒤에 새로 추가 (quantity: 1로 시작)
     return { items: [...state.items, { ...item, quantity: 1 }] }
   })
   // ★ 핵심 패턴: 원본을 고치지 않고 "새 배열/새 객체"를 만들어 돌려줌 (불변성)
   //     map + { ...i, quantity: … }  = 그 항목만 바꾼 복사본
   //     [...state.items, 새것]       = 기존 배열 + 새 항목인 새 배열
   //   왜? React가 "바뀐 걸" 알아채려면 참조가 달라져야 함 (직접 push하면 못 알아챔)

   removeItem: (id) => set((state) => ({
     items: state.items.filter((i) => i.id !== id)   // 그 id만 빼고 나머지로 새 배열
   }))

   updateQuantity: (id, quantity) => set((state) => ({
     items: quantity === 0
       ? state.items.filter((i) => i.id !== id)                    // 0이면 아예 제거
       : state.items.map((i) => (i.id === id ? { ...i, quantity } : i))  // 아니면 교체
   }))
   // · { ...i, quantity } = { ...i, quantity: quantity } 의 축약 (키·변수 이름 같을 때)

   clearCart: () => set({ items: [] })       // 통째로 비우기 (주문 완료 후 등)
   openCart:  () => set({ isOpen: true })    // 패널 열기
   closeCart: () => set({ isOpen: false })   // 패널 닫기


   ─────────────────────────────────────────────
   3. 계산값(파생) — reduce 3형제
   ─────────────────────────────────────────────
   totalKrw:   () => get().items.reduce((sum, i) => sum + i.price_krw * i.quantity, 0)
   totalUsd:   () => get().items.reduce((sum, i) => sum + (i.price_usd ?? 0) * i.quantity, 0)
   totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0)

   · reduce(콜백, 초기값) = 배열을 "하나의 값"으로 접기
       sum = 지금까지 누적, i = 이번 항목, 0 = 시작값
   · price_usd ?? 0 → 달러가가 없으면(null) 0으로 (계산 깨짐 방지)
   · ★ 상태로 "저장"하지 않고 그때그때 계산 → items만 바뀌면 합계는 자동으로 맞음


   ─────────────────────────────────────────────
   4. 쓰는 쪽에서는 (컴포넌트)
   ─────────────────────────────────────────────
   const items    = useCartStore((s) => s.items)      // 필요한 것만 골라 구독
   const addItem  = useCartStore((s) => s.addItem)
   const total    = useCartStore((s) => s.totalKrw())

   · ★ 통째로 쓰지 말고 (s) => s.items 처럼 "필요한 조각만" 고르는 게 좋음
     → 그 조각이 바뀔 때만 리렌더 (통째 구독은 아무거나 바뀌어도 리렌더)


   ─────────────────────────────────────────────
   5. 헷갈릴 때 메모
   ─────────────────────────────────────────────
   · 커링 3층: 겉(create) → 중간(persist) → 속(알갱이)
     평가는 안쪽부터: persist(...)가 먼저 완성돼야 B에 넣을 수 있음

   · 입력 → 출력
       (set, get)      => ({ … })
       zustand가 주입      함수가 돌려주는 객체 = 스토어 내용물
       (더하기(3,5)=8 과 같은 구조: 입력 있어야 출력 나옴)

   · () => ({ … }) 소괄호 필수 — 없으면 코드 블록으로 읽힘

   · 매개변수 = 저장 X, 함수가 일하려고 받는 재료 (끝나면 사라짐)
     진짜 저장되는 건 창고 안 상태(items·isOpen)

   · interface = 값 없는 "양식(설계도)" / 실제 값은 create 안에서 채움

   · 함수 타입 읽기: 이름 : (받는 재료) => 돌려주는 값
       => void = 상태만 바꿈 / => number = 값을 돌려줌

   · import 경로 = zustand 폴더 구조
       'zustand' = 메인(create) / 'zustand/middleware' = 부가(persist·devtools)

   · 전역 상태 = 앱 어디서든 같은 창고를 열어 읽고/담음 (props로 안 넘겨도 됨)

   · 이름: 파일 = cartStore.ts(무엇을 담았나) / 훅 = useCartStore(use 붙임)

   · create<T>()( … ) 괄호 2개 = 함수 2개
       create() → 함수 B 뱉음(이름 없음) → B(persist 결과) 실행. 둘은 다른 함수
       이유 = TS는 타입 인자를 하나 쓰면 나머지도 다 써야 함(부분 추론 X)

   · persist(콜백, 옵션) — 콜백을 받아뒀다 나중에 set·get 채워 실행

   · React Query(서버 상태) vs Zustand(클라 상태)
       DB에서 오는 것 = RQ / 내 브라우저에만 사는 것(장바구니·모달) = Zustand

   · create = 창고 만들기 / persist = 그 창고를 localStorage에 자동 저장

   · set = 쓰기(새 상태로 바꾸고 리렌더) / get = 읽기(현재 상태 돌려줌)
       set은 병합(넘긴 키만 변경) / 이전 값 필요하면 set((state) => …)

   · 불변성: push·직접수정 X → map·filter·스프레드로 "새 배열" 반환

   · Omit<CartItem, 'quantity'> = 그 키만 뺀 타입 (담을 땐 수량 안 받음)

   · 합계는 상태로 저장 X → reduce로 그때그때 계산

   · 구독은 조각으로: useCartStore((s) => s.items)
   ════════════════════════════════════════════════════════════════ */
