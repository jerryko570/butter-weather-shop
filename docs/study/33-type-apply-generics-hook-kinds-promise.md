# 33. 타입 "적용"(공유 계약) + 훅 분류(API훅 vs 쿼리훅, Supabase≠훅) + Promise 리턴타입 + 제네릭

> 한 줄: **타입은 정의만으론 아무 일 안 하고, 데이터가 흐르는 자리(함수 매개변수·리턴·변수)에 "붙여야(적용)" 의미가 생긴다 — 한 번 정의한 Purchase·CreatePurchaseInput이 page→usePurchase→route→service 전체에 붙어 "공유 계약서"가 됨. usePurchase=우리 API(/api/..)를 fetch로 호출하는 "API 훅(mutation)" / useProduct=Supabase 직접 호출 "쿼리 훅". Supabase 자체는 훅이 아니라 백엔드(데이터가 사는 곳). async 함수 리턴은 `Promise<Purchase>`(비동기라 값 즉시 못 줘 약속부터). `< >`=제네릭=타입 인자(함수 `( )`=값 인자). 타입은 TS 체크용이라 실행 땐 사라짐.**
> 타입설계·Omit [[29-type-design-usemutation-write-flow]] · 읽기vs쓰기·자동API [[32-ui-code-mapping-read-vs-write-rest-api]] · useMutation 꾸러미 [[31-entry-point-mutate-chain-createdpurchase]] · type vs interface [[30-reading-unfamiliar-code-route-service-type-design]]

---

## 1. ⭐ 타입 "적용" = 흐름에 붙이기 (공유 계약서)

타입은 **정의만 하면 아무 일도 안 함.** 데이터가 흐르는 자리에 **붙여야(적용)** 의미가 생김:

```
① page:    purchase.mutate({...})              ← 이 객체가 CreatePurchaseInput (TS 체크)
② usePurchase: postPurchase(input: CreatePurchaseInput): Promise<Purchase>
③ route:   const body = await request.json() as CreatePurchaseInput
④ service: createPurchase(input: CreatePurchaseInput): Promise<Purchase>
```

- 한 번 정의한 타입이 **page→usePurchase→route→service 전체**에 붙어 **"공유 계약서"**가 됨.
- 효과: page에서 `product_id` 빼먹으면 → TS가 "CreatePurchaseInput과 안 맞아!" 즉시 잡음. **한 곳(타입) 정의로 흐름 전체 보호.**
- 타입이 흐름을 말함: `CreatePurchaseInput`(사용자 몫) 들어가서 → `Purchase`(완성본) 나옴.

---

## 2. ⭐ 훅 분류 — API 훅 vs 쿼리 훅 (+ Supabase≠훅)

| 훅 | 종류 | 우리 API 거침? | 부름 |
| --- | --- | --- | --- |
| `useProduct`·`useProducts` | 읽기(useQuery) = **쿼리 훅** | ❌ Supabase 직접 | — |
| **`usePurchase`·`usePayment`** | 쓰기(useMutation) = **API 훅** | ✅ `fetch('/api/..')` | route→service |
| `useCart` | 클라 상태(Zustand) | — (서버 안 감) | — |

- **usePurchase = "API 훅"** — 우리가 만든 API(`/api/purchases`)를 fetch로 호출(정확히는 mutation 훅).
- **useProduct ≠ API 훅** — 우리 API 안 거치고 **Supabase 직접**(쿼리 훅). → "API 훅"이라 부를 수 있는 건 usePurchase·usePayment.

### ⚠️ Supabase는 "훅"이 아니다
- **Supabase** = 백엔드(Postgres+자동API+Auth+Storage). **데이터가 사는 곳.** 훅 아님.
- **useProduct** = Supabase를 읽는 **쿼리 훅**(useQuery 기반). 이게 훅.
- 🏢 도서관(Supabase, 책=데이터) / 사서(useProduct, 꺼내오는 훅) / 손님(page, 호출).
- 레이어: `Supabase(백엔드) → useProduct(쿼리 훅) → page(컴포넌트)`.

---

## 3. ⭐ `Promise<Purchase>` — async 함수 리턴 타입

```ts
async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> { ... }
```

```
Promise < Purchase >
└──┬──┘   └───┬───┘
약속상자(비동기)  나중에 줄 내용물 타입
```

- **`Promise`** = "지금은 없지만 **나중에 줄게**" 약속. **async 함수는 무조건 Promise 돌려줌**(네트워크 기다려야 해서 값 즉시 못 줌).
- **`<Purchase>`** = 그 약속이 나중에 줄 내용물 = Purchase.
- 그래서 `: Purchase`가 아니라 `: Promise<Purchase>`. `await`로 풀면 Purchase 나옴.
- 🔔 진동벨: 지금 음식(Purchase) 없지만 "준비되면 줄게"(Promise). await=벨 울릴 때까지 기다림.
- 받는 쪽(`input: CreatePurchaseInput`)엔 Promise 없음 — **받을 땐 즉시 / 줄 땐 나중**(async).

---

## 4. ⭐⭐ 제네릭 — `< >` = 타입 인자

```
함수:    add( 3 )            ← ( ) 값 인자
제네릭:  Promise< Purchase >  ← < > 타입 인자
```

- **제네릭 = 타입을 인자처럼 `< >`에 넣는 것.** 함수가 값을 받듯, 제네릭은 타입을 받음.
- 이미 쭉 씀: `Promise<Purchase>`·`create<CartStore>`·`Omit<Purchase,...>`·`useState<number>`·`CartItem[]`(=`Array<CartItem>`). **본 `< >`는 다 제네릭.**
- **왜**: 재사용. `Promise` 하나로 `Promise<Purchase>`·`Promise<string>`... 아무 타입. 틀 하나를 여러 타입에 (Button variant처럼 "하나로 여러 버전").

### `( )` vs `< >`

| | `( )` 값 인자 | `< >` 타입 인자 |
| --- | --- | --- |
| 넣는 것 | 실제 데이터 | 타입(모양) |
| 언제 | 실행(런타임) | 타입 체크(컴파일) |
| 실행 후 | 남음 | **사라짐**(TS→JS 되면 없어짐, `as`가 "약속"이던 결) |

- 보통 `<타입>` 먼저 → `(값)` 나중: `useState<number>(0)`.

---

## 5. 타이핑 교정 메모 (반복 함정)

- interface 필드 `state` → **`status`**(DB 컬럼명, CreatePurchaseInput의 `'status'` Omit과 짝).
- `Omit<'Purchase',...>` → `Omit<Purchase,...>`(첫 인자=타입, 따옴표 X).
- buyer **셋 다** 임시 Omit: `buyer_name`도 넣기(phone·address만 넣고 name 누락 주의).
- 개념: 결제하기 = purchases에 **저장(쓰기)** — "가져오기(읽기)" 아님. 타입은 "purchases 테이블 구조를 참고해" 짜되, 동작은 쓰기.

---

## 한 줄 정리 모음

1. 타입은 정의만으론 X, 흐름 자리(매개변수·리턴·변수)에 붙여야(적용) 의미. 한 번 정의 → page~service 공유 계약.
2. usePurchase=API 훅(우리 /api 호출, mutation) / useProduct=쿼리 훅(Supabase 직접). Supabase는 훅 아니라 백엔드.
3. async 리턴=`Promise<Purchase>`(비동기라 약속부터). 받을 땐 즉시, 줄 땐 나중.
4. 제네릭=`< >`에 타입 인자(함수 `( )`=값 인자). Promise/Array/useState/Omit/create 다 제네릭. 재사용 목적.
5. `< >`타입은 실행 땐 사라짐(TS 체크용) / `( )`값은 실행에 들어감.
6. 타이핑: `state`→`status`, `Omit<Purchase>`(따옴표X), buyer_name도 Omit, 결제=쓰기(저장).
