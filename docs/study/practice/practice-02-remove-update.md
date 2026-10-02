# 연습 02 — 장바구니에서 빼기 / 수량 바꾸기 (cartStore)

> **오늘 치는 구간 딱 둘** (둘 다 `cartStore.ts` 안)
> ① `removeItem` — 장바구니에서 그 상품 **빼기** (filter)
> ② `updateQuantity` — 수량 **바꾸기** (0이면 빼고, 아니면 그 칸만 교체)
>
> 연습 01(addItem)과 **같은 재료**(`set` · `state` · 불변성)인데 **새 도구 `filter`** 가 등장.
> 관련: 연습 01 [[practice-01-add-to-cart]] · find/점표기법 [[15-find-dot-notation]]

---

## 🗺️ 전체 그림 (치기 전에 30초만)

```
[장바구니 드로어에서 X 버튼]            [수량 +/- 버튼]
   │                                      │
   ▼                                      ▼
① removeItem(id)                       ② updateQuantity(id, quantity)
   │  "이 id 빼고 나머지만 남겨"            │  0이면 → 빼기 / 아니면 → 그 칸 수량 교체
   ▼                                      ▼
   set((state) => ({ items: 새 배열 }))   set((state) => ({ items: 새 배열 }))
```

**한 줄 요약:** 둘 다 `items`에서 **새 배열을 만들어 갈아끼운다.** 빼기=`filter`, 교체=`map`.

---

## ✍️ 연습법 (연습 01과 동일)

한 줄 칠 때마다 **입으로 "이건 뭐 하는 거"라고 말하면서** 친다.
말이 막히는 줄 = 아직 이해 안 된 줄.

| 단계                         | 무엇을                              | 볼 것      |
| ---------------------------- | ----------------------------------- | ---------- |
| 1️⃣ 보고 치기                 | 맨 아래 정답 보며 그대로 (말하면서) | 정답 O     |
| 2️⃣ 백지 복습 ← **제일 중요** | 아무것도 안 보고 기억으로           | 아무것도 X |
| 3️⃣ 바꿔보기                  | `!==` 를 `===` 로 바꾸면 어떻게 될까? | 예상 → 확인 |

---

## 🆕 새 도구 — `filter` (네 번째 배열 메서드)

이미 셋은 알아요. 하나만 더 추가돼요:

| 메서드   | 하는 일                       | 돌려주는 것              |
| -------- | ----------------------------- | ------------------------ |
| `find`   | 조건 맞는 **첫 1개** 찾기      | 객체 / 없으면 `undefined`|
| `some`   | 조건 맞는 게 **있나?**         | `true` / `false`         |
| `map`    | **전부** 변환 (길이 그대로)    | 같은 길이의 새 배열      |
| **`filter`** | 조건 맞는 것만 **남기기**  | **새 배열 (길이 줄 수 있음)** |

- `filter` = **"조건이 참인 칸만 남긴 새 배열"**. 거짓인 칸은 버려요 → 그래서 **빼기**에 씀.
- ⭐️ 빼기인데 조건이 `!==`인 이유: **"뺄 것만 빼고 나머지(≠)를 남긴다"**. 남길 조건을 쓰는 거예요.

```
[사과, 바나나, 키링].filter((i) => i.id !== '바나나')
→ [사과, 키링]      // 바나나(===)는 거짓이라 버려짐, 나머지(!==)는 남음
```

---

## 🎯 목표 ① — `removeItem`

<!-- 아래 빈 코드펜스에 직접 타이핑. 막히면 힌트 뼈대 → 그래도 막히면 맨 아래 정답 -->

```ts
// removeItem 을 쳐보세요 ↓ (id 하나 받아서, 그 id 빼고 나머지만 남기기)

```

<details>
<summary>💡 힌트 뼈대 (백지가 막힐 때만)</summary>

```ts
removeItem: (id) =>
  set((state) => ({
    // items 에서 "이 id 가 아닌 것(!==)"만 남긴 새 배열
  })),
```

> 💭 왜 `set((state) => ({ ... }))` 처럼 **소괄호 `({ })`** 로 감쌀까?
> → addItem은 `if` 때문에 블록 `{ }` + `return` 썼지만, 여기는 **식 하나**라 객체를 바로 돌려줌 → `=> ({ })`.

</details>

**✅ 자가 체크**

- [ ] `filter` 는 무엇을 돌려주나? (map 과 뭐가 다르지?)
- [ ] 빼는 건데 왜 조건이 `!==` 이지? (`===` 로 쓰면 어떻게 될까?)
- [ ] 원본 `state.items` 를 직접 안 지우고 왜 새 배열(filter)로 만들까? → 불변성
- [ ] `set((state) => ({ ... }))` 의 **소괄호**는 왜 필요하지? (`=> { }` 와 차이)

---

## 🎯 목표 ② — `updateQuantity`

```ts
// updateQuantity 를 쳐보세요 ↓ (id 와 quantity 를 받아서)
// quantity 가 0 이면 → 빼기(filter) / 아니면 → 그 칸만 수량 교체(map)

```

<details>
<summary>💡 힌트 뼈대 (백지가 막힐 때만)</summary>

```ts
updateQuantity: (id, quantity) =>
  set((state) => ({
    items:
      // quantity 가 0 이면 ? 그 id 빼기(filter)
      //              아니면 : 그 칸만 { ...i, quantity } 로 교체(map), 나머지는 i
  })),
```

> 💭 `{ ...i, quantity }` = `{ ...i, quantity: quantity }` 의 **축약형**.
> 키와 값(변수) 이름이 같으면 한 번만 써도 돼요. (받은 quantity 를 그대로 넣음)

</details>

**✅ 자가 체크**

- [ ] 이 함수는 매개변수가 **몇 개**지? (addItem·removeItem 과 비교)
- [ ] `quantity === 0` 삼항에서 `?` 쪽과 `:` 쪽은 각각 무슨 일?
- [ ] `{ ...i, quantity }` 는 왜 `{ ...i, quantity: quantity }` 랑 같을까?
- [ ] 빼기는 `filter`, 교체는 `map` — 왜 서로 다른 메서드를 쓸까? (길이가 변하나?)

---

## 🔗 세 함수 한눈에 (연습 01 + 02)

```
addItem        있으면 map(+1) / 없으면 [...기존, 새것]   → 추가·증가
removeItem      filter(!== id)                          → 빼기
updateQuantity  0? filter(빼기) : map(그 칸 교체)         → 수량 조절
```

**공통:** 전부 `set((state) => ...)` 안에서 **새 배열을 만들어 items 를 갈아끼운다** (원본 직접 수정 X = 불변성).

---

<details>
<summary>📄 정답 (먼저 백지로 해보고 나서 펼치기) — src/store/cartStore.ts</summary>

```ts
removeItem: (id) =>
  set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

updateQuantity: (id, quantity) =>
  set((state) => ({
    items:
      quantity === 0
        ? state.items.filter((i) => i.id !== id)
        : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
  })),
```

</details>
