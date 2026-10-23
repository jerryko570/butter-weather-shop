# 20. if는 갈림길이다 + 코드 정의 vs 창고 실제값 + quantity를 따로 관리하는 이유

> 한 줄: **`if`는 함수가 아니라 "갈림길"이다 (괄호 안은 매개변수가 아니라 참/거짓 볼 조건). 코드의 `items: []`는 "태어날 때 초기값"이라 안 바뀌고, 바뀌는 건 "창고 안 실제 값"이며 그걸 바꾸는 건 `set`이다. quantity는 상품이 아니라 "장바구니의 개념"이라 page가 안 보내고 store가 담을 때 붙인다 — 이게 장바구니 모델링 표준.**
> find/점표기법 [[15-find-dot-notation]] · set이 쓴다 [[16-set-closure-write]] · page→store 타이핑 [[19-page-to-store-typing]] · 스토어 해부 [[09-store-anatomy]]

---

## 오늘 뜯은 코드

```ts
export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],        // ← 초기값 (코드 정의)
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {                                  // ← 갈림길
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        }),
    }),
    { name: 'butter-weather-cart' }
  )
)
```

---

## 1. ⭐ `if`는 함수가 아니다 — "갈림길"이다

`if (existing)`의 괄호가 `addItem(item)`의 괄호랑 **모양만 같고 하는 일이 완전 다르다.**

```
addItem(item)     함수 호출 — 괄호 안은 "인자"(넣는 값)  → 함수를 실행
if (existing)     갈림길   — 괄호 안은 "조건"(참/거짓)   → 어느 길 갈지 고름
```

- ❌ 오해: `if(existing)` = 변수를 매개변수에 넣는다
- ✅ 진짜: `if`는 괄호 안 값이 **참이냐 거짓이냐**만 보고 길을 고른다 🛤️

### `if (existing)`이 보는 것

`existing`엔 바로 윗줄 `find` 결과가 담겨 있다:

```
이미 담긴 상품 있음  → existing = { id, name, ... } (객체)  → 참 (true)
없음                → existing = undefined                → 거짓 (false)
```

→ `if (existing)` = **"이미 담긴 상품이 있으면 이 길로"**

### 왜 `.id`까지 안 꺼내고 그냥 `existing`?

JS는 값 자체를 참/거짓으로 본다:

- **객체** → 무조건 참 (내용 뭐든)
- **거짓인 값들**: `undefined`, `null`, `0`, `''`, `false`

→ 객체냐 undefined냐가 그대로 갈리니까 `existing`만 써도 충분.

---

## 2. ⭐⭐ 코드 정의 vs 창고 실제값 — 상태관리의 뿌리

`items: []`이 어떻게 바뀌냐는 질문의 답. **두 개를 나눠서 봐야 한다.**

| | 뭐냐 | 바뀌나? |
|---|---|---|
| **코드** `items: []` | "처음엔 빈 배열로 시작해" 라는 **설명서** | ❌ 영원히 그대로 |
| **창고 안 실제 값** | 지금 진짜로 들어있는 상품들 | ✅ `set`이 바꿈 |

🏦 통장 비유:
- 코드 `items: []` = **"잔액 0원으로 개설"** 신청서 (안 바뀜)
- 창고 실제 값 = 지금 통장 **잔액** (입금하면 바뀜)

> 신청서엔 계속 "0원 개설"이라 적혀 있지만, 실제 잔액은 계속 변한다. 똑같다.

### 코드 줄 `items: []`은 딱 1번만 일한다

```
① 앱 켤 때        코드 items:[] 읽음 → 창고 실제값 = []      (초기값, 1번)
② 사과 담기        set 실행 → 창고 실제값 = [사과]           (갱신)
③ 바나나 담기      set 실행 → 창고 실제값 = [사과, 바나나]    (갱신)
```

→ ① 이후 **코드 줄 `items: []`은 아무 역할 없다.** 그냥 거기 적혀만 있음.

---

## 3. ⭐ 누가 진짜 바꾸나 — if / return / set 역할 분담

`if`도 `return`도 직접 바꾸지 않는다. **바꾸는 건 오직 `set`.**

| 누가 | 하는 일 |
|---|---|
| `if` | 어느 `return`을 탈지 **고르기** (갈림길) |
| `return` | 새 값을 **계산해서 내놓기** (아직 저장 X) |
| **`set`** | 그 값을 받아서 **창고에 진짜로 써넣기** ✅ |

```ts
if (existing) {              // ① 길 고르기
  return { items: 새배열 }   // ② 값 내놓기 (set한테 주는 주문서)
}                            // ③ set이 받아서 창고에 써넣음
```

→ `return { items: 새배열 }`은 set한테 **"이 값으로 바꿔줘"** 주문서를 내미는 것. 실제 갈아끼우기는 `set`이 한다.

### `items:` 는 "어느 칸을 바꿀지 이름표"

```ts
{ items: [], isOpen: false }   // 스토어 모양
//  └ 이 칸

return { items: 새배열 }        // "items 칸만 이걸로 바꿔라"
                               // isOpen은 안 건드림 → 그대로 유지 (병합)
```

---

## 4. ⭐⭐ quantity를 따로 관리하는 이유

### 이유 1 — `item`에 quantity가 없어서 (page가 안 보냄)

page에서 담을 때:

```ts
addItem({
  id, slug, name, price_krw, price_usd, image,   // ← 6칸만! quantity 없음
})
```

그래서 store가 붙여준다:

```ts
{ ...item, quantity: 1 }   // 6칸 복사 + quantity 붙임 → 7칸 완성
```

### 이유 2 — 수량은 "상품"이 아니라 "장바구니"의 개념

| | quantity 있나? | 왜 |
|---|---|---|
| **상품** (product, DB) | ❌ 없음 | 상품 자체엔 "몇 개"가 없음. 키링은 그냥 키링 |
| **장바구니 항목** (cart item) | ✅ 있음 | "이 상품 몇 개 담았나"는 장바구니에서 생기는 개념 |

- 🏷️ 상품 = 진열대 물건 (수량 개념 없음)
- 🛒 장바구니 항목 = "그 키링을 **2개** 담음" ← 수량은 여기서 생김

### 그래서 두 갈래가 다르다

```ts
if (existing)  { ...i,    quantity: i.quantity + 1 }   // 이미 있음 → 기존 +1
else           { ...item, quantity: 1 }                // 처음 → 1 붙임
```

→ 수량 관리는 **전적으로 store의 일.** page는 "몇 번 담았는지"를 for문 횟수로만 표현.

### 타입에도 박혀 있다

```ts
addItem: (item: Omit<CartItem, 'quantity'>) => void
//                  └ "CartItem에서 quantity만 뺀 타입" = "page야, quantity 넣지 마"
```

### 🟢 이건 zustand 규칙이 아니라 "장바구니 모델링 표준"

라이브러리 상관없이 커머스 기본 구조. Shopify·쿠팡·아마존 다 이렇게.

```
상품 (Product)              장바구니 줄 (Cart line item)
id, name, price, image  →  id, name, price, image, quantity ★
(수량 개념 없음)              (그 상품을 몇 개 담았나)
```

- **quantity는 저장(원본), 합계(totalCount)는 계산(파생)** — 우리 코드가 이미 정석대로 함
  ```ts
  totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0)
  ```

---

## 5. `for (let i = 0; ...)` — 왜 let이 필요한가

### 층 ① 왜 뭐라도 붙여야 하나 = "변수 태어남 신고"

```ts
i = 0        // ❌ 신고 없이 씀 → "i가 누구야?" 에러 (엄격 모드)
let i = 0    // ✅ "i를 새로 만들고 0을 넣어" 신고 완료
```

우리 프로젝트(TS + 모듈)는 엄격 모드 → 신고 안 하면 확실히 에러.

### 층 ② let이냐 const냐 = "값이 바뀌느냐"

| 키워드 | 언제 | 다시 대입 |
|---|---|---|
| `const` | 값이 **안 바뀔 때** | ❌ 불가 |
| `let` | 값이 **바뀔 때** | ✅ 가능 |

```ts
for (let i = 0; i < quantity; i++)
//                            └ i++ = i를 매번 바꿈 → 그래서 let (const면 에러)
```

> for 카운터는 `i++`로 계속 바뀌니까 **`let`**. `const`는 "한 번 정하면 안 바뀌는 값"에.

---

## ✅ 한 눈 요약

```
① if는 함수가 아니라 갈림길
   if (existing) 괄호 안 = 매개변수 X, "참/거짓 볼 조건"
   객체=참 / undefined=참거짓의 거짓 → 그래서 existing만 써도 분기됨

② 코드 정의 vs 창고 실제값 (상태관리 뿌리)
   코드 items:[] = "초기값 설명서" (영원히 안 바뀜, 앱 켤 때 1번)
   창고 실제값   = 지금 든 값 (set이 바꿈)
   🏦 "0원 개설" 신청서(안 바뀜) vs 통장 잔액(바뀜)

③ 누가 바꾸나: if=길 고르기 / return=값 내놓기 / set=진짜 써넣기 ✅
   items: = "어느 칸 바꿀지 이름표" (isOpen은 안 건드림 = 병합)

④ quantity 따로 관리
   - item엔 quantity 없음 (page가 안 보냄, Omit)
   - 수량은 "상품" 아니라 "장바구니"의 개념 (진열대 물건 vs 몇 개 담음)
   - 처음=1 붙임 / 이미 있음=기존+1
   - 🟢 zustand 규칙 아님 = 장바구니 모델링 표준 (어디서든 이렇게)
   - quantity 저장(원본) / 합계 계산(파생)

⑤ for (let i) : 변수는 "태어남 신고" 필수(안 하면 에러)
   let vs const = 값 바뀌냐 → i++로 바뀌니 let (const면 에러)
```

---

## ▶ 다음에 여기서 시작

- addItem의 **불변성** 마무리 — 왜 `push`(직접 수정) 안 하고 `map`/`[...state.items]`로 **새 배열 만들어 교체**하나? (React가 참조 바뀌어야 리렌더 감지)
- 나머지 함수 `removeItem`(filter) · `updateQuantity`(0이면 filter, 아니면 map) — 오늘 배운 4단계 패턴이 그대로 반복됨
