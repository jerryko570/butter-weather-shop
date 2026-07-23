# 09. Zustand 워밍업 — 불변 업데이트 (spread / map / filter / reduce)

> 한 줄: **Zustand 장바구니 로직의 90%는 "원본 안 고치고 새 배열/객체 만들기(불변)". 도구 = spread `...` · map · filter · find · reduce.**
> 짝: 다음 슬라이스 Zustand(`useCart`/`cartStore`). 색인 [[README]].

> ⚠️ 진행 중 노트 — 오늘은 **불변 개념 + spread**까지. map/filter/find/reduce는 다음.

---

## 왜 이 워밍업? — 장바구니는 배열/객체 다루기의 연속

`cartStore.ts`의 `addItem`·`removeItem`·`totalKrw`가 전부 spread·map·filter·reduce로 됨.
서버·네트워크 없는 **순수 JS 데이터 조작**이라, 이거 잡으면 Zustand가 술술 풀림.

---

## 1. ⭐ 불변(immutable) = 원본 안 고치고 "새 걸 만든다"

- React·Zustand는 **원본이 그대로면 "안 바뀜"으로 보고 리렌더 안 함.** → 바꿀 땐 **새 배열/객체**를 만들어 넣어야 화면 갱신.
```
❌ 가변: 원본 직접 수정 (push 등)  → React "그대로네?" → 리렌더 X
✅ 불변: 새 배열/객체 만듦         → React "새 거네!" → 리렌더 ⚡
```
- 비유: 원본 서류에 낙서 ❌ → **복사본 떠서 복사본을 고쳐** 제출. 원본은 늘 그대로.

## 2. spread `...` = "펼쳐서 새 상자에 담기"

### 배열
```js
const a = [1, 2, 3]
const b = [...a, 4]     // [1,2,3,4]  (a는 그대로, b는 새 배열)
//         ─┬─ ┬
//      a 펼쳐담고 +4
```
### 객체
```js
const p = { name: '키링', price: 3000 }
const q = { ...p, price: 5000 }   // {name:'키링', price:5000} (p 그대로)
//          ─┬─  ────┬────
//       p 펼쳐담고  price만 덮어씀 (같은 키 뒤에 쓰면 교체)
```
- 핵심: `...`는 **원본 안 건드림.** 펼쳐 담아 **새 걸** 만듦 → 불변의 기본 도구.

## 3. 장바구니 코드에서 보기
```ts
return { items: [...state.items, { ...item, quantity: 1 }] }
//                ─────┬─────    ────────┬────────
//         기존 items 복사 +    item 복사 + quantity 붙인 새 객체
```
- `[...state.items, 새거]` = 기존 장바구니 그대로 + 새 상품 하나 → **새 배열**.
- `{ ...item, quantity: 1 }` = 상품 정보 복사 + quantity 칸 붙임 → **새 객체**.
- 원본 `state.items` 안 건드림 → React "새 배열이네" → 리렌더 → 장바구니 UI 갱신.

---

## ▶ 다음에 여기서 시작 (이 노트 이어서)
- **map** — 각 요소를 변환 (예: 특정 상품 수량 +1). `state.items.map(i => i.id===id ? {...i, quantity:i.quantity+1} : i)`
- **filter** — 조건 맞는 것만 남김 (예: 삭제). `state.items.filter(i => i.id !== id)`
- **find** — 조건 맞는 첫 하나 찾기 (예: 이미 담겼나). `state.items.find(i => i.id === item.id)`
- **reduce** — 다 합쳐 하나로 (예: 합계). `items.reduce((sum, i) => sum + i.price_krw*i.quantity, 0)`
- 그다음 → 이 도구들로 실제 **Zustand 슬라이스**(`create`/`set`/`get`/`persist`) 관통.
