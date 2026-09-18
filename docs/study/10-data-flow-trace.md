# 10. 담기 버튼 하나를 끝까지 추적 — 데이터 흐름 전 구간

> 한 줄: **상품 "담기" 클릭 하나가 Supabase에서 localStorage까지 어떻게 흐르는지 끊지 않고 따라간 기록. 핵심은 "함수·인자·콜백"을 밑바닥부터 이해하는 것.**
> 스토어 해부는 [[09-store-anatomy]] · 커링은 [[07-currying-create]] · 설계 순서는 [[08-design-build-order]] · 서버 통로는 [[06-route-handler]] · 전체 지도는 [[00-flow-map]].

---

## 🗺️ 전 구간 한 장

```
① Supabase products 테이블 (원본 창고)
      ↕ 요청/응답 (읽기)   "이 상품 줘" / "여깄다"
② useProduct (React Query) — 조회(.single) + RQ가 감싸서 관리
      ↓ RQ 재갱신 렌더링
③ const { data: product } = useProduct(slug)
      ↓ 담기 클릭
④ handleAddToCart — for(수량만큼) addItem({ 6개 컬럼만 })
      ↓ 인자 {} → item 매개변수 주입
⑤ cartStore addItem: (item) => set((state) => { 있으면+1 / 없으면추가 })
      ↓ persist (middleware)
⑥ localStorage — 새로고침해도 유지 (rehydrate)
```

- **읽기(①→③)** 는 서버로 감. **담기(③→⑤)** 는 로컬(Zustand)에만. 서버로 가는 건 결제할 때뿐.

---

## 🔍 읽는 순서 ≠ 만드는 순서

```
읽기(추적):  화면(page) → 훅(useCart/useProduct) → 스토어/쿼리
만들기:      아래(담을 곳)부터 → 화면
```

추적 도구는 **Cmd+클릭(정의로 점프)**. 함수 이름에 반복하면 여러 파일을 건너 **한 정의에 도착** → 그게 "같은 함수"라는 증거.

---

## 🧩 함수 밑바닥 5개념 (제일 오래 헤맴)

### ① 정의 ≠ 실행

```ts
addItem: (item) => set(...)   // 정의 (레시피 적기) — 안 돌아감
addItem({...})                // 호출 (요리) — 이때 실행
```

`=>` 있으면 함수. **함수는 괄호로 불러야(호출)** 돌아간다. cartStore엔 정의만, 실행은 클릭할 때 page에서.

### ② 인자 vs 매개변수 vs 리턴 (위치로 판별)

```ts
addItem({...})            // 괄호 () 안 = 인자 (들어감)
addItem: (item) => ...    // 정의 괄호 () = 매개변수 (받는 빈 상자)
return {...}              // return 뒤 = 리턴 (나옴)
const x = addItem(...)    // = 왼쪽 = 리턴 받는 곳
```

- **호출 괄호 `함수(...)`** → 인자
- **정의 괄호 `(...) =>`** → 매개변수
- `add(3,4)`에서 3→a와 똑같이, `addItem({})`의 `{}`가 `item`으로.

### ③ 누가 인자를 넣나 — "누가 부르냐 = 누가 넣나"

```ts
addItem: (item) => set((state) => { state.items.find((i) => ...) })
          └─┬┘         └──┬─┘                        └┬┘
        page가 넣음    zustand가 넣음              find가 넣음
```

| 매개변수 | 주입 주체 | 왜 |
| --- | --- | --- |
| `item` | page | page가 addItem 호출 |
| `state` | zustand | zustand가 set 콜백 실행 |
| `i` | find | find가 콜백 실행하며 요소 하나씩 |

### ④ 콜백 패턴 — 어디에나 있는 그 구조

내가 함수를 남한테 넘기면(콜백), 받은 쪽이 실행하며 매개변수를 채워준다.

```ts
set((state) => ...)   // zustand가 state 채움
.find((i) => ...)     // find가 i 채움
.map((i) => ...)      // map이 i 채움
onClick={(e) => ...}  // React가 event 채움
```

라이브러리가 귀찮은 일(반복·상태 꺼내기)을 대신 하고, 나는 "각 요소로 뭘 할지"만. 함수도 **값**이라서 인자로 넘길 수 있다.

### ⑤ 참조 vs 원본

```ts
cartStore:  addItem: (item) => ...   // 원본 (=> 있음, 유일한 정의)
useCart:    addItem: store.addItem   // 참조 (원본 가리키기)
page:       addItem                  // 참조
```

- **`=>`/function 있는 곳 = 원본**, 이름만 넘기면 = 참조.
- 참조는 복사 아님 — 같은 원본을 가리킴. 그래서 파일이 달라도 **같은 함수**(구글독스 링크처럼).

---

## 📥 읽어오는 쪽 — Supabase + React Query

```ts
export const useProduct = (slug: string) =>
  useQuery({
    queryKey: ['product', slug],        // 캐시 라벨 (PK 아님)
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products').select('*')    // 칸(컬럼) 고르기
        .eq('slug', slug).eq('is_active', true)  // 줄(행) 고르기
        .single()                        // 배열 말고 객체 하나
      if (error) throw error
      return data as Product
    },
  })
```

- **쿼리 체인 = 주문서 작성** (조건 적기). await 전엔 DB에 안 감. 아직 데이터 없음.
- **await = 요청 발사** → SQL로 번역돼 Supabase가 실행·응답. **우리가 데이터를 보내는 게 아니라 요청을 보내고 data를 받음**(읽기).
- `.single()` = 결과를 **배열이 아니라 객체 하나**로 → `product[0].id` 대신 `product.id`.
- `return data` → useQuery의 `.data`가 됨(자동 생성) → page가 `const { data: product }`로 꺼냄.
- **RQ가 하는 일** = data를 **감싸서 관리**(캐싱 + `isLoading`/`error` 제공 + 재갱신 렌더). 데이터 내용을 바꾸는 게 아님.

> `product`는 테이블 한 행(객체). `product.id`는 그 행의 id 컬럼값. 변수명(`product`)은 자유, 속성명(`.id`)은 컬럼과 일치해야 함.

---

## 📤 담는 쪽 — page → Zustand

```ts
const handleAddToCart = () => {
  for (let i = 0; i < quantity; i++) {   // 수량만큼 반복
    addItem({
      id: product.id, slug: product.slug, name: product.name,
      price_krw: product.price_krw, price_usd: product.price_usd,
      image: product.images?.[0] ?? '',   // 배열에서 대표 1장, 없으면 ''
    })
  }
  openCart()   // for 밖 → 1번만 (담고 나서 패널 열기)
}
```

- products 컬럼 **17개 중 6개만** 골라 담는다 (장바구니에 필요한 것만).
- `?.[0]` = 있으면 첫 이미지(없으면 undefined, 에러 X), `?? ''` = 그래도 없으면 빈 문자열.
- `addItem`은 1개씩 담음 → 수량 3이면 3번 반복. `openCart`는 for 밖이라 1번.
- **어느 `{}` 안이냐가 실행 횟수를 정함** (for 안=반복 / for 밖=1번).

---

## 💾 저장 — cartStore set → items → localStorage

```ts
addItem: (item) => set((state) => {
  const existing = state.items.find((i) => i.id === item.id)  // 이미 담겼나?
  if (existing) {
    return { items: state.items.map((i) =>                    // 있으면 → 그 상품만 +1
      i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) }
  }
  return { items: [...state.items, { ...item, quantity: 1 }] } // 없으면 → 새로 추가
})
```

- `state` = zustand가 주입한 **현재 스토어 전체 상태**(items·isOpen·함수들). `state.items` = 현재 담긴 배열.
- `set`은 콜백이 **`return`한 `{ items }`로 스토어 items를 교체**. 이게 "진짜 저장".
- 담을 땐 `quantity: 1`을 store가 붙임 → 그래서 `item` 타입이 `Omit<CartItem, 'quantity'>`.
- **persist(middleware)** 가 items 바뀔 때마다 localStorage(`butter-weather-cart`)에 자동 백업 → 새로고침하면 다시 읽어와 복원(rehydrate).

---

## 🎨 시각화 팁 (디자이너 강점)

- **코드 → 실제 장바구니 UI에 매핑**: items=리스트, isOpen=서랍, addItem=담기버튼, totalKrw=하단 합계.
- 색: 🩷 Supabase(서버) / ⬛ 코드 / 🟨 메모 / 🟧 흐름 화살표 / 🟥 갈래.
- 화살표는 Supabase만 **양방향(요청↔응답)**, 나머진 아래로.

---

## ✅ 한 눈 요약

```
전 구간:  Supabase →(요청/응답,읽기)→ useProduct(RQ 감쌈) → product
          → handleAddToCart(6컬럼,수량만큼) → item 주입 → set → items → localStorage

함수 5개념:
 ① 정의 ≠ 실행     (=> 있으면 함수, 괄호로 불러야 돌아감)
 ② 인자/매개변수/리턴 (호출괄호=인자 / 정의괄호=매개변수 / return·= 왼쪽=리턴)
 ③ 누가 넣나       item=page · state=zustand · i=find (누가 부르냐=누가 넣나)
 ④ 콜백 패턴       콜백 넘기면 라이브러리가 매개변수 채움 (set·find·map·onClick)
 ⑤ 참조 vs 원본    => 있는 곳=원본, 이름만=참조 (같은 함수, 파일 넘어 연결)

읽기 문법:  체인=주문서작성(await 전엔 DB 안 감) · await=요청발사 · .single()=객체 하나
          RQ=data 감싸서 관리(.data 자동, isLoading/error/캐싱)
담기 문법:  ?.[0]=안전접근 · ?? ''=기본값 · for 안/밖=반복/1번 · 6컬럼만 골라
저장 문법:  set이 return한 {items}로 교체 · quantity는 store가 붙임 · persist→localStorage
```
