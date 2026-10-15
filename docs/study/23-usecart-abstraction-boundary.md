# 23. useCart = 장바구니 "창구"(추상화 경계) — 왜 필요한가 + `()` 방아쇠 + 누가 정의/실행

> 한 줄: **useCart는 store를 "그냥 넘기는 것처럼" 보이지만, ① 계산을 `()`로 미리 실행해 실수를 봉쇄하고 ② 변경을 한 곳에 가두고 ③ 내부를 가리는(추상화) 창구다. 계산 "로직"은 cartStore에 정의돼 있고, useCart는 그걸 `()`로 "실행"만 한다. `useCartStore()`로 store를 한 번 받고(ⓐ), `store.totalKrw()`로 그 안의 함수 하나만 실행(ⓑ) — ⓑ가 ⓐ를 다시 돌리는 게 아니다. cva로 Button 추상화한 것과 같은 원리.**
> 함수문법·구조분해 [[11-function-syntax]] · store 해부 [[09-store-anatomy]] · set/쓰기 [[16-set-closure-write]] · 쓰는 쪽 [[21-closure-dot-method-return]]

---

## 오늘 뜯은 코드

```ts
// useCart.ts
import { useCartStore } from '@/store/cartStore'

export function useCart() {
  const store = useCartStore()        // ⓐ 스토어 전체를 가져옴 (훅 실행)
  return {
    items: store.items,
    isOpen: store.isOpen,
    addItem: store.addItem,           // () 없음 → 함수 그대로
    totalKrw: store.totalKrw(),       // () 있음 → 미리 실행해서 숫자로
    totalUsd: store.totalUsd(),
    totalCount: store.totalCount(),
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    openCart: store.openCart,
    closeCart: store.closeCart,
  }
}
```

---

## 1. ⭐ useCart가 "왜" 필요한가 — 없애면 뭐가 나빠지나

> 솔직히 "그냥 store 넘기는 것 같은데?"가 맞다. 근데 **한 겹**이 세 가지를 막는다.

### ① 계산 실수 봉쇄 (가장 구체적)

```ts
// useCart 없이 직접 쓰면
const totalKrw = useCartStore((s) => s.totalKrw)  // 이건 "함수"
<span>{totalKrw}</span>    // ❌ [object Function] 버그
<span>{totalKrw()}</span>  // 매번 () 기억해야

// useCart 있으면 — 창구가 () 미리 실행
totalKrw: store.totalKrw()  // 숫자
<span>{totalKrw}</span>     // ✅ 42000, 실수 불가능
```

### ② 변경을 한 곳에 가둠 (유지보수)

| | useCart 없음 | useCart 있음 |
| --- | --- | --- |
| store 구조 바꾸거나 zustand→서버DB 교체 시 | 컴포넌트 **전부** 고침 | **useCart.ts 1개**만 |

컴포넌트는 `useCart()`만 보니까, 창고를 뭘로 바꿔도 창구 내부만 수정.

### ③ 추상화 — 컴포넌트가 내부를 몰라도 됨

```ts
const { addItem } = useCart()  // zustand? localStorage? selector? 몰라도 됨
```

### 🎨 디자인 감각과 동일

- `cva`로 Button 추상화 → 쓰는 쪽은 `<Button variant="primary">`만, 내부 Tailwind 몰라도 됨.
- useCart = "장바구니 창구" → 쓰는 쪽은 `useCart()`만, store 내부 몰라도 됨.
- **단일 책임**: store=데이터 보관 / useCart=전달 / 컴포넌트=화면. 내가 디자인에서 하던 추상화를 데이터 흐름에 적용한 것.

> ⚠️ 솔직히 **필수는 아니다.** 솔로 소규모면 `useCartStore` 직접 써도 돌아감. 다만 프로젝트가 커질수록 ①②③이 복리로 돌아오는 **투자.**

---

## 2. ⭐ `()` 있고 없고 = useCart의 핵심 (함수 그대로 vs 미리 실행)

```ts
addItem: store.addItem,       // () 없음 → 함수 "자체"를 넘김 (컴포넌트가 클릭 때 실행)
totalKrw: store.totalKrw(),   // () 있음 → 지금 "실행"해서 결과(숫자)를 넘김
```

| 종류 | 예 | `()` | 넘기는 것 | 언제 실행 |
| --- | --- | --- | --- | --- |
| 동작 | `addItem`·`removeItem`·`openCart` | 없음 | 함수 자체 | 나중에(컴포넌트가 클릭 때) |
| 계산 | `totalKrw`·`totalUsd`·`totalCount` | **있음** | 실행 결과(숫자) | 지금(창구에서) |

- 동작은 "언제 누를지 모름" → 함수째 넘김.
- 계산은 "지금 값이 필요" → 미리 실행해 숫자로.
- 그래서 useCart는 "단순 변수명 정리"가 아니라 **가공하는 창구**.

---

## 3. ⭐ 누가 "정의"하고 누가 "실행"하나 — 계산 로직 vs 방아쇠

```ts
// cartStore.ts — 계산 "로직(레시피)"을 정의
totalKrw: () => get().items.reduce((sum, i) => sum + i.price_krw * i.quantity, 0)

// useCart.ts — 그 계산을 () 로 "실행(방아쇠)"
totalKrw: store.totalKrw()
```

- **cartStore = 계산 방법을 적어둠(레시피)** / **useCart = `()`로 그 계산을 실행(요리).**
- 계산이 실제로 "일어나는" 순간 = useCart가 `()`를 붙인 때.

---

## 4. ⭐ `useCartStore()`(ⓐ) vs `store.totalKrw()`(ⓑ) — 실행이 두 개, 다른 것

```ts
const store = useCartStore()   // ⓐ 스토어 "전체"를 가져옴 (훅 실행)
...
totalKrw: store.totalKrw()     // ⓑ 가져온 store 안의 totalKrw "함수 하나"만 실행
```

- **ⓐ `useCartStore()`** = 스토어 통째로 받기(items·함수들 다 든 `store`). **여기서 이미 돌았다.**
- **ⓑ `store.totalKrw()`** = 그 `store` 안의 totalKrw만 콕 집어 실행 → 숫자.
- ⚠️ **ⓑ가 useCartStore를 "다시 돌리는" 게 아니다.** ⓐ가 이미 준 store에서 함수 하나만 실행.
- 🧊 비유: ⓐ=냉장고 통째로 받음 / ⓑ=그 냉장고에서 우유 한 팩만 꺼냄. 우유 꺼낸다고 냉장고를 다시 만드는 게 아님.

---

## 5. ⭐ 제공(훅·store) vs 소비(UI 컴포넌트) — 레이어 나누는 기준

전체 아키텍처는 **"제공하는 쪽"과 "소비하는 쪽"**으로 갈린다.

| 레이어 | 누가 | 역할 | 네트워크 |
| --- | --- | --- | --- |
| **제공(제공자)** | `useProduct` · `cartStore` · `useCart` | 데이터·함수를 **만들어 제공** (훅·store) | useProduct만 O |
| **소비(소비자)** | `page.tsx` · `CartDrawer.tsx` | 제공받아 **화면에 그림** (UI 컴포넌트) | X |

- **제공자(훅·store)** = "공장" — 화면을 모르고 데이터·기능만 제공.
- **소비자(화면)** = "손님" — `useProduct()`·`useCart()`를 **호출해서** 받아 씀.
- 화살표 방향 `page·CartDrawer → useCart` = **소비 방향**(소비자가 제공자를 부름).

### ⚠️ CartDrawer는 "훅"이 아니라 "화면(소비자)"

```tsx
export function CartDrawer() {          // ← JSX 그리는 UI 컴포넌트
  const { items, removeItem, ... } = useCart()   // ← 훅을 "소비"하는 쪽
  return <aside>...삭제 버튼...</aside>
}
```

- `cartStore`·`useCart` = 훅·store(제공) ↔ `page`·`CartDrawer` = 화면(소비).
- **page.tsx와 CartDrawer.tsx는 같은 식구(둘 다 화면, 둘 다 useCart 소비).**
  - page = 담기(addItem), 서버(product)+클라(cart) 둘 다
  - CartDrawer = 보여주기+빼기(items·removeItem), **클라만**
- CartDrawer도 cartStore를 **직접 안 만지고 useCart를 거친다** (`import { useCart }`). page와 동일 경로.

---

## 6. import 사슬 = 순서/위치 (page → useCart → cartStore)

```ts
// page.tsx
import { useCart } from '@/hooks/useCart'        // page는 useCart만 데려옴 (cartStore 언급 X)
// useCart.ts
import { useCartStore } from '@/store/cartStore'  // useCart가 cartStore를 데려옴
// cartStore.ts
import { create } from 'zustand'                  // cartStore는 위쪽 아무도 모름(원본)
```

- **"누구를 import 하느냐" = "누가 바로 옆이냐".** page는 cartStore를 import 안 하므로 둘은 안 붙는다 → 사이에 useCart가 필수.
- 🍽️ 손님(page) → 종업원(useCart) → 주방(cartStore). 손님은 주방에 직접 못 들어가고 종업원에게만 주문.

---

## 한 줄 정리 모음

1. useCart = 창구. "그냥 넘기는 것 같아도" ① 계산 `()` 미리 실행(실수 봉쇄) ② 변경 한 곳에 가둠 ③ 내부 가림(추상화).
2. `()` 있고 없고가 핵심: 동작은 함수째(없음), 계산은 미리 실행(있음).
3. 계산 **로직**은 cartStore(레시피), **실행(방아쇠)**은 useCart(`()`).
4. `useCartStore()`(ⓐ, store 통째 받기) ≠ `store.totalKrw()`(ⓑ, 함수 하나 실행). ⓑ가 ⓐ를 재실행하는 게 아님.
5. import 사슬이 순서를 정함: page→useCart→cartStore. "import하는 대상"이 바로 옆.
6. 🎨 cva로 Button 추상화한 것과 같은 원리 — 디자인의 추상화·단일책임을 데이터 흐름에 적용.
7. **제공(훅·store: useProduct·cartStore·useCart) vs 소비(화면: page·CartDrawer)** — CartDrawer는 훅이 아니라 화면(소비자), page와 같은 식구. 둘 다 useCart를 거쳐 씀.
