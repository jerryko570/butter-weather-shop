# 연습 01 — 담기 클릭 → cartStore 저장

> **오늘 치는 구간 딱 둘**
> ① `handleAddToCart` (page.tsx) — 담기 버튼 이벤트 핸들러
> ② `cartStore` 저장 구간 — `persist()` → `(set, get)` → `addItem: (item) =>`
>
> 관련 노트: 흐름지도 [[18-full-flow-map]] · find/점표기법 [[15-find-dot-notation]] · 스토어 해부 [[09-store-anatomy]]

---

## 🗺️ 전체 그림 (치기 전에 30초만)

```
[담기 버튼 클릭]
   │
   ▼
① handleAddToCart()      ← page.tsx: 수량만큼 addItem 호출 + 서랍 열기
   │  addItem({ ...상품 })
   ▼
② addItem: (item) =>     ← cartStore.ts: 이미 있으면 +1 / 없으면 새로 추가
   │  set(...)
   ▼
[localStorage 저장 + 화면 리렌더]
```

**한 줄 요약:** page가 상품을 `addItem`에 **넣고**(①), store가 그걸 받아 장바구니에 **쌓는다**(②).

---

## ✍️ 연습법

한 줄 칠 때마다 **입으로 "이건 뭐 하는 거"라고 말하면서** 친다.
말이 막히는 줄 = 아직 이해 안 된 줄. 거기가 다시 볼 곳.

| 단계                         | 무엇을                                  | 볼 것       |
| ---------------------------- | --------------------------------------- | ----------- |
| 1️⃣ 보고 치기                 | 맨 아래 정답 보며 그대로 (말하면서)     | 정답 O      |
| 2️⃣ 백지 복습 ← **제일 중요** | 아무것도 안 보고 기억으로               | 아무것도 X  |
| 3️⃣ 바꿔보기                  | `quantity` 대신 `2`? 담는 칸 하나 빼면? | 예상 → 확인 |

---

## 🎯 목표 ① — `handleAddToCart`

<!-- 아래 빈 코드펜스에 직접 타이핑. 막히면 힌트 뼈대 → 그래도 막히면 맨 아래 정답 -->

```ts
// 여기에 handleAddToCart 를 쳐보세요 ↓
```

<details>
<summary>💡 힌트 뼈대 (백지가 막힐 때만)</summary>

```ts
const handleAddToCart = () => {
  for ( let = i; i < quantity; i++ ) {
    addItem({
      // product 에서 6칸 골라 담기 (점 표기법)
      id: product.id,
      slug: product.slug,
      name: product,name,
      price_krw: product.price_krw,
      price_usd: product.price_usd,
      image: product.images?.[0] ?? ''
    })
  }
  // 다 담았으면 서랍 열기
  openCart()
}
```

</details>

**✅ 자가 체크 — 다 치고 스스로 물어보기**

- [ ] `for`문이 왜 필요하지? → addItem은 한 번에 **몇 개** 담지?
- [ ] `product`는 어디서 온 거지? → DB → useProduct → page
- [ ] `image: product.images?.[0] ?? ''` 에서 `?.` 와 `??` 는 각각 왜?
- [ ] 마지막에 `openCart()` 는 왜 for문 **밖**에 있지?

---

## 🎯 목표 ② — `cartStore` 저장 구간

```ts
// persist( (set, get) => ({ ... addItem: (item) => ... }) ) 구간을 쳐보세요 ↓
```

<details>
<summary>💡 힌트 뼈대 (백지가 막힐 때만)</summary>

```ts
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          // 1. 이미 담겼나? some/find 로 확인 → existing 변수에 담기
          // some = true / false boolean
            const existing = state.items.some((i) =>
            i.id === item.id)

          // 2. 있으면(if existing) → items 를 map 으로 새 배열
            if (existing) {
              return {
                items: state.items.map((i) =>
                i.id === item.id ? {...i , quantity: i.quantity+1}:i)
              }
            }
          // 3. 없으면 → [ ...기존, { ...item, quantity 처음값 } ] 새 배열
          return {
            items: [...state.items, {...item, quantity: 1}]
          }

      // ... 나머지 함수들
    }),
    {
      /* 저장 이름표 (name) */
    }
  )
)
```

</details>

**✅ 자가 체크 — 다 치고 스스로 물어보기**

- [ ] `set` 과 `get` 은 addItem 의 매개변수인가? → 아니라면 어디서 온 값?
- [ ] `existing` 에는 뭐가 담기나? → 찾으면 / 못 찾으면
- [ ] 같은 `i.id === item.id` 를 find 에도 map 에도 쓰는 이유는?
- [ ] 왜 `state.items` 를 직접 안 고치고 `map` / `[...state.items]` 로 새로 만들지?

---

## 🔗 ①과 ②는 어떻게 이어지나

```
page:      addItem({ ...상품 })      →   store:  addItem: (item) => ...
           └ 인자 (값을 넣음)                    └ 매개변수 (item 자리에 담김)
```

**부르는 사람 = 채우는 사람.** page가 넣은 객체가 그대로 store의 `item` 자리로 들어간다.

---

<details>
<summary>📄 정답 (먼저 백지로 해보고 나서 펼치기)</summary>

### ① `handleAddToCart` — src/app/(shop)/products/[slug]/page.tsx

```ts
const handleAddToCart = () => {
  for (let i = 0; i < quantity; i++) {
    addItem({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price_krw: product.price_krw,
      price_usd: product.price_usd,
      image: product.images?.[0] ?? '',
    })
  }
  openCart()
}
```

### ② `cartStore` 저장 구간 — src/store/cartStore.ts

```ts
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.some((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        }),
      // ... 나머지 함수들
    }),
    { name: 'butter-weather-cart' }
  )
)
```

</details>
