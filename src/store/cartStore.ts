/**
 * ✅ page = 주입 주체 (인자 {}를 넣는 호출자)
 * ✅ item = 받는 자리 (정의의 매개변수)
 * ✅ 규칙 = 같은 함수를 부르는 거라, 어디서 부르든 인자는 그 함수 정의의 매개변수로 간다
 * ✅ 인자로 넣으면 함수가 매개변수로 받아 처리 (재사용) - 받기 (매개변수)
 * 👉🏻 인자가 있어야 같은 함수를 다른 입력으로 사용 가능
 * 👉🏻 함수를 빈칸(매개변수) 있는 틀로 만들고 인자로 매번 다른 값을 채워 재사용
 * ✅ persist는 콜백(기능)과 옵션(데이터)을 인자로 받아서 자징 기능을 씌운 스토어를 만든다.
 */

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
      isOpen: false, // 값에 => 없음 -> 값(데이터)
      addItem: (item) =>
        // set으로 state 매개변수에 zustand가 현재 스토어 전체 상태를 주입
        // 🟢 addItem 이름표에 함수가 담겨 있음
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
   ▌ 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   cartStore.ts — 장바구니 전역 상태 (Zustand)
   · 스토어 = 장바구니가 사는 "창고 1개" = 앱 전체가 공유해서 보는 데이터 보관소
   · ★ 전역 상태 = 앱 어디서든 이 창고를 열어
       "지금 장바구니 뭐 있지?"(읽기) / "이거 담아!"(쓰기) 를 함
   · persist로 localStorage에 자동 백업 → 새로고침해도 장바구니 유지
   · 이 파일 = 데이터 + 도구를 같이 두는 곳 (데이터가 머무는 집)


   ═════════════════════════════════════════════
   ★★★ 이 파일의 전체 여정 — 설계도에서 화면까지
   ═════════════════════════════════════════════
   1. interface CartStore          🚀 모양(설계도) — 객체 모양의 원천
   2. (set, get) => ({ … })        🚀 실제 객체 — 콜백이 그 모양대로 만들어냄
   3. 값이 채워짐                   🟡 세 시점 (아래 섹션)
   4. useCartStore에 저장
        → useCart로 꺼냄
        → CartDrawer가 화면에 그림 (꺼내 씀)

   ★ 설계도 🚀 vs 실제 객체 🚀 — 둘은 다른 것
       interface CartStore   "이런 모양이어야 한다"만 적힘. 값 0개
       (set,get)=>({…})      그 모양에 맞춰 진짜 값을 채운 객체를 만들어냄
     → 설계도는 컴파일 끝나면 사라지고, 실행 중에 남는 건 실제 객체뿐


   ═════════════════════════════════════════════
   ★★★ 함수 하나로 상품 100개를 담는다 — 정의·호출·실행
   ═════════════════════════════════════════════
   ★ 핵심 한 줄
     양식(함수)은 하나, 채우는 내용(item)은 매번 다르다
     → 상품이 100개여도 addItem 함수 하나로 전부 담을 수 있음

   ★ (item)은 "빈 상자"다 — 나중에 누가 채워줄 자리
       addItem: (item) => …
                  ─┬─
            지금은 비어 있음. 부르는 쪽이 채워준다 (잠깐 들고 있는 것)

   ★ 3단계로 보면
     🟢 1. 정의   addItem: (item) => …          빈 상자를 만들고 몸통을 씀
     🟢 2. 호출   addItem({ id, slug, … })      값을 넣어 부름
     🟢 3. 실행   item = { id, slug, … }        상자가 채워지고, 그걸로 items를 바꿈

   ★ 모든 함수에 통하는 규칙
       "부를 때 괄호 안에 넣은 값" = "정의할 때 만든 매개변수 자리"로 들어간다
     · item = { id: product.id, slug: product.slug, name: … }  ← 통째로!
       (필드 하나씩 쪼개서 들어가는 게 아니라, 객체 덩어리 그대로)

   ★★ 인자는 "괄호 ( ) 안의 값"이다 — 중괄호가 아니라
       addItem({ id, slug, … })
              └─────┬───────┘
          이 괄호 안에 들어있는 것 전체가 인자 1개
          (마침 그 인자의 모양이 객체 { } 일 뿐)

   ★★ 정의하는 곳과 부르는 곳은 서로 다른 파일이어도 된다
     · 함수 정의도, 호출도 어디서나 가능
     · ★ page에는 매개변수가 없다 — page는 "인자를 넣는 쪽"
       매개변수 (item)은 정의한 곳(cartStore)에만 있다
         page       addItem({ … })        인자를 넣는 쪽
         cartStore  addItem: (item) => …  매개변수를 가진 쪽

   ★ 파일 3단계로도 같은 이야기
     🟡 정의   cartStore   addItem: (item) => { … }   빈 상자 만들고 몸통 씀
     🟡 전달   useCart     만든 걸 넘기기               (새로 안 만듦)
     🟡 호출   page        불러서 실행                  addItem({ … })
     → 정의는 한 곳뿐. 나머지는 그걸 넘기고 부르기만 한다


   ═════════════════════════════════════════════
   ★★★ 콜백 — 넣는 사람과 실행하는 사람이 다르다
   ═════════════════════════════════════════════
   set((state) => { … })
       └──────┬───────┘
          콜백 = 남에게 넘겨주는 함수 (내가 실행하지 않음)

   ★★ 한 줄 규칙
       콜백은 내가 넣고, 매개변수는 그 메서드가 채운다

   ★ 역할을 쪼개 보면
       콜백을 set에 넣는 것      → 개발자(나). set의 인자로 넣음
       그 콜백을 실행하는 것      → zustand (set이)
       실행하면서 state를 채우는 것 → zustand
     · 나는 "이렇게 바꿔줘"라고 적은 함수를 건네줄 뿐
     · 언제 실행할지, 무슨 값을 넣을지는 zustand가 정한다

   ★★ 함수도 "값"이다 → 그래서 인자로 넘길 수 있다
       state.items.find( (i) => i.id === item.id )
                        └────────┬──────────┘
                    익명 화살표 콜백 = find의 인자
     · find의 괄호 안에 있으니 이건 find의 인자다
     · 숫자·문자열처럼 함수도 값이라서 그냥 넘길 수 있음

   ★ find의 매개변수 (i)는 누가 채우나?
       (i)의 출처 = state.items 의 각 항목
       (i)를 주입하는 것 = find
     · find가 배열을 한 칸씩 돌면서 i에 하나씩 넣어 콜백을 실행
     · 나는 "무엇을 찾을지 판단하는 식"만 적어둔 것

   ★ 이 구조는 이 파일 곳곳에 반복된다
       persist( (set,get) => …, 옵션 )   콜백을 persist에 넘김 → zustand가 실행
       set( (state) => … )               콜백을 set에 넘김     → zustand가 실행
       items.find( (i) => … )            콜백을 find에 넘김    → find가 실행
       items.map / filter / reduce       전부 같은 구조

   · { } 는 그 콜백의 코드블록 (실행될 문장들)
   · 한 문장 해설: 내가 set에 익명 콜백함수를 넣으면 → zustand가 그 콜백을
     실행하면서 state 자리에 현재 상태를 주입한다 → 콜백은 새 상태를 리턴한다


   ═════════════════════════════════════════════
   ★★★ state는 "전체"가 들어온다 — 점 표기법으로 꺼낸다
   ═════════════════════════════════════════════
   set((state) => { … state.items … })
        ─┬───          ──┬──
      스토어 전체        그중 items만 꺼냄

   ★ zustand는 items만 주는 게 아니라 스토어 현재 상태 "전체"를 주입한다
     · state 안에는 items, isOpen, addItem … 전부 들어있음
     · 그래서 .items 를 붙여 그중 필요한 것만 꺼내 쓴다
     · zustand가 보관하는 것도 이 "스토어 상태" 전체

   ★ 역할 분담
       set()   = 실행할 내용 (내가 적음)
       state   = 스토어 전체 상태 (zustand가 주입)
     · ★ zustand는 주입만 한다. "이미 담긴 상품인지" 확인은 내가 find로 함
       const existing = state.items.find((i) => i.id === item.id)

   ★★ 주체로 다시 정리
       item   = 사용자가 고른 상품 데이터를 받는 자리   → 주체는 page
       state  = zustand가 보관 중인 현재 전체 상태      → 주체는 zustand

   ★★ 구독 ≠ state — 헷갈리기 쉬운 둘
       state  = 콜백 안에서 "지금 값"을 받는 것 (스토어 내부 일)
       구독   = 컴포넌트가 스토어를 계속 지켜보는 것 (바깥 일, useCart)
     · 구독하면 값이 바뀔 때 그 컴포넌트가 다시 그려진다
     · state는 리렌더와 무관하게, 바꾸는 그 순간 값을 읽는 용도

   ★★ 점 표기법 — 객체면 무엇이든 점으로 꺼낸다
     · 매개변수든 변수든, 그게 객체이기만 하면 `객체.key` 로 접근 가능
         state.items        매개변수(객체) → 그 안의 items
         item.id            매개변수(객체) → 그 안의 id
         product.price_krw  변수(객체)     → 그 안의 price_krw
     · ★ 객체 없이 그냥 키만 쓰면 없는 이름이라 에러이고,
       객체에 없는 키를 꺼내면 undefined가 나온다

   · 마지막에 return 하는 값으로 items가 통째로 교체된다
       return { items: [ … ] }   ← 이게 새 상태가 됨


   ═════════════════════════════════════════════
   ★★★ 🟡 값은 어디서 오나 — 채워지는 3가지 시점
   ═════════════════════════════════════════════
   같은 items라도 "지금 그 값이 어디서 온 건지"가 매번 다르다

   🟡 ① 태초 (코드 초기값)
        items: [] / isOpen: false
        → 콜백에 내가 직접 적어둔 값. 앱을 처음 켰을 때의 모습
        → ★ items: [] 은 "값이 없다"가 아니라 "빈 자리를 만들어 둔 것"
          값 X, 자리 O — 빈 배열도 엄연한 값이고 localStorage에도 저장된다
        → items = 지금 담긴 상품들이 "사는 곳"

   🟡 ② 사용자 행동 (set)
        addItem 호출 → items에 상품이 채워짐
        → 앱이 도는 동안 값이 바뀌는 유일한 경로

   🟡 ③ 새로고침 후 (복원)
        persist가 localStorage에서 읽어와 다시 채움
        → 코드 초기값 []로 시작했다가, 곧바로 저장돼 있던 값으로 덮임

   ★ 순서로 보면
       ① 코드 초기값  →  ② 사용자가 바꿈  →  ③ 새로고침하면 ②의 결과가 복원됨
       (③은 ①을 덮어쓰는 것 — 그래서 새로고침해도 장바구니가 남아 보인다)

   ★★ [] 로 시작하는 게 왜 중요한가 — 빈 배열도 배열이다
     · state.items 는 비어 있어도 [] 이지 0이나 undefined가 아니다
     · 그래서 items가 텅 비어도 find·map·filter·reduce가 안전하게 돈다
       (0바퀴 돌고 끝날 뿐, 에러 없음)
     · 만약 초기값을 안 줬다면 undefined.find(…) 로 터졌을 것


   ═════════════════════════════════════════════
   ★★★ 만드는 순서 — 왜 cartStore부터인가
   ═════════════════════════════════════════════
   만드는 순서 :  cartStore(로직) → useCart(전달) → page·CartDrawer(화면)
   의존 방향   :  화면 ────────→ useCart ────────→ cartStore
                 (화면이 useCart를 필요로 하고, useCart가 cartStore를 필요로 함)

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
     3층 화면 얹고       → 버튼 눌러 확인
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

     item          ← 바깥. 이 함수를 "호출하는 컴포넌트"가 넣어준다
                     (예: page의 handleAddToCart)
     set, state    ← 안쪽. zustand 엔진이 주입 (state는 set 리모컨이 채워줌)

   ★ 매개변수를 볼 때 던질 질문
       "누가 이 함수를 부르는가?"  →  그 부르는 쪽이 이 자리를 채운다
     · addItem을 부르는 건 컴포넌트 → 그래서 item은 컴포넌트가 넣음
     · set을 부르는 건 zustand      → 그래서 state는 zustand가 넣음
     · find를 부르는 건 나지만, i를 넣는 건 find → 그래서 i는 find가 채움

   ★ 부를 때 넣은 { } 객체가 곧 매개변수 자리로 들어간다
       컴포넌트    addItem({ id, slug, name, … })   ← 넣는 값 = 인자
                            └────────┬────────┘
       스토어      addItem: (item) => …             ← 받는 이름 = 매개변수
                             └─┬─┘
     · 즉 item = 호출할 때 적은 그 { } 객체 그 자체 (통째로)
     · 이름만 item으로 바뀌었을 뿐, 같은 물건

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
       메모리(스토어)  : 새로고침하면 싹 초기화됨 → items: [] 로 리셋 (🟡①)
       localStorage   : 그대로 남아 있음          ← 진짜로 살아남는 곳
       → 새로고침 직후 persist가 localStorage를 다시 읽어서 스토어를 복원 (🟡③)
       → 그래서 화면엔 장바구니가 그대로 있는 것처럼 보임
     · 즉 persist는 저장만 하는 게 아니라 "다시 읽어와 채우는" 일까지 함
     · 빈 배열 []도 저장 대상이다 (비었다는 사실 자체가 저장됨)

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
                            🚀 이게 설계도(interface)에 맞춘 "실제 객체"

   ★★ 키:값 한 줄만 보고 데이터인지 함수인지 판별하는 법
       value에 화살표가 없으면  →  그냥 데이터
           items: []           값
           isOpen: false       값
       value에 화살표가 있으면  →  함수 (그 키가 함수가 사는 곳)
           addItem: (item) => …
           totalKrw: () => …
     · 객체 하나 안에 "값"과 "함수"가 섞여 있는 구조
     · 화살표가 보이면 "지금 실행되는 게 아니라, 나중에 부르면 실행될 것"

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


   ═════════════════════════════════════════════
   ★★★ set의 두 가지 형태 — 언제 (state)=>를 쓰나
   ═════════════════════════════════════════════
   · set = 액션 함수 (상태를 실제로 바꾸는 도구)

   ▸ 형태 A : set({ … })              "그냥 이 값으로 바꿔"
       clearCart: () => set({ items: [] })
       openCart:  () => set({ isOpen: true })
       closeCart: () => set({ isOpen: false })
     · 기존 값을 볼 필요가 전혀 없을 때
     · "무조건 비운다 / 무조건 연다" → 지금 뭐가 들었든 상관없음

   ▸ 형태 B : set((state) => { … })   "지금 값을 보고 나서 정할게"
       addItem, removeItem, updateQuantity
     · ★ 기존 items를 읽어야만 다음 값을 정할 수 있어서 = 업데이트이기 때문
         addItem        이미 담긴 상품인지 찾아봐야 함 (있으면 +1, 없으면 추가)
         removeItem     기존 배열에서 그 id만 빼야 함
         updateQuantity 기존 배열에서 그 항목만 갈아끼워야 함
     · state = zustand가 넣어주는 "지금 상태" (전체가 들어옴 → .items로 꺼냄)

   ★ 한 줄 판정
       덮어쓰기(새 값만 있으면 됨)  → set({ … })
       업데이트(옛 값이 있어야 함)  → set((state) => { … })

   · 형태 B 안에서도 리턴은 결국 "새 상태 객체"다 (형태 A와 같은 모양)
   · set은 어느 쪽이든 병합 — 넘긴 키만 바뀌고 나머지는 그대로
     예) set({ isOpen: true }) 해도 items는 안 건드림


   ─────────────────────────────────────────────
   ★ set vs get — 리모컨 버튼 2개 (쓰기 / 읽기)
   ─────────────────────────────────────────────
   🔴 set : 스토어를 새 상태로 바꾸고 리렌더 시킴 (쓰기·바꾸기)
   🔵 get : 현재 스토어 상태를 돌려줌 (읽기·계산)
            → get().items  (합계 계산처럼 지금 값이 필요할 때)

   · 창고가 다 지어진 뒤, 사용자가 담을 때 실제로 일하는 게 set
   · ★ addItem은 "이미 쥐여받은 set"을 가져다 쓸 뿐
     사용자가 넣는 건 set이 아니라 item (담기 버튼 → addItem의 매개변수로 들어감)
   · set 안의 (state) vs get() — 둘 다 "지금 값 읽기"지만 쓰는 자리가 다름
       바꾸는 중에 읽어야 하면 → set((state) => …) 의 state
       그냥 읽기만 하면       → get()
     · 둘 다 스토어 "전체"를 주고, .items로 꺼내 쓰는 것도 똑같음


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
   1. 🚀 타입 정의(설계도) — 시그니처 읽는 법  (= 만들기 1️⃣ 단계)
   ─────────────────────────────────────────────
   ★ interface 블록은 전부 "양식(설계도)" — 값이 하나도 없다
     "이런 모양이어야 한다"만 적어둔 것. 실제 값은 아래 create 안에서 채움
     → 객체 모양의 "원천". 아래 콜백이 이 모양대로 실제 객체를 만든다

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
   addItem: (item) => set((state) => {        ← 형태 B (기존 값을 읽어야 함)
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

   clearCart: () => set({ items: [] })       // 형태 A — 통째로 비우기
   openCart:  () => set({ isOpen: true })    // 형태 A — 패널 열기
   closeCart: () => set({ isOpen: false })   // 형태 A — 패널 닫기


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
   4. 쓰는 쪽에서는 (useCart → 컴포넌트)
   ─────────────────────────────────────────────
   const items    = useCartStore((s) => s.items)      // 필요한 것만 골라 구독
   const addItem  = useCartStore((s) => s.addItem)
   const total    = useCartStore((s) => s.totalKrw())

   // 담기 버튼 = 여기서 item을 넣어주는 쪽 (바깥)
   <button onClick={() => addItem(product)}>담기</button>

   · ★ 통째로 쓰지 말고 (s) => s.items 처럼 "필요한 조각만" 고르는 게 좋음
     → 그 조각이 바뀔 때만 리렌더 (통째 구독은 아무거나 바뀌어도 리렌더)
   · 여기 (s)도 스토어 전체 → .items로 꺼내는 것 (state·get()과 같은 패턴)
   · ★ 이게 "구독" — 컴포넌트가 스토어를 지켜보는 것 (state와는 다른 개념)
   · 최종 소비처: useCartStore → useCart → CartDrawer가 화면에 그림


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
   · 여정: 🚀설계도(interface) → 🚀실제객체(콜백) → 🟡값 채워짐
           → useCartStore → useCart → CartDrawer(화면)

   · 함수 하나로 상품 100개: 양식(함수)은 하나, 내용(item)은 매번 다름
       1.정의 (item) 빈 상자 → 2.호출 addItem({…}) → 3.실행 item = {…}
       파일로는 정의(cartStore) → 전달(useCart) → 호출(page)
       규칙: 부를 때 괄호에 넣은 값 = 정의할 때 만든 매개변수 자리 (통째로)
       인자 = 괄호 ( ) 안의 값 (중괄호가 아님)
       page엔 매개변수가 없다 — page는 인자를 넣는 쪽

   · ★ 콜백은 내가 넣고, 매개변수는 그 메서드가 채운다
       함수도 값이라서 인자로 넘길 수 있음 (find의 괄호 안 = find의 인자)
       find의 (i) 출처는 state.items, i를 주입하는 건 find
       persist·set·find·map·filter·reduce 전부 같은 구조

   · state는 스토어 "전체"가 들어옴 → .items로 꺼내 씀
       zustand는 주입만, 확인(find)은 내가
       주체: item = page / state = zustand
       점 표기법: 객체이기만 하면 객체.key / 없는 키는 undefined

   · 구독 ≠ state
       state = 콜백 안에서 지금 값을 받는 것 (스토어 내부)
       구독  = 컴포넌트가 스토어를 지켜보는 것 (useCart, 바뀌면 리렌더)

   · 빈 배열도 배열 — items가 []여도 find·map·filter가 안전하게 돎
       (0바퀴 돌고 끝. 초기값이 없었다면 undefined.find로 터짐)

   · 키:값 판별 — value에 화살표 없으면 데이터 / 있으면 함수
       items: [] · isOpen: false     = 값
       addItem: (item) => …          = 함수가 사는 곳

   · 🟡 값의 출처 3가지
       ① 태초: 코드 초기값 (items: [] — 값 X, 자리 O)
       ② 사용자 행동: set으로 채워짐
       ③ 새로고침: persist가 localStorage에서 복원 (①을 덮어씀)

   · set 두 형태: 덮어쓰기 → set({…}) / 업데이트(옛 값 필요) → set((state)=>{…})
       addItem·removeItem·updateQuantity는 기존 items를 읽어야 해서 형태 B
       clearCart·openCart·closeCart는 무조건 그 값이라 형태 A
       리턴하는 객체로 items가 통째로 교체됨

   · 만드는 순서 = 의존성 반대 방향
       "A가 B를 필요로 하나?" → B 먼저
       cartStore → useCart → 화면 / 타입 → 상태 → 함수
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

   · 매개변수는 "누가 이 함수를 부르나?"로 판단
       addItem을 부르는 건 컴포넌트 → item은 컴포넌트가 넣음
       set을 부르는 건 zustand      → state는 zustand가 넣음
       부를 때 적은 { } 객체가 그대로 item 자리에 들어감

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

   · 불변성: push·직접수정 X → map·filter·스프레드로 "새 배열" 반환

   · Omit<CartItem, 'quantity'> = 그 키만 뺀 타입 (담을 땐 수량 안 받음)

   · 합계는 상태로 저장 X → reduce로 그때그때 계산

   · 구독은 조각으로: useCartStore((s) => s.items)
   ════════════════════════════════════════════════════════════════ */
