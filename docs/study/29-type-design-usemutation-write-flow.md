# 29. 타입 설계("누가 채우나" 렌즈) + useMutation(쓰기) + 쓰기 흐름/서비스 레이어

> 한 줄: **타입 설계 = DB 테이블을 interface로 1:1 미러 → 필드마다 "누가 채우나(DB/서버/사용자)" 분류 → 서버·DB 몫을 `Omit`으로 빼면 = 사용자 입력 타입. "누가 채우나"는 곧 보안 렌즈(돈·상태·권한은 서버 몫). 쓰기는 `useMutation`(읽기 `useQuery`의 쓰기판) — 자동 아니라 `mutate()`로 수동 발사. 결제 흐름은 UI→클라훅(useMutation)→API 라우트→service→DB로, 장바구니 읽기와 반대 방향 + service 레이어가 한 겹 더.**
> Omit·타입 [[28-reduce-immutability-module-syntax]] · 심기vs누르기·() [[23-usecart-abstraction-boundary]] · set/get·읽기쓰기 [[27-set-vs-get-write-read]]

---

## 1. ⭐ 타입 설계 3단계 (DB → 입력 타입)

### ① DB 테이블을 interface로 1:1 미러

| DB 컬럼 | TS |
| --- | --- |
| text | string |
| integer / numeric | number |
| nullable | `| null` |
| 정해진 값만(상태) | 유니온 `'a' | 'b'` |

→ `Purchase` = purchases 테이블을 거울처럼 비춘 "전체 모양".

### ② ⭐ 핵심 질문: "이 필드 **누가 채우나?**"

| 필드 | 누가 | 왜 |
| --- | --- | --- |
| `id`·`created_at` | **DB** 자동 | `gen_random_uuid()`·`now()` |
| `payment_id`·`status` | **서버** | 결제번호 발급·상태 세팅(위조 방지) |
| `product_id`·`quantity`·`buyer_*` | **사용자** | 뭘 살지·구매자 정보 |

### ③ 입력 타입 = 사용자 몫만 (Omit으로 나머지 빼기)

```ts
type CreatePurchaseInput = Omit<Purchase,
  | 'id' | 'created_at'       // DB 자동
  | 'payment_id' | 'status'   // 서버 생성
  | 'buyer_name' | 'buyer_phone' | 'buyer_address'  // 아직 폼 없어 테스트값
>
```

- `addItem: (item: Omit<CartItem,'quantity'>)`과 **같은 패턴** — page가 quantity 몰라도 store가 붙이듯, 사용자가 payment_id 몰라도 서버가 붙임. 차이는 "뺄 게 `|`로 여러 개"일 뿐.

---

## 2. ⭐ "누가 채우나" = 보안 렌즈

- 사용자가 `status: 'paid'`를 정할 수 있으면 → **돈 안 내고 "결제완료"** 🤑. 그래서 status는 서버만.
- **서버가**: 주문 생성 시 `'pending'` → PortOne 검증 통과해야 `'paid'`로 변경.
- payment_id도 서버 발급(위조 방지). id·created_at은 시스템 관리.
- **→ Omit으로 입력 타입에서 빼는 건 정리가 아니라 "사용자가 건드리면 안 되는 걸 막는 방어막".** 타입 설계 = 보안 설계.

> **누가 채우나 = 누가 책임지나 = 누가 건드리면 안 되나.** 돈·상태·권한은 서버 몫.

---

## 3. ⭐⭐ `useMutation`(쓰기) vs `useQuery`(읽기)

| | `useQuery` (상품·장바구니) | `useMutation` (주문·결제) |
| --- | --- | --- |
| 용도 | **읽기**(가져오기) | **쓰기**(보내기·변경) |
| 실행 | **자동**(화면 뜨면) | **수동**(`mutate()` 불러야) |
| 방향 | DB → 화면 | 화면 → 서버 |
| 꾸러미 | `{ data, isLoading, error }` | `{ mutate, isPending, isError, isSuccess }` |

- 상품 조회는 화면 뜨면 알아서 → 자동 / 주문 생성은 버튼 눌렀을 때만 → 수동(`mutate()`가 방아쇠).
- "자동으로 주문이 보내지면" 큰일(화면 뜨자마자 결제?!) → 쓰기는 반드시 수동 발사.

---

## 4. ⭐ usePurchase 해부 + 타입이 흐름을 말한다

```ts
async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const res = await fetch('/api/purchases', { method:'POST', body: JSON.stringify(input) })
  if (!res.ok) throw new Error(...)
  return res.json()
}
export const usePurchase = () => useMutation({ mutationFn: postPurchase })
```

- `input: CreatePurchaseInput`(사용자 몫) → `Promise<Purchase>`(서버가 payment_id·status 채운 **완성본**). **부분을 보내면 완성본이 돌아온다** — "누가 채우나"가 타입 입출력에 그대로.
- `mutationFn: postPurchase` — **`()` 없음 = 등록만, 실행은 `mutate()`가** (onClick 심기·queryFn 등록과 동일. 심기=지금/누르기=나중).
- `fetch` 2단계: `res`=상태코드·헤더 / `res.json()`=진짜 데이터 꺼내기. `if(!res.ok) throw` → isError로 잡힘.

---

## 5. ⭐ 쓰기 흐름 전체 — 읽기와 반대 방향 + service 레이어

```
읽기(장바구니):  DB → useQuery → page            (데이터가 나한테 옴)
쓰기(결제):      page → useMutation → API라우트 → service → DB  (내가 데이터를 보냄)
                               ↑ 수동 mutate()      ↑ 새 레이어
```

- **service 레이어**(`src/services/`) = 훅과 DB 사이 한 겹 더. 서버 비밀키·검증·service-role 쓰기가 여기 삶("프론트 말 안 믿고 서버가 재검증"). 장바구니는 cartStore가 로직이라 이 레이어가 없었음.
- 결제 2단계: usePurchase(주문 생성, payment_id 발급) → usePayment(그 주문으로 결제창+서버검증).

---

## 한 줄 정리 모음

1. 타입 설계 = DB 미러 → "누가 채우나" 분류 → 서버·DB 몫 Omit → 사용자 입력 타입.
2. "누가 채우나" = 보안 렌즈. 돈·상태·권한(payment_id·status)은 서버 몫 → Omit이 방어막.
3. `useMutation` = 쓰기(수동 `mutate()`) / `useQuery` = 읽기(자동). 주문·결제는 mutation.
4. `mutationFn: fn`은 등록만(`()` 없음), `mutate()`가 방아쇠. fetch는 res→res.json() 2단계.
5. 쓰기 흐름 = UI→훅→API라우트→service→DB(읽기의 반대). service=서버 비밀키·재검증 레이어.
