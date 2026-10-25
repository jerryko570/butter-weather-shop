# 32. 화면↔코드 매핑 + 읽기 vs 쓰기 경로 + 훅/service + 자동API vs 우리API + REST/PostgREST 번역 체인

> 한 줄: **화면 값(상품명·수량·총액)은 mutate에 그대로 담긴다 — UI도 mutate도 같은 출처(product=Supabase + quantity=useState)를 써서. key=타입 필드명(product_id)/value=product.id(FK 네이밍). 읽기(useProduct)는 Supabase 직접(= 우리가 짠 API 없이 Supabase 자동 API 호출), 쓰기(usePurchase)는 훅→우리 API(route)→service→DB — 돈·보안이 서버 로직 필요해서. 훅(컴포넌트가 씀)≠service(API가 부르는 서버함수). supabase-js가 쿼리체인→REST 요청으로, Supabase 서버의 PostgREST가 REST→SQL로 번역(2단계).**
> 입구/mutate체인 [[31-entry-point-mutate-chain-createdpurchase]] · route/service·누가채우나 [[30-reading-unfamiliar-code-route-service-type-design]] · 쿼리체인 [[25-supabase-read-query-chain]] · CLAUDE.md "상품=supabase직접/결제=Route Handler"

---

## 1. ⭐ 화면 ↔ 코드 매핑 (UI 값이 mutate에)

| 화면 | mutate 필드 | 출처 |
| --- | --- | --- |
| 제목 "솜사탕 목걸이" | `product_name` | `product.name` |
| 수량 selector "1" | `quantity` | `quantity` (useState) |
| TOTAL ₩29,000 | `price_krw` | `product.price_krw * quantity` |
| (안 보임) | `product_id` | `product.id` |

- **mutate가 화면 픽셀을 긁는 게 아님** — 화면도 mutate도 **같은 출처**를 씀: `product`(Supabase, useProduct로 읽음) + `quantity`(useState, 사용자 입력). 그래서 화면 값=보내는 값 일치.
- `product.*` = Supabase 데이터(읽기) / `quantity` = 사용자 입력. **읽기(useProduct)가 쓰기(mutate)의 재료로 흘러들어감** — 두 흐름이 handlePurchase에서 만남.

---

## 2. ⭐ key vs value + 왜 product_id (not id)

```ts
product_id: product.id
└───┬───┘  └────┬────┘
 key=CreatePurchaseInput 필드명   value=product에서 꺼냄
```

- **key는 타입(CreatePurchaseInput) 필드명에 맞춰야** 서버가 받음. `id`로 쓰면 "주문 자체 id"라 틀림(게다가 Omit돼서 못 보냄).
- **왜 product_id**: id 삼형제 — purchases의 `id`=주문자체 / `product_id`=산 상품. `product` 객체는 자기 id를 `id`라 부르지만, purchase가 참조할 땐 `product_id`(FK 네이밍 `<테이블>_id`).
- **trackEvent는 반대** — 분석용이라 key **자유**(타입 강제 X). mutate는 타입 강제(서버 저장), trackEvent는 "분석에 남길 것" 내 맘대로. 지금 비슷한 건 우연. (신청서 vs 가계부 메모)
- buyer_*는 **임시 Omit**(주문 폼 없어서 '테스트 구매자' 하드코딩, 폼 생기면 뺌) — id·payment_id·status(영구 omit)와 이유 다름.

---

## 3. ⭐⭐ 읽기 vs 쓰기 경로 — 핵심 아키텍처

```
읽기(상품): useProduct(훅) → supabase.from('products')  [Supabase 직접] → products
            (우리가 짠 API·service 안 거침)

쓰기(주문): handlePurchase → usePurchase(훅) → fetch /api/purchases → createPurchase → purchases
                                              └─우리 API(route)─┘  └─service─┘
```

| | 읽기(useProduct) | 쓰기(usePurchase) |
| --- | --- | --- |
| 우리 API route | ❌ 안 거침 | ✅ 거침 |
| service | ❌ | ✅ |
| 왜 | 공개 상품(RLS 안전), 비밀키 X | payment_id 생성·status 통제·검증, 서버만 |

- **순서**: 쓰기 = `훅 → API route(서버 입구) → service(route가 호출) → DB`. **API가 먼저, 그 안에서 service 부름**(service→API 아님).
- **왜 다른가**: 읽기는 anon 키로 브라우저가 직접 해도 안전(RLS가 공개 상품만). 쓰기(돈)는 서버에서만 할 일(위조 방지·검증) → API route 거침.
- 📌 CLAUDE.md 최초 원칙 그대로: "상품=supabase 직접(API 안 짬) / 결제·주문=Route Handler(API 짬, 시크릿 키 필요한 것만)".

---

## 4. ⭐ 훅(Hook) ≠ service 레이어

| | 훅 | service |
| --- | --- | --- |
| 예 | useProduct·usePurchase·usePayment | createPurchase·getPurchaseByPaymentId |
| 어디서 | **컴포넌트**(page)가 씀 (React 훅, `use~`) | **API route**가 부름 (서버 함수) |
| 역할 | 컴포넌트↔서버 다리 | API↔DB 일꾼 |

- "서비스 레이어 훅"은 섞인 말 — 훅과 service는 **다른 레이어**.
- products↔useProduct(읽기 훅) / purchases↔usePurchase→API→service(쓰기). purchases 읽기는 getPurchaseByPaymentId(검증)·useAdminOrders(어드민)에서.

---

## 5. ⭐ 자동 API vs 우리가 짠 API

| | Supabase 자동 생성 API | 우리가 짠 API |
| --- | --- | --- |
| 뭐 | 테이블 위에 자동 생성된 REST API | Next.js Route Handler |
| 예 | `supabase.from('products')` | `/api/purchases` (route.ts) |
| 우리가 코드 씀? | ❌ (supabase-js가 감쌈) | ✅ |

- `supabase.from()`도 **Supabase API를 쓰는 것**(DB 맨손 아님). "API 안 짬"=**우리가 API 코드를 안 쓴다**(자동 API 사용), API가 아예 없는 게 아님.
- 차이 = **우리가 만든 API(route)가 중간에 있냐 없냐**. 읽기=없음(supabase 바로)/쓰기=있음(route).
- 🏧 자동 API=ATM(이미 있음) / 우리 API=우리가 세운 창구(검증·서류).

---

## 6. ⭐⭐ REST API + 번역 2단계

- **REST API** = HTTP(URL+메서드)로 통신하는 웹 API. 메서드=CRUD:
  - GET(읽기)·POST(생성)·PATCH/PUT(수정)·DELETE(삭제). ← `fetch('/api/purchases', {method:'POST'})`가 이미 REST!
- supabase-js가 동작에 맞는 메서드 자동 선택: `.select()`→GET, `.insert()`→POST, `.update()`→PATCH, `.delete()`→DELETE.

### 번역이 2단계 — 누가 뭘

```
① .from('products').select().eq()   [쿼리체인, JS]
     ↓ supabase-js(클라)가 번역
② GET /rest/v1/products?select=*&slug=eq.xxx  [REST 요청, HTTP]
     ↓ await 발사 → Supabase 서버 도착
③ Supabase 서버의 PostgREST가 번역
     ↓
④ SELECT * FROM products WHERE slug='xxx'  [SQL]
     ↓ PostgreSQL 실행 → 데이터
```

| 번역 | 누가 | 뭐→뭐 |
| --- | --- | --- |
| ①→② | **supabase-js**(클라) | 쿼리체인 → REST 요청 |
| ③→④ | **Supabase 서버(PostgREST)** | REST 요청 → SQL |

- **SQL 번역은 supabase-js가 아니라 Supabase 서버(PostgREST)**가 함. supabase-js는 "REST 요청까지".
- **PostgREST** = 테이블 보고 REST API 자동 생성 + REST→SQL 번역하는 서버 도구(그래서 테이블만 만들면 API가 공짜).
- 노트 25 정밀화: "쿼리체인→SQL"이 아니라 **쿼리체인→(supabase-js)→REST→(PostgREST)→SQL**.
- 🏢 supabase-js=한국어→영어 통역(클라) / PostgREST=영어→주방전표(SQL) 접수(서버).

---

## 한 줄 정리 모음

1. 화면 값=mutate 값(같은 출처 product+quantity). product=Supabase(읽기)·quantity=useState(입력) → mutate 재료로 합류.
2. key=타입 필드명(product_id, FK네이밍)/value=product.id. trackEvent는 분석용이라 key 자유, mutate는 타입 강제.
3. 읽기=Supabase 직접(우리 API X)/쓰기=훅→우리API(route)→service→DB. 읽기 안전(RLS)·쓰기 보안(서버로직) 차이.
4. 훅(컴포넌트가 씀)≠service(API가 부르는 서버함수). 다른 레이어.
5. supabase.from()도 Supabase 자동 API 호출. "API 안 짬"=우리 코드 안 씀. 차이=우리 API(route) 유무.
6. REST=HTTP+메서드(CRUD). 번역 2단계: supabase-js(쿼리체인→REST) / PostgREST(REST→SQL). SQL번역은 서버가.
