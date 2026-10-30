# 26. updateQuantity — 두 삼항·교체 + 값 흐름(계산→받음→store) + 구독 반응 사슬

> 한 줄: **updateQuantity는 +/-를 모른다. 버튼(CartDrawer)이 `item.quantity ± 1`을 계산해 "최종 숫자"만 넘기고, store는 그 값으로 교체만 한다. 값은 ①계산(부르는 쪽)→②받음(매개변수)→③store 저장으로 흐르고, 중간엔 저장 안 된다. store가 바뀌는 것이 리렌더의 방아쇠 — useCart는 전달자지 방아쇠가 아니다.**
> 불변성·spread [[21-closure-dot-method-return]] · useCart 창구/추상화 [[23-usecart-abstraction-boundary]] · 부르는 사람이 채운다 [[15-find-dot-notation]]

---

## 오늘 뜯은 코드

```ts
updateQuantity: (id, quantity) =>
  set((state) => ({
    items:
      quantity === 0
        ? state.items.filter((i) => i.id !== id)                      // 바깥 삼항: 제거 길
        : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)), // 수정 길(안쪽 삼항)
  }))
```

---

## 1. ⭐ 삼항(`?:`)이 두 개 — 층이 다르다

| | 묻는 것 | 단위 | 갈래 |
| --- | --- | --- | --- |
| 바깥 삼항 | "새 수량이 0이야?" | **배열 전체** | 제거(filter) / 수정(map) |
| 안쪽 삼항 (map 안) | "이 칸이 그놈이야?" | **칸 하나** | 교체 / 그대로(`:i`) |

- 바깥 = 배열 전체를 어느 길로 보낼지. 안쪽 = 각 칸을 바꿀지 둘지.
- 제거 길 `filter((i) => i.id !== id)` = removeItem과 똑같은 패턴.

---

## 2. ⭐ "교체" = 복사해서 만든 새 객체를 그 칸에 갈아끼우기

```ts
{ ...i, quantity }
  └┬┘    └───┬──┘
 기존 복사  수량칸을 받은 값으로 덮어씀 (뒤엣것이 이김)
```

- 교체 = 그 칸의 옛 객체를 치우고, **복사본 새 객체**를 그 자리에 넣음. **원본 수정 아님**(불변성).
- 사과(2)→3: `{...사과, quantity:3}` 새 객체 탄생 → 그 칸에 교체. 원본 사과(2)는 그대로.
- 안 맞는 칸(`:i`)은 손 안 댐. map은 길이 그대로.

---

## 3. ⭐⭐ updateQuantity는 +/-를 모른다 — 버튼이 계산한다

```tsx
// CartDrawer.tsx
onClick={() => updateQuantity(item.id, item.quantity - 1)}  // - 버튼: 현재값-1 계산해 넘김
onClick={() => updateQuantity(item.id, item.quantity + 1)}  // + 버튼: 현재값+1 계산해 넘김
```

- `±1` 계산은 **버튼(컴포넌트)**이 함. updateQuantity는 **결과 숫자**를 받아 **교체만**.
- 또 **"부르는 사람이 계산해서 채운다"** — removeItem에 `item.id` 넘긴 것과 같은 원리.
- 그래서 "0이면 제거"가 말이 됨: 1개에서 `-1` → 0 → filter 길 → 사라짐.

| | 누가 계산? | 수량에 하는 일 |
| --- | --- | --- |
| addItem | **store** (`i.quantity + 1`) | 증가(+1) |
| updateQuantity | **버튼** (CartDrawer) | 교체(받은 값으로 갈아끼움) |

---

## 4. ⭐⭐ 값 흐름 — ①계산 → ②받음 → ③store 저장 (중간 저장 없음)

```
① onClick: item.quantity - 1   → 값 "계산"해서 넘김 (변수에 안 담김, 지나가는 값)
② updateQuantity: (id, quantity) => → 매개변수가 "잠깐 받음" (빈칸, 저장 아님)
③ set → store의 items           → 여기만 "저장" (최종 보관)
         ↳ set=써넣는 손 / store=저장되는 곳 (set은 저장소 아님)
④ persist → localStorage          → 백업
```

- 계산값(`2-1=1`)은 **어디에도 안 저장** — 계산기 화면처럼 잠깐 떴다가 괄호로 흘러들어감.
- 매개변수도 **받는 빈칸**일 뿐 저장소 아님.
- **저장소는 store 하나뿐.** 새로고침해도 남는 건 persist가 뜬 localStorage 사본.

### 세 액션 공통 뼈대

| | ① 계산/넘김 (부르는 쪽) | ② 받음 (매개변수) | ③ 저장 (store) |
| --- | --- | --- | --- |
| addItem | page: 상품 6칸 → `item` | `(item)` | items에 추가 |
| removeItem | CartDrawer: `item.id` | `(id)` | items에서 뺌 |
| updateQuantity | CartDrawer: `item.quantity ± 1` | `(id, quantity)` | items 교체 |

> **"부르는 사람이 계산해서 넘기고 → store가 받아서 저장한다."**

---

## 5. ⭐⭐ 구독 반응 사슬 — store 변경이 "방아쇠"

```
버튼 클릭        → updateQuantity 부름 (시작일 뿐)
store 바뀜       → ★ 진짜 방아쇠! zustand가 구독자에게 "바뀌었다" 알림
useCart          → 알림 받고 다시 실행 → 새 값 전달 (반응, 당긴 게 아님)
CartDrawer 리렌더 → 결과
```

- `useCartStore()` 부르는 순간 = store **구독 신청**. store 바뀌면 떠밀려 다시 실행됨.
- **useCart = 전달자(창구)지 방아쇠가 아니다.** 값을 "내놓는" 것과 변화를 "일으키는" 건 다름.
- `totalKrw: store.totalKrw()`는 **괄호라 매번 재계산** → 수량 바뀌면 총액도 자동으로 맞춰짐. `items: store.items`는 값 가리키기.
- 전체: **store 저장 → 구독한 useCart 자동 재실행 → CartDrawer 자동 리렌더.**

---

## 한 줄 정리 모음

1. 삼항 두 개: 바깥(0이면 제거/아니면 수정, 배열 전체) + 안쪽(그놈이면 교체/아니면 그대로, 칸 하나).
2. 교체 = 복사본 새 객체를 칸에 갈아끼우기(원본 수정 X, 불변성). `{...i, quantity}` = 복사 후 수량 덮어씀.
3. updateQuantity는 ±1 모름 — 버튼이 계산해 최종 숫자만 넘김, store는 교체만. "부르는 사람이 채운다".
4. 값 흐름 ①계산(지나감)→②받음(빈칸)→③store 저장(유일한 저장소). set=써넣는 손, store=저장소.
5. 리렌더 방아쇠 = store 변경. useCart는 전달자(구독해서 반응). totalKrw()는 괄호라 매번 재계산.
