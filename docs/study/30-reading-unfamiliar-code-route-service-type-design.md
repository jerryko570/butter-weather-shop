# 30. 낯선 코드 파는 법 + route/service 레이어 + 타입 설계(누가 채우나·Omit·type vs interface·number vs string)

> 한 줄: **낯선 기능은 "데이터(저장소)+입구" 두 앵커부터 — 데이터 중심(결제·CRUD)이면 DB/타입부터(bottom-up). 결제 서버는 route.ts(API 받고 2차 검증→service 위임) + service.ts(실제 DB, 여기서 서버가 payment_id·status 채움=지난 설계의 구현). 타입 설계 = DB 미러 interface(원본 전체모양, 서버 것도 다 지정) + Omit 파생 입력타입. "사용자=구매내용 / 서버·DB=주문꼬리표". 유니온·파생은 type(interface는 = 없음), 계산하면 number·식별/표기는 string.**
> 타입설계·useMutation [[29-type-design-usemutation-write-flow]] · Omit [[28-reduce-immutability-module-syntax]] · 코드 읽는 법 [[17-reading-code-dryrun]] · RLS/서버 [[25-supabase-read-query-chain]]

---

## 1. ⭐ 낯선 코드 파고드는 법 (시니어 온보딩 스킬)

낯선 기능 = **두 앵커**부터 잡는다:
1. **데이터(저장소)** — "뭘 저장하나?" → DB 테이블 + 타입. 제일 안 흔들리는 기준점.
2. **입구(진입점)** — "사용자가 뭘 누르면 시작되나?" → 버튼/핸들러.

양 끝을 알면 가운데(흐름)가 보인다. **뭐부터 파냐 = 기능 성격이 정함:**

| 기능 성격 | 진입 | 왜 |
| --- | --- | --- |
| 데이터 중심(결제·주문·CRUD) | **DB/타입부터**(bottom-up) | "뭘 저장·어떤 상태"가 핵심 |
| UI/인터랙션 중심(폼·애니메이션) | UI 입구부터(top-down) | 사용자 행동이 핵심 |

**결제 파는 순서:** ① 실제 DB 테이블(컬럼·상태값) → ② 타입 → ③ 상태 흐름(pending→paid→cancelled 누가/언제) → ④ 입구→출구 흐름.

**집요함의 3질문:** ①"이 데이터 누가 채우나?" ②"왜 여기 있나/없으면 뭐 깨지나?" ③"이 상태 누가·언제 바꾸나?"

---

## 2. ⭐ route.ts(API 서버) + service.ts(service 레이어)

쓰기 흐름: `usePurchase fetch → route.ts POST → service → DB`.

```ts
// route.ts — API 서버(Route Handler)
export async function POST(request: Request) {
  const body = await request.json() as CreatePurchaseInput  // 보낸 데이터 꺼냄
  if (!body.product_id || !body.quantity ...) return 400     // 2차 검증(프론트 말 안 믿음)
  const purchase = await createPurchase(body)                // service에 위임(DB 직접 X)
  return NextResponse.json(purchase, { status: 201 })        // 201 생성됨
}
```

- `export async function POST` = `/api/purchases`로 POST 오면 실행. **여기부터 서버**(브라우저 아님).
- 상태코드: 400(잘못된 요청)/201(생성)/500(서버 터짐, catch).
- **route=접수 창구(HTTP) / service=주방(DB 로직)** 레이어 분리 → 재사용·테스트·역할 명확(useCart 창구와 같은 사고).

```ts
// service.ts — 실제 DB + "누가 채우나" 구현 완성
export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const paymentId = crypto.randomUUID()                     // ★ 서버가 payment_id 생성
  const { data } = await supabase.from('purchases').insert({
    ...input, payment_id: paymentId, status: 'pending',     // ★ 서버가 status 세팅
  }).select().single()
  return data as Purchase                                    // 완성본
}
```

→ 지난 세션 "payment_id·status는 서버 몫이라 Omit"한 설계가, **여기서 서버가 실제로 채우며 구현으로 완성.** 입력타입에서 뺀 걸 service가 채워 완성본 Purchase를 만든다.

- `markPurchasePaid`는 **service role(createAdminClient)** 사용 — purchases RLS가 UPDATE를 막아 anon이면 0건만 바뀜. 검증 통과한 신뢰 서버 작업이라 RLS 우회 안전(결제 검증 체인에서 깊게).

---

## 3. ⭐ 실제 DB — numeric vs int4, id 삼형제

### 숫자 타입 두 종류
- `int4` = **정수**(원화 42000, 소수점 X) — quantity·price_krw·total_price
- `numeric` = **소수점 정확**(달러 $5.80) — price_usd
- ⚠️ 돈은 **numeric**, `float` 금지 — float은 `0.1+0.2=0.3000..4` 오차. 돈은 1원도 틀리면 안 됨.

### id / product_id / payment_id — 번호지만 가리키는 게 다름
| | 타입 | 가리키는 것 | 영수증 비유 |
| --- | --- | --- | --- |
| `id` 🔑 | uuid(PK) | 이 주문 레코드 자체 | 영수증 번호 |
| `product_id` | uuid(FK) | 산 상품(products 가리킴) | 적힌 상품번호 |
| `payment_id` | text | 결제 추적(PortOne) | 카드 승인번호 |

- 사과를 10명이 주문 → `id` 10개 다름(주문마다)/`product_id` 10개 같음(같은 사과).

---

## 4. ⭐ 타입 설계

### interface(원본 전체모양) — 서버 것도 **다** 지정
- `Purchase`(완성본)엔 id·payment_id·status도 전부 타입 지정. **왜?** 나중에 **읽을 때** `purchase.payment_id`·`purchase.status`를 쓰니까(없으면 TS가 막음). "누가 채우나"는 **입력 타입(Omit) 만들 때만** 따진다.
- 🚚 Purchase=운송장번호·상태 다 찍힌 완성 송장 / CreatePurchaseInput=보낼 때 적는 칸만.

### Omit 파생(입력 타입)
```ts
Omit<Purchase, 'id' | 'payment_id' | 'status' | 'created_at'>
//    └─타입(따옴표X)  └─뺄 키들(따옴표O, |로 연결)─┘   ← 인자 2개!
```
- **단일 소스·자동 동기화**: Purchase에 필드 추가 → omit 안 하면 입력타입에 자동 포함(따로 안 쓰고 파생하는 이유). 단 **새 필드마다 "누가 채우나" 판단해 omit 관리.**
- ⚠️ **Omit 목록 = "뺄 것 = 사용자 안 보냄".** 사용자 입력시키려면 **빼야**(남아야 포함). 넣으면 제외(이중부정이라 헷갈림).

### "누가 채우나" 휴리스틱
> **사용자 = 구매 내용**(product_id·product_name·quantity·price) / **서버·DB = 주문 꼬리표**(id·payment_id·status·created_at). buyer_*는 사용자 몫이나 지금 폼 없어 임시 Omit(폼 생기면 뺌).

### type vs interface
- **interface** = 객체 원본 모양(`=` 없음): `interface Purchase { }`
- **type** = 뭐든 이름(유니온·Omit 파생): `type X = ...`(`=` 있음)
- 유니온(`PurchaseStatus = 'a'|'b'`)·파생(`Omit<...>`)은 **type 필수**(interface로 못 함).

### number vs string
> **계산하면 `number`, 식별·표기면 `string`.**
- number: quantity·price_krw(계산) / price_usd는 `number | null`(nullable)
- string: buyer_phone·payment_id — 전화번호가 string인 이유 = ①앞자리 0 사라짐(010→10) ②`-` 못 넣음 ③계산 안 함(식별용).

---

## 한 줄 정리 모음

1. 낯선 코드 = 데이터+입구 2앵커. 데이터중심은 DB/타입부터. 3질문(누가채우나·왜있나·누가바꾸나).
2. route.ts=API 접수·2차검증·위임 / service.ts=실제 DB. 서버가 payment_id·status 채움=설계의 구현.
3. int4=정수(원화)/numeric=소수점(달러, 돈은 float 금지). id=주문자체/product_id=상품/payment_id=결제.
4. interface=원본 전체모양(서버 것도 다 지정, 읽을 때 씀)/Omit 파생=입력 타입(사용자 몫만).
5. Omit 목록=뺄 것(안 보냄). 입력시키려면 빼기. 단일 소스라 자동 동기화+새 필드 역할 판단.
6. 유니온·파생=type / 원본 객체=interface(= 없음). 계산=number / 식별·표기=string.
