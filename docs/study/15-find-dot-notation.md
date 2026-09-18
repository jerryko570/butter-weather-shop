# 15. find로 existing 찾기 + 점 표기법으로 "매개변수에서 꺼내기"

> 한 줄: **`find`는 배열을 한 칸씩 돌며 조건 맞는 첫 요소를 찾는다. 콜백의 `i`는 find가 하나씩 넣어주는 "각 요소(객체 전체)". 그리고 매개변수든 변수든 "객체이기만 하면" `.점`으로 원하는 칸을 꺼낸다 (item.id, state.items, i.id).**
> addItem 흐름 [[10-data-flow-trace]] · 스토어 해부 [[09-store-anatomy]] · 콜백 채우는 주체 [[11-function-syntax]] ⑥ · 점 표기법 [[09-store-anatomy]].

---

## 오늘 뜯은 코드

```ts
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
  })
```

---

## 1. 실행 흐름 — 누가 매개변수를 채우나

```
addItem: (item) => set((state) => { ... })
          └─┬─┘        └─┬─┘
        매개변수         매개변수
        item             state
        ↑ page가 채움     ↑ zustand가 채움
```

- **item** = page의 `addItem({...})` 가 넣은 객체 → page가 채움
- **state** = 현재 스토어 상태 **전체**(items·isOpen·함수들) → zustand가 주입
- 규칙: **부르는 사람 = 채우는 사람.** (addItem은 page가 부름 / set 콜백은 zustand가 부름)

---

## 2. `find` — 배열을 한 칸씩 돌며 찾기

```ts
state.items.find((i) => i.id === item.id)
```

- `state.items` = 지금 장바구니 배열 (담긴 상품들)
- `.find(콜백)` = 배열을 **한 칸씩 돌며** 조건 맞는 **첫 요소**를 리턴 (없으면 `undefined`)

### `i`는 뭐고 왜 `i`?

- **`i` = 배열의 각 요소(상품 객체 하나)** — find가 하나씩 꺼내 넣어줌
- 이름은 **아무거나 OK** (관례로 짧게 `i` = item). `state`를 zustand가 넣듯, **`i`는 find가 채운다.**

### ⭐ 순서 주의 — "조건 맞는 걸 넣는" 게 아니라 "넣어보고 검사"

```
1바퀴: i = 첫째 요소 → 조건 검사 (아니면 다음)
2바퀴: i = 둘째 요소 → 조건 검사
...  조건이 true인 첫 요소를 만나면 → 그걸 리턴하고 멈춤 (없으면 undefined)
```

→ i에 **하나씩 다 넣어보며** 검사한다. 집어든다(i) → 확인(검사) → 맞으면 챙김(리턴).

---

## 3. `i.id === item.id` — 객체 전체 들어오고, 비교는 id만

```
i        = 객체 전체  { id:'A', slug, name, price_krw, ..., quantity }
i.id     = 그 객체에서 .id만 꺼냄 (점 표기법)  → 'A'
item.id  = 지금 담으려는 데이터의 id
i.id === item.id  = 두 id 매치 → "이미 담긴 상품이야?"
```

- **i에는 객체 전체가 들어오지만, 비교는 `.id`끼리만.** (name·price는 안 봄)
- **왜 id로만?** id는 **안 겹치는 고유 이름표**라서 "같은 상품"인지 확실. (name·price는 겹칠 수 있음 — [[01-db-schema]])

🛒 마트: 집어든 상품(i) 통째로 보지만, **바코드(id)만 대조**해서 같은 상품인지 판단.

---

## 4. ⭐ 오늘의 핵심 깨달음 — 매개변수도 "객체면 `.점`으로 꺼낸다"

```ts
item.id        // 매개변수 item(객체) → 그 안의 id
state.items    // 매개변수 state(객체) → 그 안의 items
i.id           // 매개변수 i(객체) → 그 안의 id
product.price_krw  // 변수 product(객체) → 그 안의 price_krw
```

- **매개변수든 변수든 상관없다.** 그게 **객체이기만 하면** `객체.key`로 원하는 칸을 꺼낸다.
- `item`, `state`, `i` 전부 "객체가 담긴 매개변수" → 그래서 `.id`, `.items`로 꺼냄.
- `.`(점) = **"~의"**. `item.id` = "item의 id" / `state.items` = "state의 items".

> ⚠️ 객체에 없는 key를 꺼내면 `undefined`. 객체 아닌데 `.key` 쓰면 에러.

---

## 5. `existing`에 담기는 것

```
이미 있으면  → existing = 찾은 상품 객체 { id:'A', quantity:2 }  (truthy)
없으면       → existing = undefined                            (falsy)
빈 배열([]) → find 0바퀴 → undefined (에러 X — 그래서 null 대신 [])
```

→ 이 `existing`으로 `if (existing)` 분기가 갈린다: **있으면 quantity+1 / 없으면 새로 추가.**

---

## 6. ⭐ 데이터 가공 4단계 패턴 (매개변수 → 꺼내 → 추려 → 조립)

addItem이 하는 일을 큰 그림으로 보면, 이 4단계다. **여러 함수에 반복되는 패턴.**

```
① 매개변수로 객체 받기      → (state), (item), (i)
② 점표기법으로 값 꺼내기    → state.items, item.id, i.id      ( . = "~의" )
③ 조건으로 추리기          → find, filter, if                (맞는 것만 골라냄)
④ 새 데이터로 조각내 조립   → map, spread {...}               (원본 안 건드리고 새로)
```

### addItem 코드에 매칭

```ts
set((state) => {                                   // ① 매개변수 state 받음
  const existing = state.items.find(              // ② state.items 꺼냄(점)
    (i) => i.id === item.id                        // ③ 조건으로 추리기 (find)
  )
  if (existing) {                                  // ③ 조건 분기 (if)
    return { items: state.items.map((i) =>         // ④ map으로 새 배열
      i.id === item.id
        ? { ...i, quantity: i.quantity + 1 }       // ④ spread로 새 객체 조립
        : i
    )}
  }
  return { items: [...state.items, { ...item, quantity: 1 }] }  // ④ 새 배열/객체
})
```

### ⚠️ "조각낸다"의 정확한 뜻 — 부수는 게 아니라 "새로 조립"

```js
{ ...i, quantity: i.quantity + 1 }
  └┬┘   └──────────┬──────────┘
기존 i 펼치고       quantity만 새 값으로
= 원본 복사 + 한 칸만 바꾼 "새 객체"
```

→ spread `{...}` = 원본은 그대로 두고, **펼쳐서 일부만 바꾼 "새 것"을 만든다.** (원본 안 건드림 = **불변성**, 다음 주제)

🍳 요리: 재료통(state) 받음 → 필요한 재료 꺼냄(.items·.id) → 골라냄(find·filter) → 새 그릇에 새로 담음(map·spread). **원본 통은 그대로, 새 그릇에 새로 조립.**

---

## ✅ 한 눈 요약

```
addItem: (item) => set((state) => {...})
  item = page가 채움 / state = zustand가 채움 (부르는 사람=채우는 사람)

find(콜백) = 배열 한 칸씩 돌며 조건 맞는 첫 요소 찾기 (없으면 undefined)
  i = 각 요소(객체 전체), find가 채움, 이름은 아무거나
  ⭐ 순서: i에 하나씩 넣어보며 검사 → 맞으면 리턴/멈춤 (조건 맞는 것만 넣는 게 아님)

i.id === item.id = 객체 전체(i) 들어오고 .id만 비교 (id=고유 이름표라서)

⭐ 점 표기법: 매개변수든 변수든 "객체면" .key로 꺼냄
   item.id · state.items · i.id · product.price_krw
   . = "~의"

existing = 있으면 그 객체(truthy) / 없으면 undefined(falsy)
  → if(existing)로 분기 (있으면 +1 / 없으면 추가)

⭐ 데이터 가공 4단계 (반복 패턴):
  ① 매개변수 객체 받기 (state·item·i)
  ② 점표기법으로 꺼내기 (state.items·item.id)   . = "~의"
  ③ 조건으로 추리기 (find·filter·if)
  ④ 새 데이터로 조각내 조립 (map·spread {...})   원본 안 건드리고 새로 = 불변성
```

---

## ▶ 다음에 여기서 시작

- `if (existing)` 분기의 **불변성** — 있으면 `map`으로 그 상품만 quantity+1한 **새 배열**, 없으면 `[...state.items, {...item, quantity:1}]`로 **새 배열**에 추가.
- 왜 `push`(직접 수정) 안 하고 `map`/`[...]`로 **새 배열을 만들어 교체**하나? = 불변성. (React가 "바뀐 걸" 알아채려면 참조가 달라져야 함) — 이게 마지막 조각.
