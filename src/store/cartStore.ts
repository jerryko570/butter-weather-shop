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

// 🚀 모양(구조) 파생 - 객체 모양 원천 -> 설계도
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

/**
 * 1. interface CartStore (모양 설계도)
 * 2. (set,get) => ({...}) -> 콜백이 그 모양대로 객체 생성
 * 3. ① 값은 코드 초기값 (item:[]) -> ② 사용자 행동 (set) ->  ③ 새로고침 시 localStorage 복원
 * 4. useCartStore에 저장 -> useCart로 꺼냄 -> CartDrawer가 화면에 그림 (꺼내씀)
 *
 */

export const useCartStore = create<CartStore>()(
  persist(
    // 🚀 실제 객체
    //🟡 새로고침 후 (복원) - persist가 localStorage에서 읽어와 다시 채움
    (set, get) => ({
      items: [], // 🟢 데이터 원본 - 값 X, 자리 O (빈 배열도 localStorage에 저장됨)
      //🟡 태초 (코드 초기값) - 콜백에 직접 적은 값
      isOpen: false, // 🟢 데이터 원본 - boolean
      addItem: (item) =>
        //     ======= 누가 이 함수를 부르는 것인가 ? addItem을 호출하는 컴포넌트가 넣는다
        //     ㄴ addItem을 부를 때 넣은 {} 객체가 매개변수 (함수입구) 에 들어감
        //🟡 사용자 행동 - addItem 호출 - items에 상품 채워짐
        set((state) => {
          // ===== 업데이트
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
   ▌ 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   cartStore.ts — 장바구니 전역 상태 (Zustand)
   · 스토어 = 장바구니가 사는 "창고 1개" = 앱 전체가 공유해서 보는 데이터 보관소
   · ★ 전역 상태 = 앱 어디서든 이 창고를 열어
       "지금 장바구니 뭐 있지?"(읽기) / "이거 담아!"(쓰기) 를 함
   · persist로 localStorage에 자동 백업 → 새로고침해도 장바구니 유지
   · 이 파일 = 데이터 + 도구를 같이 두는 곳 (데이터가 머무는 집)


   ═════════════════════════════════════════════
   ★★★ 만드는 순서 — 왜 cartStore부터인가
   ═════════════════════════════════════════════
   만드는 순서 :  cartStore(로직) → useCart(전달) → page(화면)
   의존 방향   :  page ────────→ useCart ────────→ cartStore
                 (page가 useCart를 필요로 하고, useCart가 cartStore를 필요로 함)

   ★ 판단 규칙 — 모든 기능에 그대로 적용
       "A가 B를 필요로 하나?"  →  B를 먼저 만든다
     · page는 addItem이 있어야 쓸 수 있음 → addItem이 사는 cartStore부터
     · 즉 "불릴 것"을 먼저 만든다 = 의존성 화살표를 거꾸로 타고 올라간다

   ★ 파일 하나 안에서도 같은 순서
     1️⃣ 뭘 넣을지 (모양)  → 타입 CartItem       "담을 물건의 설계도"
     2️⃣ 담을 곳 (빈 공간) → 상태 items: []      "물건이 들어갈 상자"
     3️⃣ 담을 로직 (방법)  → 함수 addItem 등     "담는 도구"
     · 코드 짜기 전에 데이터 모양(설계)부터
     · addItem까지 만들면 화면이 없어도 "저장 기능" 자체는 이미 완성

   ★ 한 층 쌓을 때마다 확인 (바닥부터 쌓으면 어디서 틀렸는지 바로 보임)
     1층 cartStore 만들고 → 콘솔에서 addItem 테스트
     2층 useCart 얹고    → 잘 전달되나 확인
     3층 page 얹고       → 버튼 눌러 확인
     → 담을 곳 → 로직 → 화면


   ═════════════════════════════════════════════
   ★★★ 상태에 넣을 것 vs 계산할 것 — 원본은 한 곳
   ═════════════════════════════════════════════
   ★ 값(상태)에 넣는 것 = "기억해야 하는 원본 사실"만
     원본은 한 곳(상태)에만 두고, 나머지는 전부 거기서 계산해서 뽑는다

   ★ 판정 질문 2개
     ① 이게 사라지면 화면을 못 그리나?   → YES면 상태 후보 (기억해야 함)
     ② 다른 값으로 계산해낼 수 있나?     → YES면 상태 아님 (함수로 뽑기)
     ※ ②가 이기면 상태에서 뺀다. "기억 필요? / 계산 가능?" 두 개로 판정

   ★ 이 파일에 적용하면
     🟢 items    → 데이터 원본. 기억해야 함 (사라지면 장바구니가 없어짐)
     🟢 isOpen   → UI 원본. 계산으로 알 수 없음 (사용자가 연 건지 아닌지)
     🔵 totalKrw / totalUsd / totalCount
                 → 상태 아님! items만 있으면 언제든 계산 가능 → 함수(get)
     🔴 addItem / removeItem / updateQuantity …
                 → 원본을 고치는 함수 (set)

   ★ 색으로 나눠 보면
     🟢 상태(원본)  : 기억  — items, isOpen
     🔴 바꾸기      : 원본을 고치는 함수 — set 사용
     🔵 계산(파생)  : 원본을 읽어 뽑는 함수 — get 사용

   · 합계를 상태로 저장하면? → items 바꿀 때마다 합계도 같이 고쳐야 함
     → 하나라도 빼먹으면 어긋남. 그래서 계산으로 두는 게 안전


   ═════════════════════════════════════════════
   ★★★ 어디에 담을 것인가 — 클라이언트 vs 서버
   ═════════════════════════════════════════════
   ⭐️ 읽고 지워져도 되는 임시 UI 상태 → 클라이언트(zustand)
        예) 장바구니, 모달 열림, 패널 토글
   ⭐️ 영구 기록 · 돈 · 보안이 필요한 것 → 서버(DB)
        예) 주문, 결제, 회원

   · 그래서 이 파일(장바구니)은 zustand, 결제는 서버(DB)에 담는다
   · 돈은 브라우저를 못 믿는다 → 서버에 저장하고 서버에서 검증


   ═════════════════════════════════════════════
   ★★★ 제일 헷갈리는 것부터 — 만들기 vs 바꾸기 (타임라인)
   ═════════════════════════════════════════════
   ★ 창고는 persist 혼자 만드는 게 아니다!
     create()(persist(…)) "전체"가 창고를 만든다
     persist는 그 창고에 localStorage 백업 기능을 씌우는 담당(미들웨어)일 뿐

   만들기(create·persist) → 창고 생김 → 바꾸기(set) → 읽기(get)
      🏗️ 1번                 📦          ✍️ 매번       👀 매번

     1단계  create<CartStore>()      → 함수 B를 뱉음        ┐ 앱 켤 때
     2단계  B( persist(…) )          → 창고 완성            ┘ 딱 1번
     ──────────── 이제 창고가 존재함 (items: [] 텅 빈 상태) ────────────
     그 뒤   사용자가 "담기" 클릭 → addItem(사과) → set 실행 → 내용이 바뀜  (매번)
             합계 표시할 때 → get() → 지금 값 읽음                        (매번)

   · create + persist = "텅 빈 창고 + 백업선을 짓는 것"  → items: []
   · addItem(객체)    = "그 창고에 물건을 넣는 것"       → items: [{…}]
   · ★ 창고 짓기와 물건 넣기는 완전히 다른 시점의 일

   · ★ 스토어 알맹이(객체 덩어리)는 미리 있는 게 아니다
     콜백이 실행되는 그 순간 태어난다
   · ★ useCartStore에 저장되는 것 = 그 덩어리를 품고 꺼내주는 "스토어 훅"


   ═════════════════════════════════════════════
   ★★★ 누가 무엇을 넣어주나 — 바깥(UI) vs 안쪽(엔진)
   ═════════════════════════════════════════════
   addItem: (item) => set((state) => { … })
                ─┬─       ─┬─   ──┬──
                item      set   state
             내가 넣음   zustand가 챙겨줌

     item          ← 바깥. 호출한 쪽(handleAddToCart 같은 UI 핸들러)이 넣어줌
     set, state    ← 안쪽. zustand 엔진이 주입 (state는 set 리모컨이 채워줌)

   ★ item 데이터의 출생지 → 결국 DB
     DB(상품) → 화면에 뿌려진 product → 담기 버튼 클릭 → addItem(product)
     → 그 상품이 item 자리에 들어감

   ★ 담기 클릭 한 번의 전체 흐름
     ① 사용자가 "담기" 클릭
     ② 그 상품이 item에 들어감          ← 바깥에서 들어온 재료
     ③ set((state) => …) 실행           ← zustand가 준 도구로 창고 바꿈
     ④ items 갱신 → 구독 중인 컴포넌트 리렌더

   · items의 한 칸 = 상품 정보 전체 + quantity  (객체 하나)
       items: [{ id, slug, name, price_krw, price_usd, image, quantity }]


   ═════════════════════════════════════════════
   ★★★ 화살표 함수 읽는 법 — => 는 "받아서 내놔라"
   ═════════════════════════════════════════════
   (set, get)  =>  ({ items: [], addItem: … })
   ────┬────   ─┬─  ──────────┬──────────────
    입구         화살표          출구
   (매개변수)   (함수 표시)   (리턴할 몸통)

   ★ 이 한 줄 전체가 "함수 하나"다 (이름 없는 function)
     이름만 없을 뿐, function 키워드로 쓴 함수와 완전히 같은 것

   ★ => 의 진짜 뜻
     "왼쪽을 받아서 오른쪽을 내놔라"
     = 입구(매개변수)와 출구(리턴)를 잇는 화살표
     ⭐️ 왼쪽 재료를 받아서 오른쪽 결과로 바꾼다 ⭐️

   ★ 이 규칙은 이 파일 어디에나 똑같이 적용된다
       (a, b)     => a + b                    받는 것: a,b   / 내놓는 것: 합
       (set, get) => ({ items: … })           받는 것: 도구  / 내놓는 것: 객체
       (item)     => set(…)                   받는 것: 상품  / 내놓는 것: 없음(동작)
       (state)    => ({ items: … })           받는 것: 현재상태 / 내놓는 것: 새 상태
       (i)        => i.id === item.id         받는 것: 항목  / 내놓는 것: true/false

   ★ 왜 ({ … }) 처럼 소괄호로 감쌌나?
       () => { … }   ← 중괄호만 = "코드 블록"으로 읽힘 (문장 묶음)
       () => ({ … }) ← 소괄호로 감싸야 "객체를 돌려준다"로 읽힘
     화살표 함수에서 객체를 바로 반환할 땐 소괄호 필수


   ═════════════════════════════════════════════
   ★★★ 인자 vs 매개변수 — 층이 다르다
   ═════════════════════════════════════════════
   persist(  (set, get) => ({ … })  ,  { name: … }  )
             ─────────┬─────────      ─────┬─────
              인자1 = 콜백 "함수 전체"      인자2 = 옵션
                  └ (set, get) = 그 콜백이 품고 있는 매개변수

   · 인자(argument)   = persist라는 함수에 넣는 값들 → 여기선 2개 (콜백, 옵션)
   · 매개변수(parameter) = 그 콜백 함수가 자기 입구에 적어둔 이름 → (set, get)
   · ★ (set, get)은 persist의 인자가 아니다. 인자1(콜백 함수)의 "일부"다
     → 인자1이 매개변수를 품고 있는 구조 (한 겹 안쪽)

   · persist는 그냥 "함수", (인자1, 인자2)는 그 함수에 넣는 값들


   ─────────────────────────────────────────────
   0. import 경로 = zustand 폴더 구조
   ─────────────────────────────────────────────
   zustand (도구상자)
     ├ create               ← 메인 방: 핵심 기능 (스토어 만들기)
     └ middleware (부가 칸)  ← 하위 폴더: 부가기능들
          ├ persist         ← 저장 (localStorage)
          └ devtools        ← 디버깅

   · from 'zustand'             → 메인
   · from 'zustand/middleware'  → 부가기능 방
   → persist는 미들웨어(부가기능)라서 메인이 아니라 하위 폴더에 들어 있음
   → 저장 같은 부가기능(장바구니·다크모드·로그인 유지)은 미들웨어 폴더에 따로


   ─────────────────────────────────────────────
   ★ 이름 규칙 — 파일명 vs 훅명
   ─────────────────────────────────────────────
   cartStore.ts                      ← 파일명: "무엇을 담았나(스토어)" 기준
   export const useCartStore = …     ← 훅명: use 붙임 (컴포넌트에서 훅으로 쓰니까)
   → 파일은 "창고 자체", 밖으로 내보내는 건 "그 창고를 쓰는 훅"


   ─────────────────────────────────────────────
   ★★ 전체 모양 = 커링 구조 (함수가 함수를 낳음) — 3층
   ─────────────────────────────────────────────
   create<CartStore>()(  persist(  (set,get)=>({…}) , {name:…}  )  )
   ───────┬────────      ───┬───   ───────┬────────   ────┬───
       겉: create          중간: persist    속: 알갱이      옵션
      (스토어 만들기)      (저장 미들웨어)   (상태+함수)

   ★ 평가 순서는 "안쪽 → 바깥쪽" (재료를 먼저 만들어야 넣을 수 있으니까)
     ① (set,get)=>({…})  알갱이 함수 준비
     ② persist(알갱이, 옵션) 스스로 실행 → 결과 덩어리 완성  ← 재료 완성
     ③ create<CartStore>() 실행(인자 X) → 빈 틀 함수 B 반환
     ④ B(②의 결과) 실행 → 완성된 스토어
     ⑤ useCartStore에 저장

   → B(persist(…)) 에서 persist()가 먼저 실행되어 값을 뱉고, 그 값이 B로 들어감
     (요리 → 먹기 순서. 재료가 완성돼야 넣을 수 있음)
   → create()가 돌려주는 건 "값"이 아니라 "아직 내용물을 안 받은 함수"
     = 버튼만 눌러놓은 상태
   → persist를 실행하는 건 B가 아니라 persist 자신. create와 B는 다른 함수


   ═════════════════════════════════════════════
   ★★★ create<CartStore>()( … ) — 괄호가 2개인 진짜 이유
   ═════════════════════════════════════════════
   ★ 한 문장 요약
     create는 "타입"과 "내용물"을 나눠서 받는다.
       create<CartStore>()  → 1번(타입)만 처리하고, 내용물을 기다리는 B를 내놓음
       B( persist(…) )      → 2번(내용물)을 그 B에 넣어 완성
     → 그래서 persist가 create가 아니라 B의 괄호로 들어간다

   export const useCartStore = create<CartStore>()( persist(…) )
                ─────┬──────   ────────┬──── ─┬─  ─────┬─────
             최종을 담음          create()  타입 때문에  진짜 내용물
          (= 완성된 스토어 훅)             비워둔 칸    (= B가 받음)

   ★ 빈 괄호 () 는 "값을 B에 전달"하는 게 아니다
     첫 호출 create<CartStore>() 이 B를 "리턴"하는 것
     (인자를 넣는 자리가 아니라, 한 번 끊어주는 자리)

   ▸ 실행이 2번 = 함수가 2개  (버튼을 두 번 누르는 셈)
       1) create<CartStore>()  → 첫 번째 버튼 = "기계"가 나옴 (함수 B)
                                  · B = "타입은 정해졌고, 이제 내용물만 주면
                                        완성할게" 하고 기다리는 함수
                                  · 이름 없음, 코드엔 안 보임
                                  · ★ B는 "저장 상자"가 아니라 함수다
       2) B(persist(…))        → 두 번째 버튼 = "스토어"가 나옴
     ★ create 와 B 는 서로 다른 함수! (create가 뱉은 결과가 B)
     ★ 최종 결과 = 완성된 스토어 훅 = useCartStore

   ▸ 왜 굳이 나눠 받나? — TypeScript 규칙 때문
       create는 속으로 타입이 여러 개 필요:  create<상태타입, 미들웨어타입, …>
       TS 규칙: 타입 인자를 하나라도 직접 쓰면 나머지도 다 써야 함 (부분 추론 X)
       → ()로 한 번 끊어 2단계로 우회:
           1단계: 상태타입만 고정하고 함수 반환
           2단계: 나머지 타입은 넘긴 인자(persist)를 보고 추론

   언제 2번, 언제 1번?
     타입 O + 미들웨어 O  →  create<CartStore>()( persist(…) )   ← 지금 이 파일
     타입만 (미들웨어 X)  →  create<CartStore>((set) => ({ … }))


   ═════════════════════════════════════════════
   ★★ persist(콜백, 옵션) — 저장 기능을 장착시키는 미들웨어
   ═════════════════════════════════════════════
   persist(
     (set, get) => ({ … }),          ← 인자1: 콜백함수 = 스토어 알맹이 (상태+함수)
     { name: 'butter-weather-cart' } ← 인자2: 옵션 (localStorage 키 이름)
   )

   ★ persist가 받는 건 "객체"가 아니라 "객체를 만드는 함수"다
       받는 시점        → 아직 함수 (실행 안 됨)
       zustand가 나중에 → (set, get) 자리에 도구를 꽂고 콜백 실행
                        → 그때 객체 덩어리가 튀어나옴 → 이게 창고 알맹이
       persist는       → 그 알맹이를 "바뀔 때마다 localStorage에 백업되게" 감쌈

   ★★ 새로고침하면 무슨 일이 벌어지나 — 살아남는 진짜 장소는 localStorage
       메모리(스토어)  : 새로고침하면 싹 초기화됨 → items: [] 로 리셋
       localStorage   : 그대로 남아 있음          ← 진짜로 살아남는 곳
       → 새로고침 직후 persist가 localStorage를 다시 읽어서 스토어를 복원한다
       → 그래서 화면엔 장바구니가 그대로 있는 것처럼 보임
     · 즉 persist는 저장만 하는 게 아니라 "다시 읽어와 채우는" 일까지 함

   ★ create vs persist — 역할 분담
       create   : 스토어(창고)를 만드는 기본 도구
       persist  : 미들웨어 = 중간에 끼어드는 "중간 처리기". 감싸서 백업/복원만 함
       persist X → 상태가 메모리에만 → 새로고침하면 사라짐
       persist O → persist가 중간에서 가로채 localStorage에도 저장 → 살아남음
     ⭐️ persist가 하는 일은 딱 이것뿐. 창고를 만들진 않는다
     ⭐️ 보내는 곳은 DB가 아니라 localStorage = 내 브라우저 서랍 (내 컴퓨터에만)

   · name = localStorage에 저장될 때 쓰는 "서랍 이름표"
     → 스토어마다 고유한 이름을 줘야 함 (겹치면 서로 덮어씀)
     → 브라우저 개발자도구 > Application > localStorage 에서 이 키로 보임


   ═════════════════════════════════════════════
   ★★ (set, get) => ({ … }) — 리모컨을 쥐여주고 실행시킨다
   ═════════════════════════════════════════════
   (set, get)  =>  ({ items: [], addItem: … })
   ────┬────       ──────────┬──────────────
    입력(입구)              출력(출구)
    zustand가 주입          함수가 돌려주는 객체 = 스토어 내용물

   ★ 리턴하는 객체의 구성 = 값 먼저, 그 다음 도구
       값(상태)      items, isOpen           🟢 기억할 원본
       바꾸는 함수    addItem …  → set 사용   🔴
       읽는 함수      totalKrw … → get 사용   🔵

   ★ zustand가 (set, get)으로 주는 건 "값"이 아니라 "도구 2개(리모컨)"
     상태 값을 넘겨주는 게 아니라, 그 상태를 조종할 수 있는 리모컨을 쥐여주는 것

   ★ zustand 내부에서 벌어지는 순서
     ① 빈 상태 상자를 만듦
     ② 그 상자를 조종하는 리모컨 set·get을 만듦
     ③ 내 레시피 함수를 실행하면서 그 리모컨을 손에 쥐여줌  ← (set, get) 자리
     ④ 함수가 리턴한 객체 덩어리를 상자의 초기 내용물로 채움
     ⑤ persist가 그 상자를 감싸 localStorage 백업까지 붙임
   · 나는 "레시피(정의)"만 써두고, 실행은 프레임워크가 함
   · 객체 덩어리는 ③에서 콜백이 실행되는 순간 태어난다 (미리 존재하지 않음)

   ★ 일반 함수와 같은 구조
       const 더하기 = (a, b) => a + b
         입력(매개변수) = (a, b)  ← 누가 넣어줌
         출력(반환값)   = a + b   ← 함수가 돌려줌
       더하기(3, 5) → 8   (입력이 있어야 출력이 나옴)


   ─────────────────────────────────────────────
   ★ set vs get — 리모컨 버튼 2개 (쓰기 / 읽기)
   ─────────────────────────────────────────────
   🔴 set : 스토어를 새 상태로 바꾸고 리렌더 시킴 (쓰기·바꾸기)
            → set({...}) 또는 set((state) => ({...}))
   🔵 get : 현재 스토어 상태를 돌려줌 (읽기·계산)
            → get().items  (합계 계산처럼 지금 값이 필요할 때)

   · 창고가 다 지어진 뒤, 사용자가 담을 때 실제로 일하는 게 set
   · ★ addItem은 "이미 쥐여받은 set"을 가져다 쓸 뿐
     사용자가 넣는 건 set이 아니라 item (담기 버튼 → addItem의 매개변수로 들어감)
   · set은 "덮어쓰기가 아니라 병합" — 넘긴 키만 바뀌고 나머지는 그대로
     예) set({ isOpen: true }) 해도 items는 안 건드림
   · 이전 값이 필요하면 set((state) => …) 형태로 (state = 지금 상태)


   ─────────────────────────────────────────────
   ★ 매개변수 = "저장"이 아니라 함수가 일하려고 받는 재료
   ─────────────────────────────────────────────
   · 매개변수(item, id, quantity, set, get …)는 어딘가에 보관되는 값이 아님
   · 함수가 일할 때 잠깐 받아 쓰는 재료 → 일 끝나면 사라짐
   · 진짜 "저장"되는 건 창고 안의 상태(items, isOpen)뿐

   ★ 단수 vs 복수로 구분하면 쉬움
       item  (단수) = 매개변수 → 잠깐 받는 재료
       items (복수) = 상태     → 진짜 저장되는 창고
   예) addItem(item) → item을 재료로 써서 창고 items를 새로 만듦
       재료(item)는 쓰고 버려지고, 남는 건 창고(items)뿐


   ─────────────────────────────────────────────
   1. 타입 정의 — 시그니처 읽는 법  (= 만들기 1️⃣ 단계)
   ─────────────────────────────────────────────
   ★ interface 블록은 전부 "양식(설계도)" — 값이 하나도 없다
     "이런 모양이어야 한다"만 적어둔 것. 실제 값은 아래 create 안에서 채움

   ▸ 함수 타입 한 줄 읽는 공식
       addItem      : (item: …)      => void
       ───┬───         ────┬────        ──┬──
        이름          받는 재료(매개변수)  돌려주는 값
                                        (void = 없음. 상태만 바꿈)
     ※ 여기의 => 도 같은 뜻: "왼쪽을 받아서 오른쪽을 내놓는다"
       다만 interface에선 "실제 값"이 아니라 "무슨 타입인지"만 적음

   // CartItem = 상품 1개 모양  → "담을 물건의 설계도"
   //   = 내 브라우저 안(localStorage)에 앉아있는 데이터의 틀
   interface CartItem {
     id: string            // 상품 id
     slug: string          // 주소용
     name: string          // 이름
     price_krw: number     // 한화 (숫자)
     price_usd: number | null  // 달러 (없을 수도 있어서 | null)
     image: string         // 대표 이미지
     quantity: number      // 수량 ← 장바구니라서 추가된 칸 (상품 원본엔 없음)
                           //   = 서버가 아니라 "내 브라우저가 주인" → zustand 담당
   }

   // 창고 전체 모양 (+기능)
   interface CartStore {

     ── 🟢 상태(원본) ─────────────────────  (= 만들기 2️⃣ 담을 곳)
     items: CartItem[]   // 담긴 상품들의 배열 = 장바구니의 핵심 데이터
                         //   비어있으면 [] , 담기면 [사과, 배]
                         //   한 칸 = 상품 정보 전체 + quantity
     isOpen: boolean     // 장바구니 창 열렸는지

     ── 🔴 동작(바꾸기) ───────────────────  (= 만들기 3️⃣ 담는 도구)
     addItem: (item: Omit<CartItem, 'quantity'>) => void
       👉 quantity 뺀 상품 정보를 item으로 받고 반환 없음
       ★ Omit<CartItem, 'quantity'> = CartItem에서 quantity만 뺀 타입
         (담을 때 수량을 안 넘기니까 — 함수가 알아서 1을 붙임)
       ★ addItem은 CartStore 객체의 "키"다
         입력 = quantity를 Omit한 CartItem(= item) / 출력 = 없음(void)
         대신 그 item을 재료로 써서 창고 items를 바꾼다

     removeItem: (id: string) => void
       👉 id(문자열)를 받아서 아무것도 안 돌려주는 함수

     updateQuantity: (id: string, quantity: number) => void
       👉 id(문자열) + quantity(숫자)를 받고 돌려줄 것 없음(void). 0이면 삭제

     clearCart: () => void
       👉 아무것도 안 받고( () ), 돌려줄 것도 없음

     openCart / closeCart: () => void
       👉 () = 실행만 하면 되는 동작 (isOpen만 토글)

     ── 🔵 계산(파생) ─────────────────────
     totalKrw / totalUsd / totalCount: () => number
       👉 받는 것 없이 "숫자를 돌려줌" (파생값)
       ※ 차이: => void(동작함수, 상태만 바꿈) vs => number(계산함수, 값을 돌려줌)
   }
   → 상태(데이터) + 동작(함수) + 계산(파생)을 한 인터페이스에 다 적음


   ─────────────────────────────────────────────
   2. 🔴 동작들 — 한 줄씩
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
   3. 🔵 계산값(파생) — reduce 3형제
   ─────────────────────────────────────────────
   totalKrw:   () => get().items.reduce((sum, i) => sum + i.price_krw * i.quantity, 0)
   totalUsd:   () => get().items.reduce((sum, i) => sum + (i.price_usd ?? 0) * i.quantity, 0)
   totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0)

   · reduce(콜백, 초기값) = 배열을 "하나의 값"으로 접기
       sum = 지금까지 누적, i = 이번 항목, 0 = 시작값
   · price_usd ?? 0 → 달러가가 없으면(null) 0으로 (계산 깨짐 방지)
   · ★ 상태로 "저장"하지 않고 그때그때 계산 → items만 바뀌면 합계는 자동으로 맞음
     (= "계산 가능하면 상태 아님" 규칙의 실제 적용)


   ─────────────────────────────────────────────
   4. 쓰는 쪽에서는 (컴포넌트)
   ─────────────────────────────────────────────
   const items    = useCartStore((s) => s.items)      // 필요한 것만 골라 구독
   const addItem  = useCartStore((s) => s.addItem)
   const total    = useCartStore((s) => s.totalKrw())

   // 담기 버튼 = 여기서 item을 넣어주는 쪽 (바깥)
   <button onClick={() => addItem(product)}>담기</button>

   · ★ 통째로 쓰지 말고 (s) => s.items 처럼 "필요한 조각만" 고르는 게 좋음
     → 그 조각이 바뀔 때만 리렌더 (통째 구독은 아무거나 바뀌어도 리렌더)


   ─────────────────────────────────────────────
   ★★ 이건 "클라이언트 상태" — React Query(서버 상태)와 다른 축
   ─────────────────────────────────────────────
   React Query (useProducts·usePurchase)   Zustand (여기)
     서버가 주인인 데이터                    브라우저가 주인인 데이터
     상품·주문 (DB에 있음)                   장바구니·패널 열림 (내 화면 상태)
     캐시·staleTime·isLoading 관리          그냥 내가 넣고 빼면 끝
     네트워크 O                              네트워크 X
   → "서버에서 가져오는 것"은 RQ, "내 브라우저에서만 사는 것"은 Zustand
   → 단, 장바구니에 담긴 item의 "출처"는 DB. RQ로 받아온 상품을 담는 것뿐
   → 판단 기준은 위 "★★★ 어디에 담을 것인가" 섹션과 같음
     (임시 UI 상태 = 클라 / 영구·돈·보안 = 서버)


   ─────────────────────────────────────────────
   5. 헷갈릴 때 메모
   ─────────────────────────────────────────────
   · 만드는 순서 = 의존성 반대 방향
       "A가 B를 필요로 하나?" → B 먼저
       cartStore → useCart → page / 타입 → 상태 → 함수
       한 층씩 쌓고 매번 확인 (콘솔 → 전달 → 버튼)

   · 상태 판정: ① 사라지면 화면 못 그리나? → YES면 상태 후보
                ② 다른 값으로 계산되나?     → YES면 상태 아님(함수로)
       원본은 한 곳(items·isOpen), 합계 같은 건 전부 계산
       🟢 상태(기억) / 🔴 바꾸기(set) / 🔵 계산(get)

   · 담을 곳 판단: 임시 UI 상태(장바구니·모달) = zustand
                   영구·돈·보안(주문·결제·회원) = 서버 DB (돈은 브라우저 못 믿음)

   · 창고는 create()(persist(…)) "전체"가 만든다
     persist는 localStorage 백업을 씌우는 미들웨어일 뿐

   · 시점 구분: 만들기(create·persist, 1번) → 창고 생김
                → 바꾸기(set, 매번) → 읽기(get, 매번)
     알맹이 객체는 콜백 실행 순간 태어남 / useCartStore = 그걸 꺼내주는 훅

   · 새로고침: 메모리는 초기화 → persist가 localStorage를 다시 읽어 복원
     진짜 살아남는 장소 = localStorage (메모리 아님)

   · 누가 넣나: item = 바깥(호출한 쪽·담기 핸들러) / set·state = 안쪽(zustand)
     item의 출처는 DB → 화면 → 클릭 → addItem(item)

   · => 는 "왼쪽을 받아서 오른쪽을 내놔라" (입구와 출구를 잇는 화살표)
     (매개변수) => (리턴할 몸통)  — 이 한 줄 전체가 이름 없는 함수 하나

   · 인자 vs 매개변수는 층이 다름
       persist(인자1, 인자2) — 인자1 = 콜백 "함수 전체"
       (set, get) = 그 인자1이 품고 있는 매개변수 (한 겹 안쪽)

   · 커링 3층: 겉(create) → 중간(persist) → 속(알갱이)
     평가는 안쪽부터: persist(...)가 먼저 완성돼야 B에 넣을 수 있음

   · create<T>()( … ) 괄호 2개 = 버튼 두 번 (한 번은 기계 B, 한 번은 스토어)
       create<타입>() → 타입만 처리, 내용물 기다리는 B 리턴 (빈 () 는 전달 X, 끊기)
       B(persist(…))  → 기다리던 내용물을 넣어 완성. create와 B는 다른 함수
       이유 = TS는 타입 인자를 하나 쓰면 나머지도 다 써야 함(부분 추론 X)

   · persist(콜백, 옵션) — persist도 그냥 함수. 인자 2개 받음
       받는 건 "객체"가 아니라 "객체를 만드는 함수"
       zustand가 (set,get) 꽂고 실행 → 객체 = 창고 알맹이
       → persist는 그걸 감싸서 저장(바뀔 때) + 복원(새로고침 후)
       옵션의 name = localStorage 서랍 이름표 (스토어마다 고유하게)

   · zustand 내부 순서: 빈 상자 → 리모컨(set·get) 제작 → 레시피 실행하며 쥐여줌
     → 리턴된 객체를 초기 내용물로 채움 → persist가 감싸 백업

   · () => ({ … }) 소괄호 필수 — 없으면 코드 블록으로 읽힘

   · 매개변수 = 저장 X, 함수가 일하려고 받는 재료 (끝나면 사라짐)
     진짜 저장되는 건 창고 안 상태(items·isOpen)
     item(단수)=재료 / items(복수)=창고

   · interface = 값 없는 "양식(설계도)" / 실제 값은 create 안에서 채움

   · 함수 타입 읽기: 이름 : (받는 재료) => 돌려주는 값
       => void = 상태만 바꿈(동작) / => number = 값을 돌려줌(계산)

   · import 경로 = zustand 폴더 구조
       'zustand' = 메인(create) / 'zustand/middleware' = 부가(persist·devtools)

   · 전역 상태 = 앱 어디서든 같은 창고를 열어 읽고/담음 (props로 안 넘겨도 됨)

   · 이름: 파일 = cartStore.ts(무엇을 담았나) / 훅 = useCartStore(use 붙임)

   · set = 쓰기(새 상태로 바꾸고 리렌더) / get = 읽기(현재 상태 돌려줌)
       set은 병합(넘긴 키만 변경) / 이전 값 필요하면 set((state) => …)
       addItem은 이미 쥐여받은 set을 쓸 뿐, 사용자가 넣는 건 item

   · 불변성: push·직접수정 X → map·filter·스프레드로 "새 배열" 반환

   · Omit<CartItem, 'quantity'> = 그 키만 뺀 타입 (담을 땐 수량 안 받음)

   · 합계는 상태로 저장 X → reduce로 그때그때 계산

   · 구독은 조각으로: useCartStore((s) => s.items)
   ════════════════════════════════════════════════════════════════ */
