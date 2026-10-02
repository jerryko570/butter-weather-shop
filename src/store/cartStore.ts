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
   ▌ 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   목차
     0. 한눈에 보기
     1. 전체 모양 — import · 커링 3층 · create 괄호 2개 · persist
     2. 타입(설계도)
     3. 문법 기초 — 화살표 · 괄호 3종 · 인자/매개변수 · 방아쇠 · return
     4. 콜백
     5. 클로저 · 누가 채우나
     6. set / get
     7. addItem 완전 해부 — find · if · map · 스프레드 · 불변성
     8. 나머지 동작 · 계산값(reduce)
     9. 값은 언제 채워지나 — 생성 · 갱신 · 복원
    10. 설계 판단 — 만드는 순서 · 상태 vs 계산 · 클라 vs 서버
    11. 쓰는 쪽 (useCart → 컴포넌트)
    12. 헷갈릴 때 최종 요약


   ═════════════════════════════════════════════
   0. 한눈에 보기
   ═════════════════════════════════════════════
   cartStore.ts — 장바구니 전역 상태 (Zustand)
   · 스토어 = 장바구니가 사는 "창고 1개" = 앱 전체가 공유하는 데이터 보관소
   · 전역 상태 = 앱 어디서든 창고를 열어 읽기("뭐 있지?") / 쓰기("담아!")
   · persist로 localStorage에 자동 백업 → 새로고침해도 유지

   ★ 세 단어로 먼저 외우기
       create  창고를 만든다
       set     창고 물건을 바꾼다   🔴 쓰기
       get     창고 물건을 본다     🔵 읽기

   ★★ 창고 vs 내용물 — 두 층으로 나눠 보기
       create + persist   = 창고(스토어)를 만드는 쪽 (바깥 껍데기)
       persist(콜백함수)   = 창고에 들어갈 내용물을 적어둔 쪽 (안쪽 알맹이)

   ★★★ 주방 비유 — 누가 무슨 일을 하나
   ⭐️ 요리사(addItem)가 비교하고 만들고 → set이 접시에 담고
      → persist는 그걸 냉장고에 넣기만 한다

   ┌──────────┬────────────┬──────────────────────────────────────┐
   │ 누구      │ 비유        │ 실제로 하는 일                        │
   ├──────────┼────────────┼──────────────────────────────────────┤
   │ zustand  │ 주방 주인    │ 리모컨(set·get)을 만들어 쥐여줌         │
   │ addItem  │ 요리사       │ 비교하고 새 값을 "계산"해서 내놓음      │
   │ set      │ 접시에 담기  │ 스토어에 써넣음 + 병합 + 리렌더         │
   │ get      │ 들여다보기   │ 현재 값을 읽어옴 (계산용)              │
   │ persist  │ 냉장고       │ localStorage에 저장 / 복원만           │
   │ create   │ 주방 짓기    │ 창고(스토어) 자체를 만듦               │
   └──────────┴────────────┴──────────────────────────────────────┘

   ★★ persist가 하지 "않는" 일 — 제일 헷갈리는 곳
     ✗ 요리 안 함           → 비교·계산은 addItem의 일
     ✗ 재료(item) 안 받음    → item을 받는 건 addItem
     ✗ 리모컨 안 줌          → set·get을 주는 건 zustand
     ○ 저장 / 복원만 한다    → 그게 전부
     · "이미 담긴 상품인가?" 비교도 persist가 아니라 addItem의 일

   ★ 담기 클릭 한 번 — 한 줄로 이어 읽기
       page가 재료를 건넴 → addItem이 요리 → set이 접시에 담음
       → 화면이 다시 그려짐 → persist가 냉장고에 넣음

   ★ 이 파일의 전체 여정 — 설계도에서 화면까지
     1. interface CartStore      🚀 모양(설계도). 값 0개, 컴파일 후 사라짐
     2. (set, get) => ({ … })    🚀 실제 객체 — 그 모양대로 값을 채워 만듦
     3. 값이 채워짐               🟡 세 시점 (9번 섹션)
     4. useCartStore에 저장 → useCart로 꺼냄 → CartDrawer가 화면에 그림


   ═════════════════════════════════════════════
   1. 전체 모양
   ═════════════════════════════════════════════
   ─── import 경로 = zustand 폴더 구조 ───
   zustand (도구상자)
     ├ create               ← 메인 방: 스토어 만들기
     └ middleware (부가 칸)  ← persist(저장) · devtools(디버깅)

   ─── 이름 규칙 ───
   cartStore.ts                   ← 파일명: "무엇을 담았나" 기준
   export const useCartStore = …  ← 훅명: use 붙임

   ─── ★★ 커링 구조 — 3층 ───
   create<CartStore>()(  persist(  (set,get)=>({…}) , {name:…}  )  )
   ───────┬────────      ───┬───   ───────┬────────   ────┬───
       겉: create          중간: persist    속: 콜백 A      옵션
       └──── 창고 만드는 쪽 ────┘          └─── 내용물 ───┘

   ★ 평가 순서는 "안쪽 → 바깥쪽"
     ① 콜백 A 준비 → ② persist(콜백A, 옵션) 실행 → ③ create<T>() → 함수 B
     → ④ B(②결과) 실행 → 완성된 스토어 → ⑤ useCartStore에 저장
   ★ 창고는 persist 혼자 만드는 게 아니다 — create()(persist(…)) "전체"가 만든다

   ─── ★★★ create<CartStore>()( … ) — 괄호가 2개인 이유 ───
     create<CartStore>()  → 타입만 처리하고, 내용물을 기다리는 함수 B를 리턴
     B( persist(…) )      → 내용물을 B에 넣어 스토어 완성
   · 빈 괄호 () 는 값을 전달하는 게 아니라 "한 번 끊어주는 자리"
   · 실행 2번 = 방아쇠 두 번. B는 "저장 상자"가 아니라 함수다
   · 왜? TS는 타입 인자를 하나 쓰면 나머지도 다 써야 함(부분 추론 X)
     → ()로 끊어서 2단계로 우회

     타입 O + 미들웨어 O  →  create<CartStore>()( persist(…) )   ← 이 파일
     타입만 (미들웨어 X)  →  create<CartStore>((set) => ({ … }))

   ─── ★★ persist(콜백, 옵션) — 저장 기능을 장착하는 미들웨어 ───
   persist(
     (set, get) => ({ … }),          ← 인자1: 콜백 A = 기능 (스토어 알맹이)
     { name: 'butter-weather-cart' } ← 인자2: 옵션 = 데이터 (localStorage 키)
   )
   · 인자1을 인자2 설정대로 "함수 자체를 감싸서" 리턴
     (실행한 결과를 감싸는 게 아니라 아직 실행 안 된 함수를 감쌈)
   · 리턴 = 새로 만든 "감싼 스토어". 내가 넣은 인자가 그대로 나오는 게 아님
   · name = localStorage 서랍 이름표 (스토어마다 고유해야 함)
   · ⭐️ 보내는 곳은 DB가 아니라 localStorage = 내 브라우저 서랍

   ★★ 새로고침하면?
       메모리(스토어) : 싹 초기화 → items: [] 로 리셋
       localStorage  : 그대로 남아 있음 ← 진짜로 살아남는 곳
       → 직후 persist가 localStorage를 읽어서 복원


   ═════════════════════════════════════════════
   2. 🚀 타입(설계도)
   ═════════════════════════════════════════════
   ▸ 함수 타입 한 줄 읽는 공식
       addItem   : (item: …)          => void
       ───┬───      ────┬────            ──┬──
        이름       받는 재료(매개변수)     돌려주는 값

   interface CartItem {        // 상품 1개 모양
     id / slug / name : string
     price_krw: number
     price_usd: number | null  // 없을 수도 있어서 | null
     image: string
     quantity: number          // 장바구니라서 추가된 칸
   }

   interface CartStore {
     🟢 items: CartItem[] / isOpen: boolean        상태(기억하는 값)
     🔴 addItem / removeItem / updateQuantity …    동작 → void
     🔵 totalKrw / totalUsd / totalCount           계산 → number
   }

   ★★ Omit<CartItem, 'quantity'> = quantity만 뺀 타입
       page가 넘기는 item   quantity 없음   6칸
            ↓ addItem 안에서 { ...item, quantity: 1 }
       items에 쌓이는 객체   quantity 있음   7칸 (완성형 CartItem)
     · ★ quantity 경계 = addItem. 수량은 page가 아니라 스토어가 붙인다
         처음 담기면 1 / 이미 있으면 기존 값 +1

   ★★ 단수 vs 복수 = 객체 vs 배열 (파일 전체에 통하는 규칙)
       item  상품 1개 객체 { … }           매개변수
       items 그 객체들이 쌓인 배열 [ … ]    상태
       i     배열을 돌 때의 한 칸 객체      콜백 매개변수
     · 복수면 배열, 단수면 그 안의 한 칸 → items ↔ i / items ↔ item


   ═════════════════════════════════════════════
   3. 문법 기초
   ═════════════════════════════════════════════
   ─── ★★★ 화살표 함수 — => 는 "받아서 내놔라" ───
   (set, get)  =>  ({ items: [], addItem: … })
   ────┬────   ─┬─  ──────────┬──────────────
    입구(매개변수) 화살표   출구(리턴할 몸통)

   · 한 줄 전체가 "함수 하나"(이름 없는 function)
       (a, b)     => a + b            받음: a,b      / 내놓음: 합
       (set, get) => ({ items: … })   받음: 도구     / 내놓음: 객체
       (item)     => set(…)           받음: 상품     / 내놓음: 없음(동작)
       (state)    => ({ items: … })   받음: 현재상태  / 내놓음: 새 상태
       (i)        => i.id === item.id 받음: 항목     / 내놓음: true/false

   ★ 키:값 한 줄로 데이터/함수 판별
       value에 화살표 없음 → 데이터   items: [] / isOpen: false
       value에 화살표 있음 → 함수     addItem: (item) => …

   ─── ★★★ 괄호 3종 — "괄호 = 호출"이 항상 맞진 않다 ───
   ① persist( … )     호출 — 함수 이름 "바로 뒤". 안의 것 = 인자
   ② (set, get) =>    매개변수 목록 — 화살표 "왼쪽". 실행과 무관
   ③ => ({ … })       감싸기 — ★ 호출 아님. 앞에 함수 이름이 없다
                      없으면 { } 가 코드블록으로 읽혀버림
                      () => { … }   코드 블록
                      () => ({ … }) 객체를 돌려준다
   ★ 판별: 괄호 앞에 함수 이름이 있나? → 있으면 호출 / 없으면 아님

   ─── ★★★ 인자 vs 매개변수 — 층이 다르다 ───
   persist(  (set, get) => ({ … })  ,  { name: … }  )
             ─────────┬─────────      ─────┬─────
              인자1 = 콜백 함수 전체       인자2 = 옵션
                  └ (set, get) = 그 콜백의 매개변수 (persist의 인자 아님)

   · 인자는 "값"이면 뭐든 된다 — 문자열·객체·배열·함수(★ 함수도 값)
   · 매개변수 = 저장이 아니라 함수가 일하려고 잠깐 받는 재료 → 끝나면 사라짐
     진짜 저장되는 건 창고 안의 상태(items, isOpen)뿐

   ★★ 정의 · 호출 · 실행 — 함수 하나로 상품 100개를 담는다
     🟢 정의   addItem: (item) => …        빈 상자(매개변수)가 있는 틀
     🟢 호출   addItem({ id, slug, … })    값을 넣어 부름 (= 방아쇠)
     🟢 실행   item = { id, slug, … }      상자가 채워지고 items를 바꿈
   · 양식(함수)은 하나, 채우는 내용(item)은 매번 다르다 = 재사용
   · "부를 때 괄호에 넣은 값" → "정의의 매개변수 자리"로 들어간다
       page       addItem({ … })        주입 주체(호출자). 매개변수 없음
       cartStore  addItem: (item) => …  받는 자리(정의의 매개변수)
   · 파일 단위로도 같다: 정의(cartStore) → 전달(useCart) → 호출(page)

   ─── ★★★ 방아쇠는 누가 당기나 — IIFE와 비교 ───
   ⭐️ 함수는 "총", 인자를 넣어 부르는 게 "방아쇠"
   ▸ 즉시 실행(IIFE) — 만들자마자 내가 당김
       ( (set, get) => ({ … }) )( set, get )
   ▸ 이 파일 — 함수만 넘기고 방아쇠는 zustand에 맡김
       persist(  (set, get) => ({ … })  , 옵션 )
   ★ 괄호 위치 하나로 뜻이 갈린다
       ((set,get) => ({…}))(set,get)   ○ 함수를 감싸고 실행
       (set,get) => ({…})()            ✗ "리턴한 객체를 실행" → 에러

   ★ 지금 부르는 것 vs 나중에 불릴 것
       persist(…)             내가 지금 부름. persist의 일은 리턴까지
       (set, get) => ({ … })  zustand가 나중에 부름. 지금은 정의일 뿐
       괄호 붙여 썼으면 → 지금 실행 / 넘기기만 했으면 → 나중에 남이 실행

   ─── ★★★ return은 "부른 자리"로 돌아간다 — 대원칙 ───
   · return한 값은 그 함수를 "부른 사람" 손에 떨어진다
       (i) => i.id === item.id     부른 사람 find    → 참/거짓을 받아감
       (i) => ({ …i })             부른 사람 map     → 새 칸을 받아감
       (state) => ({ items: … })   부른 사람 set     → 새 상태를 받아감
       (set,get) => ({ … })        부른 사람 zustand → 알맹이를 받아감
   · return은 "내보내기"까지 — 써넣는 건 받은 쪽(set)의 일
   · ⚠️ 부른 사람이 없거나 결과를 안 받으면 값은 증발
       const x = 콜백()   ○ x가 받아감
       콜백()             ✗ 아무도 안 받음
   · return을 만나면 즉시 함수 끝 → else 없어도 되는 이유

   ─── 점 표기법 ───
   · 객체면 무엇이든 점으로 꺼낸다: state.items / item.id / product.price_krw
   · 없는 키를 꺼내면 undefined


   ═════════════════════════════════════════════
   4. 콜백 — 넣는 사람과 실행하는 사람이 다르다
   ═════════════════════════════════════════════
   ★★ 한 줄 규칙: 콜백은 내가 넣고, 매개변수는 그 메서드가 채운다

   ★★ 이 파일엔 콜백이 두 개 겹쳐 있다
     ⭐️ 콜백 A  (set, get) => ({ … })  persist에 넘김
                스토어 알맹이를 뱉음 / 앱 켤 때 1번 실행
     ⭐️ 콜백 B  (state) => { … }       set에 넘김
                새 상태를 뱉음 / 담기 누를 때마다 실행
     · 같은 구조 반복: items.find / map / filter / reduce 의 콜백 → 그 메서드가 실행

   ★ 콜백인가 아닌가 — "위치"로 판별
     ① 콜론(:) 뒤        → 그냥 값(정의). 콜백 아님   addItem: (item) => …
     ② 다른 함수 ( ) 안  → 콜백 (남이 실행)          set( (state) => … )
       addItem: (item) => set((state) => { … })
       ───┬───  └───┬──┘     └──────┬──────┘
        콜론 뒤    정의(값)       괄호 안 = 콜백
     · addItem 자체는 콜백이 아니고, 그 안의 (state)=>… 가 콜백

   ★ 콜백은 결과를 안에 쌓지 않고 밖으로 "뱉는다"
     · 계산 = 콜백의 일 / 써넣기 = set의 일
     · (매개변수) => ({ … }) 통째로 콜백 그 자체 = 입구 + 출구

   ★★★ 콜백 A의 일생 — 레시피 → 포장 → 실행 → 결과
     ① 레시피    (set, get) => ({ … })   적어만 둠. 아무 일도 안 일어남
     ② 미리 포장  persist(레시피, 옵션)   내가 지금 실행 → 저장기능으로 감쌈
                 ★ 요리(실행)가 아니라 포장. 이때 name을 품는다(클로저)
     ③ 나중 실행  zustand가 (set, get)을 꽂고 실행 (= 방아쇠)
     ④ 결과 탄생  객체 덩어리 등장 = 스토어 알맹이 (items: [])

   ★ zustand 내부 순서
     ① 빈 상태 상자를 만듦
     ② 그 상자를 조종하는 리모컨 set·get을 만듦
     ③ 콜백 A를 실행하며 리모컨을 쥐여줌 → 객체 덩어리 탄생 ⭐️핵심
     ④ 리턴된 객체를 상자의 초기 내용물로 채움
     ⑤ persist가 상자를 감싸 localStorage 백업을 붙임
   · 리모컨을 쥐여주는 건 ③ 딱 한 번 / 이후 items 갱신은 set이 매번
   · 리턴 객체 구성 = 값(상태) 먼저, 그 다음 도구(set 쓰는 함수 🔴 / get 쓰는 함수 🔵)


   ═════════════════════════════════════════════
   5. 클로저 · 누가 채우나
   ═════════════════════════════════════════════
   ⭐️ 클로저 = 함수가 만들어질 때 "바깥 값"을 기억한 채로 살아 있는 것

   ★★ 기본형
     function 바깥() {
       const 우유 = '우유'
       let   물   = '물'
       return function 안쪽(주스) {   ← 주스 = 안쪽의 매개변수
         console.log(우유)   ✅ 바깥 값을 꺼내 씀 (매개변수 아님!)
         console.log(물)     ✅
       }
     }
   · 안쪽이 쓰는 값은 두 종류
       주스        내 매개변수      → 부르는 사람이 채워줌
       우유 · 물   바깥에서 꺼낸 값  → 아무도 안 채움. 원래 거기 있던 것
   · 바깥() 이 끝나도 안쪽()은 우유·물을 계속 쓸 수 있다 = 클로저

   ─── 이 파일의 클로저 ① — 안쪽 함수들이 바깥 set·get을 꺼내 쓴다 ───
   persist( (set, get) => ({ addItem: (item) => set(…) }) )
             ────┬────         ────┬────        ─┬─
             바깥 매개변수       안쪽 함수     바깥 set을 꺼내 씀
     · addItem·removeItem·totalKrw… 는 전부 (set, get)의 "안쪽"
     · 짝: 우유·물 ↔ set·get(꺼내 쓰는 값) / 주스 ↔ item(채워지는 값)
     · ★ set·get은 addItem의 매개변수가 아니다. addItem의 매개변수는 item뿐

   ─── 이 파일의 클로저 ①-b — item도 콜백 B에겐 "꺼내 쓰는 값" ───
   addItem: (item) => set( (state) => { … item.id … } )
                ─┬─        ──┬──          ─┬─
             addItem의    콜백 B의       바깥에서 꺼내 씀
             매개변수      매개변수
     · ⭐️ item은 set에 "넘기는" 게 아니다. set이 받는 건 콜백 하나뿐
     · 콜백 B 안의 두 값
         state  내 매개변수      → set이 채워줌
         item   바깥에서 꺼낸 값  → addItem이 받아둔 것
     · 콜백을 쓰는 건 나 / 실행하며 state를 꽂는 건 set
       (set이 콜백을 받아뒀다가, 실행하면서 (state) 빈칸에 지금 상태를 채움)

   ─── 이 파일의 클로저 ② — 감싼 스토어가 name을 품고 다닌다 ───
     ① 지금(persist 실행)  콜백을 감싸고 name은 "기억만". 아직 저장 X
     ② 나중(items 바뀜)    품고 있던 name을 꺼내 localStorage에 저장
     ③ 새로고침            그 name으로 localStorage를 뒤져 복원
   · ①과 ②는 같은 원리 — 만들어질 때 주변 값을 품고 살아남는다

   ★★★ 누구의 매개변수인가 / 누가 채우는가
       한 줄 규칙: 부르는 사람 = 채우는 사람
       🟢 item      addItem의 매개변수   → page가 채움
       🟢 state     set 콜백의 매개변수  → zustand(set)가 채움
       🟢 i         find 콜백의 매개변수 → find가 채움
       🟢 set, get  콜백 A의 매개변수    → zustand가 채움
     · 질문 두 개: ① 누구의 매개변수? ② 그 함수를 누가 부르나?
     · "누구의 매개변수도 아님" → 바깥에서 꺼내 쓰는 값 (클로저)
     · 매개변수를 쓰는 건 "꺼내는 것"이 아니라 "받은 걸 쓰는 것"


   ═════════════════════════════════════════════
   6. set / get — 리모컨 버튼 2개
   ═════════════════════════════════════════════
   🔴 set : 새 상태로 바꾸고 리렌더 (쓰기)
   🔵 get : 현재 상태를 돌려줌 (읽기·계산) → get().items
   · 바꾸는 중에 읽어야 하면 → set((state) => …) 의 state
     그냥 읽기만 하면       → get()
   · 둘 다 스토어 "전체"를 주고 .items로 꺼내 쓰는 건 똑같다

   ★★★ set의 두 형태 — 언제 (state)=>를 쓰나
     형태 A  set({ … })             덮어쓰기 — 새 값만 있으면 됨
             clearCart / openCart / closeCart
     형태 B  set((state) => { … })  업데이트 — 옛 값을 봐야 새 값을 정함
             addItem / removeItem / updateQuantity

   ★ state는 스토어 "전체"가 들어온다
     · zustand는 주입만 한다. "이미 담긴 상품인지" 확인은 내가 find로
     · state(root) → .items(값 꺼내기) → .메서드()(동작)

   ★★★ set이 하는 일 — 받아서 반영하고 병합한다
     1️⃣ 반영 — items 칸을 새 배열로 "통째로 갈아끼움" (덧붙이기 X)
               옛 배열은 아무도 안 써서 버려진다
     2️⃣ 병합 — 넘긴 키만 바꾸고 나머지 칸(isOpen 등)은 그대로
     + 리렌더 + persist 저장 트리거
   · 콜백 = 새 값을 "계산" / set = 그 값을 "써넣기"

   ★★ 구독 ≠ state
       state = 콜백 안에서 "지금 값"을 받는 것 (스토어 내부 일)
       구독  = 컴포넌트가 스토어를 계속 지켜보는 것 (바깥 일, useCart)


   ═════════════════════════════════════════════
   7. addItem 완전 해부
   ═════════════════════════════════════════════
   addItem: (item) => set((state) => {                         ← 형태 B
     const existing = state.items.find((i) => i.id === item.id) ← ① 확인
     if (existing) {                                            ← ② 갈림길
       return { items: state.items.map((i) =>                   ← ③ 있으면 +1
         i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) }
     }
     return { items: [...state.items, { ...item, quantity: 1 }] } ← ④ 없으면 추가
   })

   ★ item 데이터의 출생지 → DB
     DB(상품) → 화면의 product → 담기 클릭 → addItem(product)

   ─── ① find — 무엇을 받고 무엇을 돌려주나 ───
   const existing = state.items.find((i) => i.id === item.id)
         ────┬───   ─────┬─────  ──┬─  └────────┬────────┘
       결과 담는 변수  현재 배열    메서드     조건식(콜백)
   · 배열을 한 칸씩 i에 넣어 조건식을 묻고, 맞는 "첫 요소"에서 즉시 멈춤
   · 리턴: 찾으면 그 객체 / 못 찾으면 undefined (★ [] 아님!)
   · ⚠️ 이 줄은 "확인"만 — 아무것도 안 바꾼다. 바꾸기는 return을 set이 받아서
   · 왜 객체를 주나? id도 quantity도 꺼내 쓰려면 칸 전체(객체)가 필요
   · find는 범용 도구 — 무엇을 비교할지(i.id === item.id)는 내가 정한다

   ★ 비슷한 셋, 리턴이 다르다
       find    맞는 첫 1개 → 객체 / 없으면 undefined
       filter  맞는 전부   → 배열 / 없으면 []
       map     전부 변환   → 항상 같은 길이의 배열

   ★★ 왜 id로 비교하나 — 겹치지 않는 값이어야 한다
       🟢 id     절대 안 겹침(uuid) → 표준
       🟡 slug   보통 유일하지만 id가 표준
       🔴 name / price  겹칠 수 있음 → 남의 수량이 올라가는 버그
     · 기준: "이 값이 같으면 같은 상품이라고 100% 말할 수 있나?"

   ─── ② if — 리턴하는 건 if가 아니라 콜백 ───
   · if는 어느 return을 탈지 고르는 "갈림길"일 뿐
   · if ( ) 안은 참/거짓 — ⭐️ 객체는 무조건 참(빈 {} 도), undefined는 거짓
     → existing !== undefined 라고 길게 안 써도 된다
   · 어느 쪽이든 리턴 모양은 똑같다 → { items: 새 배열 }

   ─── ③ map + 스프레드 — 뒤에 쓴 키가 이긴다 ───
   ★★ 세 층으로 끊어 읽기
     🟢🟢🟢 3층  items: …                  set에게 줄 결과 ("items 칸을 이걸로")
     🟢🟢   2층  state.items.map((i) => …)  새 배열 — 전부 돌며, 길이 그대로
     🟢     1층  { ...i, quantity: … }      칸 하나 — 복사 후 일부 덮어쓰기
   · 안→밖(칸 하나 → 배열 → 칸에 넣기) / 밖→안(무엇을 돌려줄지부터) 둘 다 OK

   ★ 스프레드 = 복사해서 펼치기
       { ...i, quantity: i.quantity + 1 }
     · i를 통째로 복사 → 같은 키 quantity는 뒤엣것이 덮어씀
     · 옛 값(i.quantity)을 읽어 +1 → 새 복사본에 써넣음. 원본 i는 그대로
     · { ...i, quantity } = { ...i, quantity: quantity } 의 축약

   ★ map은 배열에만 돈다 — 객체엔 map이 없다 (item.map → 에러)
     · map·filter·find·reduce 전부 배열 전용. 점 앞이 배열인지 보라

   ★★ "사과가 왜 안 사라지나" — map이 전부 돌기 때문
       [사과, 바나나] 에 바나나를 하나 더
         사과   → 조건 X → i 그대로 넣음      ← 살아남음
         바나나 → 조건 O → 수량+1 객체 넣음   ← 바뀐 것
       결과 [사과, 바나나(2개)]
     · 안 바뀐 칸도 다시 넣는 게 핵심. 바뀐 것만 넣었다면 사과 증발

   ★★ 같은 조건식을 두 번 쓰는 이유 — 목적이 다르다
       find  "있어? 없어?"   → 확인(판단용). 아무것도 안 바꿈
       map   "그 애만 +1"    → 실제작업(생산용). 스토어에 들어갈 배열을 만듦
     · existing은 "찾은 객체"일 뿐 몇 번째인지 모른다
     · 스토어에 넣을 건 배열 전체 → 전체를 다시 만들 수 있는 건 map뿐

   ─── ④ 없으면 추가 — map은 "추가"를 못한다 ───
     · map은 길이가 절대 안 늘어남 → 새 칸은 스프레드로 [...state.items, 새 객체]
       있을 때  수량만 바꾸기       → map     (길이 그대로)
       없을 때  목록에 새로 붙이기  → 스프레드 (길이 +1)
     · 완전히 다른 작업이라 if로 갈라야 하고, 어느 쪽인지 알려주는 게 find

   ★★ 왜 새로 만드나 = 불변성 (immutability)
     · state.items 원본을 안 건드리기 위해
     · React는 내용이 아니라 "주소(참조)"를 비교한다
         새 배열·객체 → "주소가 바뀌었네?" → 다시 그림
         원본 직접 수정 → 주소 그대로 → 못 알아챔 → 리렌더 X
     · ⚠️ i.quantity++ / items.push(…) 금지
     · map = 새 "배열" / 스프레드 = 새 "객체" → 둘 다 새것


   ═════════════════════════════════════════════
   8. 나머지 동작 · 계산값
   ═════════════════════════════════════════════
   removeItem: (id) => set((state) => ({
     items: state.items.filter((i) => i.id !== id)   // 그 id만 빼고 새 배열
   }))

   updateQuantity: (id, quantity) => set((state) => ({
     items: quantity === 0
       ? state.items.filter((i) => i.id !== id)                   // 0이면 제거
       : state.items.map((i) => (i.id === id ? { ...i, quantity } : i))
   }))
   · map = 갈아끼우기(길이 그대로) / filter = 빼기

   clearCart / openCart / closeCart → 전부 형태 A

   ─── 🔵 계산값 — reduce 3형제 ───
   · reduce(콜백, 초기값) = 배열을 "하나의 값"으로 접기
       sum = 지금까지 누적 / i = 이번 항목 / 0 = 시작값
   · price_usd ?? 0 → 달러가가 null이면 0으로
   · 저장하지 않고 그때그때 계산 → items만 맞으면 합계는 자동으로 맞음


   ═════════════════════════════════════════════
   9. 🟡 값은 언제 채워지나 — 생성 · 갱신 · 복원
   ═════════════════════════════════════════════
   ⭐️ 코드 "정의" vs 창고 "실제값"
       items: []  코드 정의 — "이 모양으로 시작하라"는 지시
       items      실제값    — 지금 창고에 들어 있는 것 (실행 중에만 알 수 있음)

   🟡 ① 태초(코드 초기값) — 생성
        items: [] / isOpen: false — 콜백 A가 실행될 때 태어남
        items: [] 은 "값 없음"이 아니라 "빈 자리" — 빈 배열도 어엿한 값
   🟡 ② 사용자 행동(set) — 갱신
        addItem → set이 items를 최신으로. 실행 중 값이 바뀌는 유일한 경로
        이 순간 persist가 name을 꺼내 localStorage에 저장
   🟡 ③ 새로고침 후 — 복원
        []로 시작했다가 곧바로 localStorage 값으로 덮임

   ★★ 생성 1번 vs 갱신 매번 — 시점이 겹치지 않는다
     만들기(create·persist) → 창고 생김 → 바꾸기(set) → 읽기(get)
        🏗️ 앱 켤 때 1번         📦         ✍️ 매번       👀 매번
     · set은 처음부터 끝까지 전부 "갱신"만 한다. 생성은 그 전에 끝남
     · 처음 "담기" 때도 창고는 이미 있다 ([] → [상품] 은 내용이 바뀐 것)
     · useCartStore에 저장되는 것 = 그 덩어리를 꺼내주는 "스토어 훅"

   ★★ [] 로 시작하는 게 중요한 이유
     · 비어도 배열이라 find·map·filter·reduce가 안전하게 돈다 (0바퀴)
     · 초기값이 없었다면 undefined.find(…) 로 터짐


   ═════════════════════════════════════════════
   10. 설계 판단
   ═════════════════════════════════════════════
   ─── 만드는 순서 — 왜 cartStore부터인가 ───
   만드는 순서 :  cartStore(로직) → useCart(전달) → page·CartDrawer(화면)
   의존 방향   :  화면 ──────────→ useCart ──────→ cartStore
   · "A가 B를 필요로 하나?" → B를 먼저 (불릴 것을 먼저 만든다)
   · 파일 안에서도: ① 타입 CartItem(모양) → ② 상태 items: [](담을 곳)
                    → ③ 함수 addItem 등(담는 로직)
   · 층마다 확인: cartStore 콘솔 테스트 → useCart 전달 확인 → 화면 클릭

   ─── 상태에 넣을 것 vs 계산할 것 — 원본은 한 곳 ───
   ① 사라지면 화면을 못 그리나? → YES면 상태 후보
   ② 다른 값으로 계산되나?      → YES면 상태 아님 (함수로)
     🟢 items  데이터 원본 / 🟢 isOpen  UI 원본
     🔵 totalKrw·totalUsd·totalCount → items로 계산 → get 함수
     🔴 addItem·removeItem·updateQuantity → 원본을 고치는 함수 → set
   · 합계를 상태로 두면 items 바꿀 때마다 같이 고쳐야 하고, 빼먹으면 어긋남

   ─── 어디에 담나 — 클라이언트 vs 서버 ───
   ⭐️ 임시 UI 상태(장바구니·모달·토글) → 클라이언트(zustand)
   ⭐️ 영구 기록·돈·보안(주문·결제·회원) → 서버(DB). 돈은 브라우저를 못 믿는다

   ─── Zustand(클라 상태) vs React Query(서버 상태) ───
     React Query (useProducts·usePurchase)   Zustand (여기)
       서버가 주인인 데이터                   브라우저가 주인인 데이터
       캐시·staleTime·isLoading 관리         넣고 빼면 끝
       네트워크 O                             네트워크 X
   · 단, 담긴 item의 출처는 DB — RQ로 받아온 상품을 담는 것뿐


   ═════════════════════════════════════════════
   11. 쓰는 쪽 (useCart → 컴포넌트)
   ═════════════════════════════════════════════
   const items   = useCartStore((s) => s.items)     // 필요한 조각만 구독
   const addItem = useCartStore((s) => s.addItem)
   · 통째로 쓰지 말고 필요한 조각만 → 그 조각이 바뀔 때만 리렌더
   · (s)도 스토어 전체 → .items로 꺼냄 (state·get()과 같은 패턴)
   · 이게 "구독" — 컴포넌트가 스토어를 지켜보는 것


   ═════════════════════════════════════════════
   12. 헷갈릴 때 최종 요약
   ═════════════════════════════════════════════
   · create 창고 만들기 / set 바꾸기(🔴) / get 보기(🔵)
   · 주방: zustand 리모컨 줌 / addItem 요리 / set 접시 / persist 냉장고(저장·복원만)
   · create<T>()(…) 괄호 2개 = 방아쇠 두 번 (TS 부분 추론 X)
   · persist는 "함수 자체를 감싼다". 감싼 스토어가 name을 품고 다닌다
   · 콜백 A(persist에, 앱 켤 때 1번) / 콜백 B(set에, 담을 때마다)
   · 콜백 판별: 콜론 뒤 = 값 / 다른 함수 ( ) 안 = 콜백
   · 부르는 사람 = 채우는 사람: item→page / state→set / i→find / set·get→zustand
   · 클로저: set·get은 addItem의 매개변수가 아니라 바깥에서 꺼내 쓰는 값
             item은 set에 넘기는 게 아니라 콜백 B가 바깥에서 꺼내 쓰는 값
   · return은 부른 자리로 돌아간다. 받는 사람 없으면 증발
   · set 두 형태: 덮어쓰기 set({…}) / 업데이트 set((state)=>{…})
   · set = 새 배열로 갈아끼움 + 넘긴 키만 병합 + 리렌더 + persist 트리거
   · find = 확인(객체 or undefined) / map = 실제작업(같은 길이 새 배열)
   · map은 추가 불가 → 없으면 [...items, 새 객체]
   · if(existing): 객체는 무조건 참, undefined는 거짓
   · 스프레드: 복사해서 펼치기, 뒤에 쓴 키가 이긴다
   · 불변성: push·직접수정 X → React는 "주소"를 본다
   · 비교 기준은 id (name·price는 겹칠 수 있음)
   · quantity는 page가 아니라 addItem이 붙인다 (Omit 경계)
   · 값의 출처: ① 코드 초기값(생성) ② set(갱신) ③ persist 복원
   · 상태 = 기억해야 하는 원본만 / 계산되는 건 함수로
   · 임시 UI = zustand / 영구·돈·보안 = 서버 DB
   ════════════════════════════════════════════════════════════════ */
