# 18. 전체 데이터 흐름 지도 — DB에서 장바구니까지 (손그림 재현)

> 한 줄: **DB(supabase) → useProduct(호출+React Query) → page(구조분해로 product 꺼냄, 리렌더) → 클릭 시 addItem(6칸 골라 새 객체) → cartStore(item으로 받음) → set → find로 existing 확인 → if 분기. 이 전 구간이 한 흐름으로 이어진다.**
> set·클로저 [[16-set-closure-write]] · find/existing [[15-find-dot-notation]] · 코드 읽는 법 [[17-reading-code-dryrun]] · 스토어 해부 [[09-store-anatomy]] · 데이터흐름 추적 [[10-data-flow-trace]]

---

## 전체 지도 (위→아래로 흐름)

```
┌─ DB (supabase) ─────────────────────────────────────────┐
│  products 테이블 (상품마다 고유 uuid) — 17칸             │
└──────────────────────────────────────────────────────────┘
        ↑ 호출                              │ 데이터
        │                                   ▼
┌─ useProduct(slug) ──────────────────────────────────────┐
│  ① supabase 클라이언트 + query 설정                      │
│  ② await 비동기 함수로 요청 → return { data, error }     │
│  ③ React Query가 감싸서 관리 (isLoading → data 리렌더)   │
└──────────────────────────────────────────────────────────┘
        │ { data: product, isLoading, error }
        ▼
┌─ page ──────────────────────────────────────────────────┐
│  ① useParams import                                      │
│  ② useParams 구조분해 → slug 꺼냄                        │
│  ③ useProduct(slug) → 구조분해 { data: product, ... }    │
│  ── 화면에 product 뿌림 (React Query가 리렌더 관리) ──   │
│                                                          │
│  ★ 장바구니 버튼 클릭 시                                 │
│     addItem({ 6칸만 골라 새 객체 })                      │
│     (id·slug·name·price_krw·price_usd·image)            │
│     ※ product 17칸 통째 X → 필요한 6칸만 / quantity는 store가 붙임 │
└──────────────────────────────────────────────────────────┘
        │ 주입 (page = 주입 주체)
        ▼
┌─ cartStore (persist) ───────────────────────────────────┐
│  addItem: (item) => set(...)                             │
│    item = page가 넘긴 6칸 객체                           │
│  items: []  ← 담길 배열 (레이어처럼 객체가 쌓임)         │
└──────────────────────────────────────────────────────────┘
        │
        ▼
┌─ set((state) => {...}) ─────────────────────────────────┐
│  state = zustand가 채운 현재 스토어 전체                 │
│  const existing = state.items.find((i) => i.id===item.id)│
│     i = find가 채우는 "객체 하나" (배열 X)               │
│     existing = 찾은 객체 / 없으면 undefined              │
│  → if (existing) { 수량+1 } / else { 새로 추가 }         │
└──────────────────────────────────────────────────────────┘
```

---

## 구간별 핵심 (한 줄씩)

| 구간 | 하는 일 |
| --- | --- |
| **DB(supabase)** | 상품 원본 저장 (uuid = 상품 주민번호) |
| **useProduct** | supabase 호출 + React Query로 감싸 리렌더 관리 |
| **page** | slug 뽑아 useProduct 호출 → product 꺼내 화면에 뿌림 |
| **클릭 → addItem** | product에서 **6칸만 골라 새 객체** 만들어 주입 |
| **cartStore** | `item`으로 받음, `items: []`에 담김 |
| **set → find** | `state`(전체) 받아 `existing` 확인 → if 분기 |

---

## 이 지도에서 꼭 기억할 5가지

1. **React Query = 리렌더 관리자** — supabase에서 받은 데이터의 isLoading→data 전환을 관리하고 리렌더 트리거. (page가 직접 fetch 안 함)
2. **주입 주체 = page** — `addItem(` 괄호 붙여 부르는 곳(page.tsx:97)이 `item` 채우는 곳. [[15-find-dot-notation]] "부르는 사람=채우는 사람"
3. **6칸만 골라 새 객체** — supabase product 17칸 통째 X. 필요한 6칸만 골라 넘김(quantity는 store가 +1로 붙임). [[09-store-anatomy]] Omit
4. **items = 배열(레이어) / i = 객체 하나** — items는 객체들이 레이어처럼 쌓인 배열, `i`는 그중 한 장(🎨 Figma 레이어 패널).
5. **클릭 때 supabase 재요청 X** — 이미 React Query로 받아둔 product에서 고르는 것.

---

## 데이터가 흐르는 두 방향

```
읽기(내려받기):  DB → useProduct → page → 화면          (요청→응답)
쓰기(담기):      화면 클릭 → addItem → cartStore → set  (주입→갱신)
```

- 읽기 = supabase에서 상품을 **받아와** 화면에 뿌림 (네트워크 O)
- 쓰기 = 그 상품을 **장바구니에 담음** (네트워크 X, localStorage만)

---

## ✅ 한 눈 요약

```
DB(supabase, uuid)
  → useProduct (supabase 호출 + React Query 리렌더 관리)
  → page (useParams→slug→useProduct→구조분해 product, 화면 뿌림)
  → 클릭 → addItem(6칸 골라 새 객체)   ← 주입 주체=page
  → cartStore (item으로 받음, items:[]에 레이어처럼 쌓임)
  → set((state)=>) (zustand가 state 채움)
  → state.items.find (i=객체 하나) → existing
  → if(existing) 수량+1 / else 새로 추가

읽기 = DB→화면(네트워크 O) / 쓰기 = 클릭→store(네트워크 X)
```

---

## ▶ 다음에 여기서 시작

- **if(existing) 분기 마무리 + 불변성** — 있으면 `map`으로 그 칸만 quantity+1(새 배열), 없으면 `[...state.items, {...item, quantity:1}]`로 추가. 왜 `push` 안 하고 **새 배열을 만들어 교체**하나 = React가 참조(주소) 달라져야 "바뀐 걸" 알아챔. (이게 addItem 마지막 조각)
- 이 지도를 [[10-data-flow-trace]]와 나란히 보면 전 구간이 두 번 겹쳐 굳는다.
