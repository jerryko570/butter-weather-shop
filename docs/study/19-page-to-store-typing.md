# 19. page → cartStore 전체 연결 (타이핑으로 뚫은 날)

> 한 줄: **page가 `for`문으로 상품 6칸을 추려 `addItem`에 넘기면(인자), cartStore의 `item`(매개변수)이 받아서 `set` 안에서 `find`로 "이미 있나" 확인 → 있으면 그 객체의 quantity를 +1, 없으면 quantity:1 붙여 추가한다. quantity는 page가 안 주고 store가 책임지므로 받는 타입은 `Omit<CartItem,'quantity'>`.**
> 흐름지도 [[18-full-flow-map]] · find/점표기법 [[15-find-dot-notation]] · 스토어 해부 [[09-store-anatomy]] · 실습파일 `practice/practice-01-add-to-cart.md`

---

## 오늘 뜯은 두 구간

```ts
// ① page — 담기 버튼 (src/app/(shop)/products/[slug]/page.tsx)
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

// ② cartStore — 저장 (src/store/cartStore.ts)
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
```

---

## ★★★ ① for문 — `i < quantity`

```ts
for (let i = 0;  i < quantity;  i++)
      ───┬───    ─────┬─────    ─┬─
      ① 시작       ② 조건       ③ 증가
```

| 칸 | 코드 | 언제 |
|----|------|------|
| ① 시작 | `let i = 0` | **딱 한 번** (맨 처음) |
| ② 조건 | `i < quantity` | **매 바퀴 전** 검사 (참이면 돌고, 거짓이면 멈춤) |
| ③ 증가 | `i++` | **매 바퀴 끝** |

★ 왜 `<` 인가 — `i`는 **0부터** 세니까. quantity=3이면 0,1,2 (3번) 돌아야 함.
- `i < 3` → 0,1,2에서 참, 3에서 거짓 → **정확히 3바퀴** ✅
- `i <= 3` → 0,1,2,3 → 4바퀴 (1개 더 담김) ❌
- `i > quantity` → 0 > 3 거짓 → **한 바퀴도 안 돎** (장바구니 텅 빔) 🔴 치명적 버그

★ 왜 for문이 필요? — **addItem은 한 번에 +1만** 함. 3개 담으려면 addItem을 3번 불러야 함.
★ `i`는 그냥 **횟수 카운터**(0,1,2). 상품과 무관. (find의 `i`와 이름만 같음 — 헷갈리지 말 것)

---

## ★★★ ② 안전한 점 표기법 `?.` 과 `??`

```ts
image: product.images?.[0] ?? ''
```

이 줄에 점이 **두 개**, 뜻이 다르다:

| 코드 | 종류 | 뜻 |
|------|------|-----|
| `product.images` | 그냥 점 표기법 | product에서 images 꺼냄 |
| `images?.[0]` | **안전한** 점 (`?.` = optional chaining) | 있으면 0번 꺼내고, 없으면 멈춤(안 터짐) |
| `?? ''` | null 병합 | 그마저 없으면 빈 문자열로 |

★ `?.` 없이 `images[0]`만 쓰면 → images가 undefined일 때 `undefined[0]` = 💥 에러(앱 죽음)
★ 비유: `.` = 문 열고 들어가(없으면 넘어짐) / `?.` = 문 있으면 열고 없으면 돌아섬(안 넘어짐)

### 왜 `[0]` 인가 — 배열은 0부터 센다

```ts
images = ['빨강.jpg', '파랑.jpg', '노랑.jpg']
           0번         1번         2번
images[0] → '빨강.jpg'   ← 첫 번째 (대표 사진 1장)
```

★ DB 컬럼은 `images`(복수, `_text` = 배열). 장바구니엔 대표 1장만 필요 → `[0]`으로 첫 장 꺼냄.
★ 3갈래: 사진 있음 → 첫 장 / 배열 텅 빔 `[]` → `''` / images 자체 없음 → `''`

---

## ★★★ ③ 전체 구조 = 함수가 겹겹이 (중첩)

```ts
persist(                        ← 큰 껍데기 (미들웨어)
  (set, get) => ({              ← 콜백: 스토어 알맹이 만듦
    addItem: (item) =>          ← addItem 함수
      set((state) => {          ← 그 안에 set 함수
        ...find, if, return...  ← set 안에 콜백
      })
  }),
  { name: 'butter-weather-cart' }
)
```

층으로: `persist > (set,get)콜백 > addItem > set > (state)콜백` (마트료시카)

### persist 인자 2개
- **인자 1** = `(set,get) => ({...})` 콜백 (스토어 **기능**/알맹이)
- **인자 2** = `{ name: '...' }` 옵션 (localStorage **이름표**)
- ★ `(set,get)`은 persist의 인자가 **아니다** — 인자1(콜백)의 **매개변수**다
- ★ persist = "저장할 내용"이 아니라 **내용을 감싸서 localStorage 저장/복원 기능을 입히는 포장지** (냉장고)

### `(set,get) => ({})` — 소괄호 필수
```ts
(set,get) => {  }    // ❌ 코드 블록 (알맹이 안 나옴)
(set,get) => ({  })  // ✅ 객체 리턴 (알맹이 내놓음)
```
★ zustand가 리모컨(set,get)을 쥐여주고 → 콜백이 받아서 **객체 덩어리(items,isOpen,addItem…)를 만들어 내놓음**

---

## ★★★ ④ 익명함수 + 칸에 담기

```ts
addItem: (item) => { ... }
─┬────  └──────┬──────┘
칸 이름표      익명함수(값)
```

★ `(item) => {}` 화살표 함수는 **이름이 없음 = 익명함수**
★ 근데 `addItem:` 이라는 **객체의 칸(key)** 에 값으로 담김 → 그 칸 이름으로 부름
- 비유: 이름표 없는 상자(익명) 📦 를 "addItem" 선반에 올려둔 것 → 선반 이름으로 찾아 씀
- `useCartStore().addItem(...)` = "addItem 선반의 그 함수 불러줘"
★ 노트 규칙 재확인: **콜론(:) 뒤 = 값(정의)** / 다른 함수 ( ) 안 = 콜백

---

## ★★★ ⑤ find가 주는 건 `true`가 아니라 "객체"

```ts
const existing = state.items.find((i) => i.id === item.id)
```

★ `i.id === item.id` (비교식) → true/false를 냄
★ 하지만 `find`가 **저장하는 값**은 true가 아니라:

| 상황 | existing에 담기는 값 |
|------|---------------------|
| 같은 id 있음 | **그 상품 객체 통째로** `{ id, slug, …, quantity }` |
| 없음 | `undefined` |

★ `if (existing)` 이 통하는 이유 = 객체는 "참" 취급, undefined는 "거짓" 취급 (true 없어도 됨)
★ 왜 객체 전체를 주나? → 바로 뒤에서 `i.quantity`를 꺼내 +1 해야 하니까. true만 있으면 수량 못 꺼냄
★ 비교 대상: `i` = 현재 장바구니의 각 상품 / `item` = page가 방금 담은 상품 1개

---

## ★★★ ⑥ return { items: … } = "그 칸만 갈아끼워라" (병합)

★ 스토어 = 서랍장. `items`, `isOpen`은 각각 **칸(field)**

```ts
return { items: 새배열 }   // "items 칸만 이 새 배열로 바꿔줘"
```

```
바꾸기 전:  { items: [사과],        isOpen: false }
바꾼 후:    { items: [사과,바나나], isOpen: false }
                                    ─────┬─────
                              ★ 안 적은 isOpen은 그대로 (병합)
```

★ set은 **리턴에 적은 칸만** 바꾸고, 안 적은 칸은 그대로 둠 = 병합(merge)
★ 칸 이름을 정확히 `items`로 써야 함 (스토어의 칸 이름과 일치해야 set이 찾음)

### 그 안의 map + 삼항 + 스프레드 (이미 있을 때)
```ts
items: state.items.map((i) =>
  i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
)
```
- `map` = 배열 전부 한 칸씩 돌며 **새 배열** 만들기 (길이 그대로)
- `? :` = 한 줄 if/else — "이 칸이 그놈이냐?" (참 → 수량+1 새 객체 / 거짓 → `i` 그대로)
- `{ ...i, quantity: i.quantity+1 }` = i 복사 + quantity만 덮어씀 (**뒤에 쓴 키가 이김**)
- ★ 원본 안 고치고 **새 배열·새 객체** = 불변성 (React가 변화 감지하려면 참조가 달라야 함)

### 없을 때
```ts
return { items: [...state.items, { ...item, quantity: 1 }] }
```
- `[...state.items, 새것]` = 기존 배열 펼치고 뒤에 새 상품 추가
- `{ ...item, quantity: 1 }` = page가 준 6칸 + **quantity:1 붙여서** 7칸으로

---

## ★★★ ⑦ 오늘의 하이라이트 — `Omit<CartItem, 'quantity'>`

```ts
interface CartItem {          // "저장될" 모양 = 7칸 (quantity 있음)
  id, slug, name, price_krw, price_usd, image, quantity
}

addItem: (item: Omit<CartItem, 'quantity'>) => void
                ─────────┬─────────
              "CartItem에서 quantity 뺀 모양" = 6칸
```

★ `Omit<타입, '뺄칸'>` = **"이 타입에서 이 칸만 빼고 나머지만"**
★ 왜 quantity를 뺐나 = **page가 quantity를 몰라도 되게** 하려고. quantity는 store가 책임짐

```
page가 보냄            store가 붙임              저장됨
{6칸, quantity X}  →  quantity 계산해 추가   →  {7칸, quantity O}
Omit<..,'quantity'>     신규:1 / 기존:i.q+1      CartItem
```

| | quantity |
|---|---|
| `item` (들어올 때, Omit) | ❌ 없음 (page가 안 줌) |
| 새로 담을 때 | store가 `quantity: 1` |
| 이미 있을 때 | store가 `i.quantity + 1` |
| `CartItem` (저장될 때) | ✅ 있음 |

★ 그래서 `existing.quantity`를 꺼낼 수 있었던 것 — 저장된 건 CartItem(7칸)이라 quantity가 있으니까.
★ 타입 정의(Omit)와 실제 로직(quantity:1, +1)이 **왜 짝이 맞는지**가 여기서 만난다.

---

## ★★★ ⑧ 딥다이브 — `if(existing)` 블록 (find vs map, 왜 나누나)

### existing엔 왜 quantity가 있나 — 출처가 state.items라서

```ts
const existing = state.items.find((i) => i.id === item.id)
                 ─────┬─────
              장바구니에 "저장돼 있던" 것 (CartItem 7칸)
```

- `item`(page가 방금 담음) = **6칸, quantity ❌**
- `existing`(state.items에서 찾음) = **7칸, quantity ✅** ← 같은 상품이지만 저장본이라 quantity 붙어 있음
- ★ quantity가 태어난 곳 = **"없을 때" 갈래**의 `{ ...item, quantity: 1 }` (처음 담길 때 붙임)
- ★ 그래서 나중에 existing에서 `i.quantity`를 꺼내 +1 할 수 있는 것

### quantity는 처음부터 1 (0 단계 없음)

- 클릭 1번 = "1개 원함" = `quantity: 1` (0 아님)
- 0이면 = 안 담긴 것과 같음 → 실제로 0되면 장바구니에서 **제거** (`updateQuantity`)
- ★ 처음 = `quantity: 1` **새로 만들기** (0→1 늘림 X) / 두 번째부터 = `i.quantity + 1` **늘리기**

### 배열 안에 "객체가 한 칸으로" 들어간다

```ts
items: [ { id, slug, ..., image, quantity: 1 } ]
       ─┬─  ────────────┬────────────
      배열            그 안 객체 (한 칸)
```
- "객체 안에 추가"가 아니라 **"배열 안에 객체가 한 칸으로"** 추가
- 새 상품 = 새 칸 추가 / 있던 상품 = 그 칸 quantity만 +1

### 비교(find)는 addItem의 일, 써넣기(set)는 zustand의 일

- ★ zustand는 **비교 안 함**. `state`(현재 장바구니)를 콜백에 **주입만** 함
- **비교(find)** = addItem 콜백의 일 (클릭당 1번)
- **써넣기** = set의 일 (콜백이 내놓은 결과를 스토어에 반영·병합·리렌더)

### find vs map — 판단 vs 생산

| | ① find | ② map |
|---|--------|-------|
| 하는 일 | **찾기/판단** | **실제로 바꾸기/생산** |
| 질문 | "이 상품 있나?" | "그 칸 +1 한 새 배열 만들자" |
| 결과 | 객체 1개 (또는 undefined) | 배열 전체 (같은 길이) |
| 스토어 바꾸나? | ❌ 읽기만 | ✅ 이게 스토어에 들어감 |

- ★ find = 냉장고 열어 "우유 있나?" 확인만 / map = "있네, 하나 더 채워 정리" 실제 작업

### ⭐ 왜 find와 map 둘로 나누나 (제일 깊은 포인트)

**"있을 때(+1)"와 "없을 때(새로 추가)"가 완전히 다른 작업이라, 먼저 어느 상황인지 알아야 함.** find가 그 갈림길을 판단.

★ **결정적 이유 = map은 "추가"를 못 함.** map은 이미 있는 칸만 바꿈. 없는 걸 새로 못 만듦.
```
처음 담는 상품(없음)을 map만 쓰면:
  state.items=[{사과}], item={바나나}
  map 돌면 → 사과만 훑음, 바나나 매치 안 됨 → [{사과}] (바나나 사라짐! 😱)
→ 그래서 find로 "없음" 감지 → [...state.items, 새것]으로 "추가" 경로로 보내야 함
```

★ **existing만으로 안 되는 이유** = existing은 객체 1개일 뿐, 배열 전체가 아님.
```
state.items=[{사과,q1},{바나나,q1}], 바나나 또 담음
existing={바나나} → 이것만 +1해서 리턴하면 → 사과 사라짐!
→ map으로 전체 돌며 "사과는 그대로, 바나나만 +1" 한 배열 전체를 만들어야 함
```

3단계로 나뉜 이유: **찾기(find) → 결정(if) → 바꾸기(map/[...])**. 두 작업이 달라서 먼저 판단이 필요.

---

## 헷갈릴 때 메모 (한 줄씩)

- for문 `i < quantity` = "0부터 세서 수량에 닿기 전까지" (addItem이 한 번에 +1이라 여러 번 부름)
- `?.` = 안전한 점(없어도 안 터짐) / `[0]` = 배열 첫 칸(0부터) / `?? ''` = 그래도 없으면 빈칸
- 구조 = persist(포장지) > (set,get)콜백(알맹이 만듦) > addItem(익명함수) > set > (state)콜백
- persist 인자 2개: 콜백(기능) + name(이름표). set/get은 콜백의 매개변수(persist 인자 아님)
- `=> ({})` 소괄호 = 객체 리턴 / `=> {}` = 코드블록
- `addItem:` = 익명 화살표함수를 칸(key)에 담은 것 → 칸 이름으로 부름
- find = 조건 맞는 **객체**를 준다 (true 아님!) / 없으면 undefined → if(existing)이 통함
- find가 객체를 주는 이유 = 뒤에서 그 객체의 quantity를 꺼내 +1 해야 하니까
- return { items: … } = items 칸만 갈아끼움, 나머지(isOpen)는 그대로 (병합)
- map=새 배열 / {...i}=새 객체 / 뒤 키가 이김 → 불변성
- `Omit<CartItem,'quantity'>` = quantity 뺀 6칸만 받음 (quantity는 store가 붙임)
- 인자(page가 넣음) → 매개변수(item이 받음) : 부르는 사람 = 채우는 사람
- existing엔 quantity 있음(state.items=저장본 7칸) / item엔 없음(page=6칸)
- quantity 처음=1 만들기(0 없음) / 두 번째부터=+1 늘리기
- 배열[ ] 안에 객체{ }가 "한 칸"으로 들어감 (객체 안 추가 아님)
- 비교(find)=addItem의 일 / 써넣기(set)=zustand의 일 (zustand는 비교 안 함, state 주입만)
- find=판단(있나? 객체1개, 안 바꿈) / map=생산(그 칸 +1, 배열 전체, 이게 스토어에 들어감)
- ⭐ find·map 둘로 나누는 이유 = "있을 때 +1" vs "없을 때 추가"가 다른 작업 + map은 추가를 못 함(있는 칸만 바꿈) → find로 갈림길 판단 필요
- existing만 쓰면 다른 상품 사라짐 → map으로 전체 돌며 그 칸만 +1
