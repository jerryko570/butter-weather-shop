# 09. 스토어 해부 — 객체 도시락 4칸 & 정의→창구→화면

> 한 줄: **스토어 객체는 "도시락 4칸"(🟢데이터원본·🟢UI원본·🔴바꾸기·🔵계산). 값(상태)엔 '기억해야 하는 원본'만 넣고 나머진 계산. `set`·`get`은 도시락 밖 '도구'. 정의(cartStore)→창구(useCart)→화면(컴포넌트)로 흐르고, 꺼낼 때 괄호 O/X가 갈린다.**
> 커링·persist 구조는 [[07-currying-create]] · 설계 순서는 [[08-design-build-order]] · 쓰기(set)는 [[05-mutation]] · 전체 지도는 [[00-flow-map]].

---

## 🍱 스토어 객체 = 도시락 4칸

```
🟢 데이터 원본   items: []           값(상태)   ← 진짜 데이터, 기억
🟢 UI 원본       isOpen: false       값(상태)   ← 화면 상태, 기억
🔴 바꾸기(액션)  addItem, openCart…  함수(set)  ← 원본을 고침
🔵 계산(파생)    totalKrw, totalCount… 함수(get)  ← 원본을 읽어 계산
```

- **값(🟢)** = 그냥 값. `items: []`, `isOpen: false`. 함수 아님.
- **함수(🔴🔵)** = 방향이 반대: **고치면 set(🔴), 읽기만 하면 get(🔵)**.
- 순서(상태 먼저 → 함수)는 **강제 아니라 관례** — 뭘 기억하는지 위에 모아두면 읽기 좋아서.

---

## 🟢 값(상태)에 뭘 넣나 — "기억해야 하는 원본"만

판단 테스트 2개:

```
① "사라지면 화면 못 그리나?"  → YES면 상태 후보
② "다른 값으로 계산되나?"      → YES면 상태 아님 (함수로)
```

| 항목 | 기억 필요? | 계산 가능? | 판정 |
| --- | --- | --- | --- |
| `items` | ✅ | ❌(원본) | 🟢 상태 |
| `isOpen` | ✅ | ❌ | 🟢 상태 |
| `totalCount` | — | ✅ items로 | ❌ → 🔵 함수 |
| `totalKrw` | — | ✅ items로 | ❌ → 🔵 함수 |

🧾 **영수증 비유:** `items`=담은 물건 목록(원본, 기억) / `totalKrw`=영수증 합계(목록 보고 매번 계산). 합계를 따로 저장하면 → 물건 뺐는데 합계 안 바뀌는 **버그**. 그래서 파생값은 함수로.

💡 **단일 진실 원천(single source of truth):** 원본은 한 곳(`items`)만. 그거 하나 바꾸면 합계·개수가 자동으로 따라온다. 원본을 둘로 두면 동기화 깜빡 = 버그.

🎨 디자이너 비유: 상태 = 포토샵 **원본 레이어**, 파생값 = 자동으로 뜨는 **썸네일**. 썸네일 따로 저장 안 하잖아.

---

## `items: []` 왜 빈 배열?

- **배열([])인 이유**: 상품을 **여러 개** 담으니까. 타입도 `items: CartItem[]`.
- **비어있는([]) 이유**: 처음엔 **0개**(초기값). 마트에서 방금 집은 빈 카트.
- **왜 `null` 안 쓰고 `[]`?**: 빈 배열이면 `.map`·`.filter`·`.reduce`·스프레드가 **에러 없이 0번 돌고** 안전하게 넘어감. `null`이면 `null.filter()` → 💥.
- 빈 배열도 **어엿한 데이터**("0개"라는 사실). "데이터 원본"은 내용물이 아니라 **자리(슬롯)** 를 뜻함. 자리는 처음부터 있고 내용이 0→1→2로 자람. persist도 `[]`째로 저장.

---

## 🔧 `set`·`get`은 도시락 '밖' 도구

```ts
(set, get) => ({ items:[], addItem:..., totalKrw:... })
 └───┬───┘    └──────────┬──────────┘
  받는 도구(집게)         도시락(멤버: items, addItem…)
```

- `set`·`get`은 객체 **멤버가 아니다.** 콜백이 **받아서 함수 안에서 쓰는 도구.**
- zustand가 둘 다 쥐여주지만 **필요한 것만** 받아 씀: `set`은 바꿀 때(거의 항상), `get`은 읽어 계산할 때만. 계산이 없으면 `(set) =>`만 받아도 됨.
- 비유: `items`·`addItem`=도시락 **반찬**(멤버) / `set`·`get`=요리할 때 쓰는 **집게**(도구, 도시락 안엔 안 들어감).

---

## 💧 객체 데이터는 어디서 파생되나 — 2층

**층① 모양(구조)** ← `interface CartStore` ← 설계 5질문([[08-design-build-order]])

```
"무슨 데이터?" → items, isOpen → interface에 적음 → 객체로 구현
설계 5질문 → interface(타입, 설계도) → 실제 객체
```

**층② 실제 값(내용)** ← 3곳에서 채워짐

```
① 코드 초기값    items: [], isOpen: false      (태초의 값)
② 사용자 행동    addItem 호출 → set으로 채움
③ 새로고침 후    persist가 localStorage에서 복원(rehydrate)
```

---

## 🔄 정의 → 창구 → 화면 (전체 흐름)

```
cartStore (정의/주방)
   ↓ useCartStore()  = 버튼 눌러 도시락 통째로 꺼냄
store = { items, isOpen, addItem, totalKrw… }  전체 객체
   ↓ useCart (창구/재포장)
{ items, totalKrw(숫자), addItem… }  깔끔하게 다시 묶음
   ↓ 컴포넌트
CartButton · CartDrawer 가 화면에 그림
```

- `const store = useCartStore()` — **괄호 O = 실행** → 객체 전체 리턴. `store`는 값+함수 다 든 도시락.
- `store.items` — 도시락에서 반찬 하나 꺼내기 = **현재 담긴 배열**.

---

## ⭐ 꺼낼 때 괄호 O/X — 세 종류 (핵심, [[07-currying-create]] 실전판)

```ts
items:    store.items,        // 값     → 그냥 꺼냄        (괄호 X)
totalKrw: store.totalKrw(),   // 계산   → 실행해 숫자로     (괄호 O) ⭐
addItem:  store.addItem,      // 액션   → 함수 그대로 넘김  (괄호 X) ⭐
```

| | 괄호 | 왜 |
| --- | --- | --- |
| `store.items` | ❌ | 값이라 그냥 |
| `store.totalKrw()` | ✅ | **"지금 합계 얼마?" 숫자가 당장 필요** → 즉시 실행 |
| `store.addItem` | ❌ | **"나중에 클릭 때 실행"** → 지금 실행하면 안 됨, 함수만 전달 |

07 노트 그거:

```tsx
onClick={handleAddToCart}     // ✅ 함수 자체 (나중에 실행)
onClick={handleAddToCart()}   // ❌ 렌더 즉시 실행 (버그)
```

→ `totalKrw()`는 지금 숫자 필요라 괄호 O, `addItem`은 나중 실행이라 괄호 X. 여기 `addItem`에 `()` 붙이면 렌더되자마자 담겨버리는 버그.

---

## 🪟 useCart 코드가 필요한 이유

`cartStore(주방) ← useCart(창구/직원) ← 컴포넌트(손님)`. 컴포넌트가 주방에 직접 안 들어가고 창구에만 주문.

1. **계산함수 미리 실행** — `totalKrw()` 실행해 숫자로 줌 → 컴포넌트가 괄호 깜빡하는 실수 봉쇄.
2. **내부 숨김(추상화)** — 컴포넌트는 `useCart()`만 알면 됨. store가 zustand인지 이름이 뭔지 몰라도 됨.
3. **단일 창구** — CartButton·CartDrawer·체크아웃 전부 useCart 하나로 접근 → 일관성.
4. **⭐ 갈아끼우기 쉬움** — store 구조/기술을 바꿔도 **useCart 내부만** 고치면 끝. 쓰는 컴포넌트는 한 줄도 안 건드림.

🎨 = 디자인 시스템 컴포넌트와 같은 원리(추상화·단일 책임). 쓰는 쪽은 내부 cva·CSS 몰라도 `<Button>`만 쓰듯, `useCart`도 겉면만 노출.
⚠️ 아주 얇은 래퍼라 "오버엔지니어링" 의견도 있지만, 커질 프로젝트에선 **경계를 미리 긋는** 값어치가 큼(특히 4번).

---

## 🎬 addItem 3단 추적 (원본 → 통로 → 호출)

한 함수가 3파일에 보여도 **원본은 하나**. 나머진 '가리키기(참조)'.

```
① 원본(정의)   cartStore.ts:45   addItem: (item) => set((state)=>{...})  ← 진짜 몸통
② 통로(참조)   useCart.ts:10     addItem: store.addItem                  ← 재정의 X, 원본 가리킴
③ 호출(실행)   [slug]/page.tsx   addItem({ id, name... })                ← item 넣고 부름
```

📞 전화번호 비유: ①=사는 집, ②=번호 건네줌, ③=그 번호로 전화. 번호를 나눠 가져도 **받는 사람은 한 명**.

### 클릭하면 벌어지는 일 (handleAddToCart)

```
0. 렌더 때    const { addItem } = useCart()      addItem 참조 미리 쥠
1. 클릭       onClick={handleAddToCart}          (괄호 X = 나중 실행)
2. 호출       for(quantity) addItem({product...}) item 넣어 부름 (수량만큼 반복)
              → openCart()                        (괄호 O = 지금 실행)
3. 원본 실행  cartStore addItem: (item) => set(…)
4. set이 추가 items: [...state.items, {...item, quantity:1}]   ← '추가'는 여기(set)!
5. persist    바뀐 items를 localStorage 백업
6. 리렌더     items 구독하던 CartDrawer 갱신
```

- `addItem`은 1개씩 담음(있으면 +1) → 수량 3이면 **3번 반복**.
- 추가 주체 = **`set`** (persist 아님. persist는 그 뒤 백업).
- useCart는 **렌더 때 참조만 건네고 빠짐** — 클릭 땐 item이 page→store **직행**(같은 함수라). useCart가 진짜 일하는 건 **값(items·total)** 읽어 재포장·구독 연결하는 쪽.

---

## 🧩 매개변수 3형제 — "누가 인자를 넣나" (오늘의 핵심)

> **판단법: 그 함수를 '누가 부르냐' = 누가 인자를 채우냐.**

| 매개변수 | 어디 | 누가 넣나 | 왜 |
| --- | --- | --- | --- |
| `(set, get)` | 스토어 콜백 | **zustand** | 콜백을 zustand가 실행 |
| `state` | `set((state)=>…)` | **zustand** | set 콜백을 zustand가 실행 |
| `item` | `addItem:(item)=>…` | **컴포넌트(page)** | addItem을 page가 호출 |

- `item` = "담을 상품 `{}` 객체". page의 `addItem({...})` 그 객체가 원본 `item`으로 직행. (zustand 아님!)
- `state` = "현재 스토어 상태 `{items, isOpen…}`". **함수 아님** — 콜백은 `(state)=>{}`, state는 그 매개변수.

### set 두 형태

```ts
openCart: () => set({ isOpen: true })       // 직접 값 (현재 상태 안 봄)
addItem: (item) => set((state) => {...})    // 콜백 (현재 items를 '읽어야' 하니까)
```

addItem이 콜백 형태인 이유 → 기존 items를 봐야 함: `state.items.find(existing?)` / `[...state.items, new]`. "이미 담긴 상품인가?" 판단하려면 현재 상태가 필요 → zustand한테 "지금 상태 줘" 하는 콜백.

---

## ✅ 한 눈 요약

```
도시락 4칸:
 🟢 데이터 원본  items      값 · 기억      ┐
 🟢 UI 원본      isOpen     값 · 기억      ┘ = 상태
 🔴 바꾸기       addItem    함수 · set     ┐
 🔵 계산         totalKrw   함수 · get     ┘ = 함수

값에 넣는 것 = 기억해야 하는 원본만 (계산되는 건 함수로)
set/get = 도시락 밖 '도구' (멤버 아님)
items:[] = 여러 개(배열) · 처음 0개(빈) · null 대신 [] 라야 안전

파생:  모양=interface←설계5질문  |  값=코드초기값→행동(set)→localStorage복원

흐름:  cartStore → useCartStore() → store → useCart(창구) → 컴포넌트
괄호:  값=그냥 | 계산=실행(O) | 액션=그대로(X)   ← 07 실전
useCart 이유:  실행대행 · 내부숨김 · 단일창구 · 갈아끼우기

addItem 3단:  원본 cartStore:45 → 통로 useCart:10(참조) → 호출 page(item 넣음)
추가 주체:    set (persist는 그 뒤 백업만)
누가 인자 넣나:  item=컴포넌트 | state·set·get=zustand   (누가 부르냐 = 누가 넣나)
set 형태:     직접값 set({}) | 콜백 set((state)=>…) ← 현재 상태 읽어야 할 때
```
