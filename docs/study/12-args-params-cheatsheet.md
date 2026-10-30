# 12. 인자 · 매개변수 · 구조분해 — 헷갈릴 때 보는 치트시트

> 한 줄: **`()`·`{}` 를 다 써서 비슷해 보이는 "삼총사"를 위치로 딱 가르는 법.** 헷갈릴 때마다 이 파일부터 열 것.
> 함수 문법 전체는 [[11-function-syntax]] · 데이터 흐름은 [[10-data-flow-trace]].

---

## 🎯 핵심 — 위치로만 구분한다 (뜻 말고 자리!)

```
이름( X )         → X는 인자       (호출 괄호 안 = 넣는 값)
( X ) =>          → X는 매개변수   (화살표 앞 괄호 = 받는 빈칸)
const { X } = …   → X는 구조분해   (= 왼쪽 중괄호 = 결과에서 꺼내기)
```

**뜻으로 외우지 말고 "어디 있냐"로 봐.** 자리만 보면 3초 컷.

---

## 삼총사 비교표

| 이름 | 뭐냐 | 방향 | 위치 (표시) | 언제 |
| --- | --- | --- | --- | --- |
| **① 인자** (argument) | 넣는 실제 값 | IN (들어감) | `이름( 여기 )` | 함수 **부를 때** |
| **② 매개변수** (parameter) | 받는 빈칸(이름표) | (받는 자리) | `( 여기 ) =>` | 함수 **정의할 때** |
| **③ 구조분해** (destructuring) | 결과에서 꺼내기 | OUT (나옴) | `const { 여기 } =` | 결과 **꺼낼 때** |

- **인자 ↔ 매개변수**는 짝: 넣으면(인자) → 그 빈칸(매개변수)으로 들어감.
- **구조분해**는 완전히 다른 것: 함수가 **뱉은 결과**에서 필요한 걸 꺼내는 것.

---

## 같은 함수(useProduct)로 셋 다 보기

```ts
// 📄 page.tsx — 부르는 곳
const { data: product, isLoading, error } = useProduct(slug)
//    └────────③ 구조분해────────┘           └──① 인자──┘
//    결과 꾸러미에서 꺼내기                     넣는 값

// 📄 useProducts.ts — 정의하는 곳
export const useProduct = (slug: string) => {...}
//                        └──② 매개변수──┘
//                         받는 빈칸
```

- **① 인자** = page의 `useProduct(slug)` → slug를 **넣음**
- **② 매개변수** = 정의의 `(slug: string)` → slug를 **받음**
- **③ 구조분해** = page의 `const { data, isLoading, error }` → 결과에서 **꺼냄**

> ⚠️ 한 줄 `const {…} = useProduct(slug)` 안에 **③(구조분해) + ①(인자)** 가 같이 있음.
> **② 매개변수는 여기 없음** — 매개변수는 오직 **정의 파일**에만!

---

## ⚡ 제일 헷갈리는 짝 — 매개변수 vs 구조분해 (둘 다 `{ }`)

```ts
(item) =>                          // ② 매개변수: 화살표 => "앞", 받는 빈칸
const { data, isLoading } = …      // ③ 구조분해: = "왼쪽", 결과에서 꺼내기
```

| | 매개변수 | 구조분해 |
| --- | --- | --- |
| 위치 | `=>` **앞** | `=` **왼쪽** |
| 하는 일 | "이거 받을게" (정의) | "결과에서 이거 꺼낼게" (사용) |
| 언제 | 함수 만들 때 | 함수 쓴 결과 꺼낼 때 |

**구분법: 오른쪽에 `=>` 있으면 매개변수 / 오른쪽에 `=` 있으면 구조분해.**

---

## 우리 코드로 연습 (인자 모양은 함수마다 다름)

```ts
useProduct(slug)                            // ① 인자 = 문자열 하나
addItem({ id, name, price_krw })            // ① 인자 = 객체 하나
useQuery({ queryKey, queryFn, staleTime })  // ① 인자 = 객체 하나
const { slug } = useParams()                // ③ 구조분해 (URL 결과에서 slug 꺼냄)
const { data: product } = useProduct(slug)  // ③ 구조분해 + ① 인자
```

- 인자는 **문자열이든 객체든** 다 인자. **모양은 함수 규칙**이 정함(→ [[11-function-syntax]] ⑨).
- `data: product` = 구조분해하면서 **이름표 바꾸기**(data를 product로). 원래 칸 이름은 `data`(고정), 새 이름은 자유.

---

## 👤 누가 채우나 (인자↔매개변수)

> **부르는 사람 = 매개변수를 채우는 사람.**

```ts
useProduct(slug)          // 내가 부름 → 내가 slug(인자) 넣음
addItem({...})            // page가 부름 → page가 인자 넣음
(state) => {...}          // zustand가 부름 → zustand가 state 넣음
(lastPage, allPages) =>   // React Query가 부름 → RQ가 넣음
```

- 내가 **정의만 하고 안 부르는** 함수(콜백)는 → **라이브러리가 매개변수 채움.**

---

## 🧪 3초 셀프체크 (어떤 코드든)

```
1. 오른쪽에 => 있나?      → 그 앞 ( )는 매개변수
2. 오른쪽에 = 있나?       → 그 왼쪽 { }는 구조분해
3. 이름 바로 뒤 ( )인가?  → 그 안은 인자
```

순서대로 보면 무조건 하나로 갈림.

---

## 🔬 딥다이브 — cartStore addItem 뜯기 (콜백·주체·set)

### ① 콜백은 여러 개일 수 있다 (item은 콜백 아님!)

```ts
persist(
  (set, get) => ({          // 콜백 A ← persist에 넘김
    addItem: (item) =>
      set((state) => {      // 콜백 B ← set에 넘김
        state.items.map((i) => …)  // 콜백 C ← map에 넘김
      }),
  }),
  { name: '…' }
)
```

| 콜백 | 넘긴 상대 | 매개변수 | 채우는 주체 |
| --- | --- | --- | --- |
| A `(set,get)=>({})` | persist | set, get | zustand |
| B `(state)=>{}` | set | state | zustand |
| C `(i)=>` | map/find | i | map/find |

- **콜백 = 다른 함수 "괄호 안에 넘긴 함수".** 셋 다 콜백(넘긴 상대만 다름).
- ⚠️ **`item`은 콜백 아님** — 그냥 값(상품 객체). `addItem: (item) =>` 에서 item은 **매개변수**(값 받는 빈칸).

### ② 부르는 주체 = 채우는 주체 (핵심 원리)

```
그 함수를 "부르는 주체" = 그 매개변수를 "채우는 주체"
```

| 매개변수 | 부르는 주체 | 채움 |
| --- | --- | --- |
| `item` (addItem) | page | page |
| `state` (set 콜백) | zustand | zustand |
| `i` (map 콜백) | map | map |
| `slug` (useProduct) | 나(page) | 나 |

→ 부를 때 값을 넣으니까 **부르는 애가 곧 채우는 애.** 주체 바뀌면 채우는 것도 바뀜.

### ③ set = 저장하는 손 (return만으론 안 담김)

```ts
addItem: (item) =>
  set((state) => {
    return { items: [...state.items, { ...item, quantity: 1 }] }
  })
```

- **콜백** = 새 배열을 **계산해서 `{ items: 새배열 }` 리턴** (결과만 냄)
- **set** = 그 리턴값을 **스토어에 실제로 써넣음** (담기는 이유!) + **병합**(items만 바꾸고 isOpen 등은 유지)
- return만 하고 set 없으면 → 아무것도 안 담김. **set이 저장하는 손.**

### ④ item(단수) vs items(복수) + 데이터가 담기는 곳

```ts
items: []          // items(복수) = 상품들 담는 "배열", 초기 빈 배열
addItem: (item) => // item(단수) = page가 보낸 "상품 하나"(객체)
```

- **item(상품 하나)** 이 **items(배열) "안에" 들어감** (빈배열이 추가되는 게 아님).
- 데이터 담기는 곳 = cartStore의 `return { items: [...state.items, {...item, quantity:1}] }`.
- **quantity는 cartStore가 붙임**(`quantity: 1`) — page 인자엔 없음(6칸만).
- `[...state.items, …]` = 기존 배열 수정이 아니라 **새 배열로 교체**(= 불변성, 다음 주제).

### ⑤ if = 문지기 / return = 함수를 끝냄 (분기)

```ts
if (existing) {
  return { items: state.items.map(…) }   // 있으면 → 여기서 함수 끝
}
return { items: [...state.items, …] }    // 없으면 → 여기
```

- **return은 "함수"를 끝냄**(if를 끝내는 게 아님). **if는 "이 return 쓸지" 정하는 문지기.**
- return이 함수를 끝내니 → 두 return 중 **하나만** 실행됨(= 분기).
- 리턴값 경계 = `return` 뒤 **제일 바깥 `{ }`** = `{ items: … }`. 안쪽 `{...item, quantity:1}`는 부품.

---

## ✅ 한 눈 요약

```
위치로 구분 (뜻 말고 자리!):
  이름( X )        → 인자      (넣는 값, IN)
  ( X ) =>         → 매개변수  (받는 빈칸)
  const { X } =    → 구조분해  (꺼내기, OUT)

인자 ↔ 매개변수 = 짝 (넣으면 그 빈칸으로 감)
구조분해 = 다른 것 (뱉은 결과에서 꺼내기)

제일 헷갈리는 둘:
  => 앞 { } = 매개변수  /  = 왼쪽 { } = 구조분해

const { data: product, isLoading, error } = useProduct(slug)
      └── 구조분해(꺼냄) ──┘                └ 인자(넣음) ┘
  ※ 매개변수는 여기 없음 — 정의 파일에만 있음!

누가 채우나 = 부르는 사람이 채운다 (콜백이면 라이브러리가)

── cartStore 딥다이브 ──
콜백 여러 개: persist용(set,get) / set용(state) / map용(i) — 다 콜백 (item은 값!)
부르는 주체 = 채우는 주체 (주체 바뀌면 채우는 것도 바뀜)
set = 저장하는 손 (콜백은 새배열 계산·return / set이 스토어에 써넣음+병합)
item(단수=상품 하나) ≠ items(복수=배열) / 상품이 배열 "안에" 들어감 / quantity는 store가 붙임
if=문지기 / return=함수 끝냄 → 두 return 중 하나만(분기) / 리턴 경계=바깥 { }
```
