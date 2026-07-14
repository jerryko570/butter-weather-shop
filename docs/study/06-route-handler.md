# 06. Route Handler — 통로② (클라이언트 ↔ 서버 통신)

> 한 줄: **쓰기(주문 등)는 `fetch`로 서버 주소(`/api/...`)에 요청 → 서버 `route.ts`가 받아 검증·DB저장·응답. 손님(fetch)과 가게(POST)는 한 통화의 양쪽 끝.**
> 상세 흐름 전체는 [[00-flow-map]] · 쓰기 훅은 [[05-mutation]].

---

## 🍔 배달 주문 비유 (전체 그림)

```
손님 (브라우저)  = postPurchase   → 주문 전화 거는 사람
가게 (서버)      = POST 함수       → 주문 전화 받는 사람
주방 (DB)        = createPurchase  → 실제로 만드는 곳
```

```
손님 ──"버터 드롭 2개요!"(편지)──▶ 가게
                                    가게: 봉투 열기 → 검증 → 주방(DB) 저장
손님 ◀──"접수완료! 번호 12345"───── 가게
손님: "번호 받았다!" → 결제하러 감
```

---

## 1. `/api/purchases` = 주소, route.ts = 서버 파일

```
/api/purchases  (URL)  =  src/app/api/purchases/route.ts  (서버 코드)
```
- **Next.js 규칙: 폴더 경로 = URL.** `app/api/purchases/route.ts` → `/api/purchases`.
- `route.ts` 라는 이름 = "이건 API 주소야" 표시.

## 2. `method` ↔ 함수 이름 (창구 매칭)

```ts
// 손님             // 가게
method: 'POST'  →  export async function POST(request) {}
```
- fetch의 `method: 'POST'` = "이 요청은 POST 종류" 라벨 → 서버는 **같은 이름 함수**(`POST`) 실행.
- HTTP 메서드 = CRUD: **GET**(읽기) / **POST**(만들기) / **PUT·PATCH**(수정) / **DELETE**(삭제).
- 한 파일에 GET·POST·DELETE 여러 개 둘 수 있고, method가 어느 함수 부를지 고름.

## 3. postPurchase(손님) ↔ POST(가게) = 한 통화의 양쪽 끝

```
postPurchase (거는 쪽)              POST (받는 쪽)
    │──── fetch(body) ───────────────▶│  요청 받음
    │                                 │  검증 → createPurchase → DB
    │◀─── 응답(res) ──────────────────│  응답 돌려줌
```

### 짝지어지는 것 (포장 ↔ 풀기)
| 손님 (보낼 때) | 가게 (받을 때) |
| --- | --- |
| `JSON.stringify(input)` (객체→문자열 포장 📦) | `request.json()` (문자열→객체 풀기 📭) |
| `NextResponse.json(...)`을 받음 ← | `NextResponse.json(purchase, {status})` (응답 포장) |
| `res.ok` / `res.json()` | (상태코드로 성공/실패 신호) |
| `method: 'POST'` | `export function POST` |

→ **네트워크는 "문자"만 오감** → 보낼 땐 stringify(포장), 받으면 json()(풀기). 포장한 쪽이 있으면 푸는 쪽이 반대편에.

## 4. `request` = 손님이 보낸 봉투

- `POST(request)`의 `request` = 손님(fetch)이 보낸 **요청 전체(봉투)**. 안에 body·headers·method 다 있음.
- 서버(Next.js)가 **자동으로** 건네줌 (내가 안 만듦).
- `await request.json()` = 봉투 열어서 주문 데이터(body) 꺼냄.

## 5. 서버가 하는 일 (route.ts POST 안)

```ts
export async function POST(request) {
  try {
    const body = await request.json()          // ① 봉투 열기

    if (!body.product_id || !body.product_name  // ② 검증 (2차 방어선)
        || !body.quantity || !body.price_krw) {
      return NextResponse.json({ error: '...' }, { status: 400 })  // 빠지면 400
    }

    const purchase = await createPurchase(body) // ③ 주방(서비스)에 위임 → DB insert(pending)

    return NextResponse.json(purchase, { status: 201 })  // ④ 성공 201 + 주문정보
  } catch (error) {
    return NextResponse.json({ error: '...' }, { status: 500 })  // ⑤ 사고 나면 500
  }
}
```

- **② 검증** — `!`(없으면) `||`(또는): 필수 4개 중 하나라도 없으면 400. **왜 또 검증?** = 2차 방어선(프론트 안 거치고 직접 요청할 수도 있으니 서버도 검증). RLS 이중잠금과 같은 원리.
- **③ 위임** — 가게는 DB 직접 안 만짐. `createPurchase`(service)가 실제 `purchases`에 insert. 역할 분리 → 재사용·깔끔.
  - ⚠️ `createPurchase`는 **일반 서버 클라이언트**(anon+쿠키)로 insert. **service role 아님.** service role은 나중 `markPurchasePaid`(결제확정 UPDATE)에서만 — RLS가 UPDATE를 막아서. [[05-mutation]]
- **④⑤ 상태코드** — 201(만들어짐/성공) · 400(잘못된 요청/검증실패) · 500(서버 에러/catch).

---

## 6. 구조 5단계 (커스텀 훅 → API)

```
[1 발사]  const purchase = usePurchase() (배선) → 버튼 클릭 → mutate(데이터)
            → React Query가 배선된 postPurchase(input) 실행
[2 포장]  body: JSON.stringify(input)  객체 → 문자열 📦 → fetch 전송
   ─────── 네트워크 ───────
[3 서버]  method:POST → route.ts의 POST 함수 → request.json() 풀기 📭
            → 검증(2차 방어선) → createPurchase → DB
   ─────── 네트워크 ───────
[4 응답]  res.ok?  실패(400/500)→ {error} 꺼내 throw  /  성공(201)→ res.json() 반환
[5 마무리] React Query → onSuccess(createdPurchase) 실행  /  실패면 isError
```

- **에러 처리 2층:** 서버(route.ts)가 status(201/400/500)를 **정하고**, 클라(postPurchase)가 `res.ok`로 **읽고 반응**(throw/return). 다리 = status 코드.
- **res.json() 두 갈래:** 실패 → `{error}`만 꺼내 throw / 성공 → 통째로 return. 파싱은 둘 다 같음.

---

## 7. ⭐ 4파일 왕복 트레이스 (2026-07-10 복습 콜드 재현)

> page → hook → route → service → supabase → 되돌아오는 전체를 파일 넘나들며 재현.

```
📄 page.tsx              mutate(주문데이터) 발사
      ↓
📄 usePurchase.ts        postPurchase: input 주입 → JSON.stringify → fetch
      ↓ ─── 네트워크 ───
📄 route.ts (POST)       request.json() 풀기 → 2차 검증 → createPurchase(body) 호출
      ↓
📄 purchase.service.ts   createPurchase: createClient()(서버 supabase 리모콘)
                         → supabase.from('purchases').insert(...) → return data (or throw)
      ↑ 결과를 route.ts로 돌려줌 (답장 아님!)
📄 route.ts              NextResponse.json(purchase, 201) ← 여기서 답장 포장 (실패면 catch→500)
      ↓ ─── 네트워크 ───
📄 usePurchase.ts        res.ok? 실패 throw / 성공 return res.json()
      ↓
📄 page.tsx              onSuccess(createdPurchase) → payment.mutate → (결제 성공) 팝업
```

### 헷갈렸던 포인트 (교정)
- **답장(`NextResponse.json`)은 `createPurchase`가 아니라 `route.ts`가 만든다.** createPurchase는 supabase에 insert하고 결과를 route.ts로 **return**만 함. 답장 포장은 route.ts.
- **route.ts엔 supabase가 안 보임** — `createPurchase`에 **위임**하기 때문. 실제 `supabase.insert`는 `purchase.service.ts` 안. (route.ts=접수처 / createPurchase=주방 / supabase=창고, 3층)
- **route.ts = 리액트 아니라 "서버" 코드.** 진짜 접근 보안(누구 것/로그인)은 route.ts가 아니라 **RLS**가 최종으로 지킴. route.ts는 "양식 검증".

---

## 8. ⭐ `createPurchase(body)` — "파싱"이 아니라 "실행" (2026-07-10 복습)

> 헷갈렸던 질문: *"`const purchase = await createPurchase(body)`는 `purchase.service.ts`를 **파싱해서** 결과를 가져오는 건가?"*

### ① 파싱 ❌ → 실행(호출) ⭕ — 딱 한 글자 교정

- **파싱** = 글자를 읽어 구조로 푸는 것. 이 파일에서 진짜 파싱은 위쪽 `request.json()`(문자열→객체)뿐.
- `createPurchase(body)`는 글자를 읽는 게 아니라 **이미 만들어진 함수 안으로 들어가 실행**하는 것. = "야 createPurchase, body 줄게, 네 일 해."

### ② route.ts는 createPurchase를 어떻게 아나? → `import`

```ts
import { createPurchase } from '@/services/purchase.service'  // 맨 위 줄
```
- `import` = 코드 복사가 아니라 **연결선 걸어두기**. (주방에 **인터폰 연결**)
- 그래서 아래에서 **이름만 부르면** 실행됨. `createPurchase(body)` = 인터폰으로 "2번 테이블 주문이요!" 외치기.

### ③ 엔진이 31줄을 만났을 때 실제 순서 (점프 → 실행 → 복귀 → 담기)

```
const purchase = await createPurchase(body)
   ① 점프    → purchase.service.ts의 createPurchase 안으로 "들어감"
              (함수 "선언을 읽고 끝"이 아니라, 본문을 한 줄씩 실행)
   ② 실행    → crypto.randomUUID() → supabase.insert(pending) → return data
   ③ await   → return 나올 때까지 잠깐 멈춰서 대기
   ④ 복귀    → 돌아온 data가 purchase 변수에 담김   ← 여기서 31줄 끝!
```

### ④ ★ 받기(31줄) ≠ 포장(37줄) — 서로 다른 줄

```ts
const purchase = await createPurchase(body)          // 31줄: 결과를 purchase에 "담기"까지
return NextResponse.json(purchase, { status: 201 })  // 37줄: 담은 걸 "포장해 보내기"
```
- createPurchase가 결과를 **곧바로 NextResponse에 넘기는 게 아님.**
- ① 결과가 먼저 `purchase` **상자(변수)에 담기고** → ② 그다음 줄에서 그 상자를 `NextResponse.json()`이 **포장해서** 손님에게 배송.
- 중간에 `purchase`라는 **택배 상자를 한 번 거친다.**

### ⑤ 돌아오는 "결과값"의 정체 (실DB 확인)

`createPurchase` 안 `.insert(...).select().single()` → `return data`
= 방금 `purchases`에 저장된 **주문 1건**(DB가 채운 `id`·`created_at` + `payment_id`까지 붙은 완성 행). 이게 `purchase`에 담기는 값.

```
주방(service) 접시 내줌 → 창구(route)가 purchase에 받아둠 → 포장지(NextResponse)에 싸서 손님에게
```

---

## 9. ⭐ 타입 vs 객체 — `Request`(대문자) ≠ `request`(소문자) (2026-07-13 복습)

> 헷갈렸던 질문들: *"`Request` 타입이 객체 데이터야?"* / *"`Request` 객체는 타입인거야?"*
> 원인: `Request`(타입)와 `request`(객체)를 "Request 객체"로 뭉뚱그려 부른 것.

### ① 대소문자로 갈린다 — 이 규칙 하나면 안 헷갈림

```
Request  (대문자)  =  타입 (설계도)      ← 붕어빵 "틀".  실행되면 사라짐.
request  (소문자)  =  객체 (실제 데이터)  ← 진짜 "붕어빵". .json() 실행됨.
```

```ts
request : Request
  ↑          ↑
객체(물건)   타입(설계도)
소문자      대문자
```
- `string` 타입 ↔ `"안녕"` 값 / `number` 타입 ↔ `3` 값과 **똑같은 관계**.
- "**Request 객체**"라는 말 = "Request **타입 모양을 한** 객체(=소문자 `request`)"를 줄인 표현일 뿐. 타입 자체가 객체란 뜻 아님.

### ② 설계도는 어디 있나 → 실제 파일로 확인함

```
📁 node_modules/typescript/lib/lib.dom.d.ts   26120번째 줄
interface Request extends Body { headers, method, json()... }
```
- `interface` = 설계도 쓰는 문법 (모양·목록만, 실제 값 없음).
- `.d.ts` = **d(declaration=선언)**, 설계도 전용 파일 (실행 코드 0줄).
- TypeScript **기본 내장** → 그래서 `route.ts`에서 `import` 없이 `Request` 씀.
- 주석의 `MDN Reference` = **웹 표준** 증거 (Next.js가 만든 거 아님. fetch/Response와 한 세트).

### ③ 타입은 실행되면 사라진다 (= 데이터가 아니라는 결정적 증거)

```ts
POST(request: Request)   // 개발 중 (TypeScript) — 타입이 오타·자동완성 도와줌
        ↓ 빌드(컴파일)
POST(request)            // 실제 실행 (JavaScript) — Request 사라짐! 남는 건 객체 request뿐
```

### ④ 매개변수 `request` = "저장"이 아니라 "받는 손(주입)"

- `POST(request: Request)`의 `request` = 요청을 **받는 빈 자리(손)**. 저장 창고 아님.
- Next.js가 요청 올 때마다 HTTP 데이터를 `Request` 객체로 포장 → **POST 실행하는 순간 그 손에 쥐어줌(주입)**.
- 요청 100개 = POST 100번 실행 = 매번 **다른** 객체가 그 자리에 들어옴 → 손님 주문 안 섞임. (한 곳에 저장이면 섞임)

### ⑤ 이름 바꿔도 되나? — 별명 vs 규격

| | 바꿔도 됨? | 왜 |
| --- | --- | --- |
| `POST` (함수 이름) | ❌ | Next.js가 정한 **규칙** (밖에서 이 이름을 찾음) |
| `request` (매개변수 이름) | ✅ | 내 함수 안 **별명** (`req`로 바꿔도 됨, 단 본문도 같이) |
| `Request` (타입 이름) | ❌ | **웹 표준 규격** 이름 |

→ **소문자=물건/별명(내 맘대로), 대문자=설명서/규격(정해짐).**

### ⑥ 포장 ↔ 풀기는 "다른 파일·다른 주어"

```
📄 usePurchase.ts (훅=손님)                📄 route.ts (서버=가게)
body: JSON.stringify(input) 📦 ──네트워크──▶ await request.json() 📭
   브라우저가 실행 (부치기)                    서버가 실행 (뜯기)
```
- `request.json()`은 **브라우저가 쏘는 게 아니라, 서버가 (이미 도착한 봉투를) 여는 것**. → route.ts(서버 파일) 안에 있는 게 증거.
- 부치기(fetch·과거·브라우저) ≠ 뜯기(json()·서버). 다른 사람, 다른 시점.

---

## 10. ⭐ `await request.json()` 뜯어보기 — 인자·body·await (2026-07-14 복습)

> 헷갈렸던 질문 3개: *"왜 `request.json(input)`이 아니고 `request.json()`이야?"* / *".json()은 body만 푸는 거야?"* / *"`await`는 왜 붙어?"*

### ① 왜 인자가 없나 → 대상이 이미 `request` 안에 있음

```ts
request.json()        // 인자 없음
JSON.stringify(input) // 인자 있음
```
- **점(`.`) 앞이 이미 대상.** `request.json()` = "request **자기** 안의 body를 풀어" → 밖에서 줄 게 없음.
- 반대로 `stringify(input)`은 "**뭘** 포장할지" 밖에서 줘야 해서 인자 필요.

| | 대상 위치 | 인자 |
| --- | --- | --- |
| `JSON.stringify(input)` | 괄호 안(밖에서 줌) | 필요 ✅ |
| `request.json()` | 점 앞 request 안 | 불필요 ❌ |

- 비유: `stringify(input)`="이 반찬 담아줘"(반찬 줌) / `request.json()`="이 도시락 뚜껑 열어"(도시락은 이미 손에).
- `"안녕".length`가 "안녕"의 길이인 것과 같음 — **점 앞이 대상.**

### ② `.json()`은 `body`만 푼다

```
request ├─ method  'POST'   ← .json() 안 건드림 (그냥 request.method)
        ├─ headers {...}    ← .json() 안 건드림 (request.headers.get())
        └─ body    "{...}"  ← .json()은 "이것만" 문자열→객체 ✅
```
- body만 "포장된 문자열"이라 풀어야 함. method·headers는 포장 안 돼 그냥 씀.

### ③ `await` = "결과 나올 때까지 기다렸다 받아"

- `request.json()`은 결과를 **즉시 안 주고 "약속(Promise=교환권)"**부터 줌 (body가 아직 네트워크로 들어오는 중일 수 있어서).
- `await` 없으면 → 교환권이 `body`에 담김 🐛 / `await` 있으면 → **완성된 객체**가 담김 ✅
- 비유: 붕어빵 주문 → `await` 없으면 번호표만 받음 📄 / `await`면 다 구워질 때까지 기다렸다 진짜 붕어빵 🍞.

```ts
await request.json()        // 봉투 열기 (body 수신 중일 수 있음)
await createPurchase(body)  // DB 저장 (창고 왕복)
await fetch(...)            // 네트워크 왕복 (제일 오래)
```
→ **네트워크·DB·파일 = "밖에 다녀오는 일" = 시간 걸림 → 전부 `await`.**

---

## 11. ⭐ 돌아오는 길 — `res` / `res.json()` / 왕복 포장 2세트 (2026-07-14 복습)

> 헷갈렸던 질문들: *"res엔 fetch 데이터가 담기는 거 아냐?"* / *"request.json()으로 이미 객체로 바꿨는데 왜 또 res.json()?"* / *"NextResponse.json()이 data랑 status 둘 다 문자열로 만들어?"*

### ① `res` = fetch의 **반환값(응답)**, 넣은 인자 아님

```ts
const res = await fetch('/api/purchases', { method, headers, body })
//    ↑                  └──── 넣는 것(인자) ────┘
//  나오는 것(반환값=서버 응답)
```
- 일반 원칙: `const 변수 = 함수(인자)` → 변수엔 **반환값**이 담김 (인자 ❌).
- 자판기 비유: `음료 = 자판기(동전)` → 음료엔 "나온 음료"지 "넣은 동전" 아님.
- **넌 이미 이 패턴 봤음**: `const purchase = await createPurchase(body)` → purchase엔 body가 아니라 **return된 data**. fetch도 똑같음.
- `fetch(주소, 설정객체)` = 인자 2개. body는 나가는 것(→), res는 돌아오는 것(←). **서로 다른 물건.**

### ② `res.json()` = 서버 응답 봉투 열기 (`request.json()`과 완전 대칭)

```
서버:   const body = await request.json()   손님이 보낸 봉투 열기
손님:   const data = await res.json()        서버가 보낸 봉투 열기
              ↑ 똑같은 .json(), 방향만 반대
```
- `res.ok`(겉면·상태코드) = **안 열어도** 봄 / `res.json()`(속·알맹이) = **열어야** 봄.

### ③ 왜 객체로 꺼내? → 코드는 객체라야 값을 꺼냄

- 네트워크는 **문자열만** 나름 → 도착하면 문자열(통째 글자 덩어리) → `.error`·`.id` 못 꺼냄.
- `res.json()`으로 **객체**로 풀어야 → `const {error}`, `data.id`처럼 칸칸이 꺼내 씀.
- 양쪽 끝 규칙: **보낼 때 객체→문자열(stringify), 쓸 때 문자열→객체(json()).** 코드=객체, 네트워크=문자열.

### ④ ★ 왜 request.json() 했는데 또 res.json()? → 네트워크 **2번** 건넘 = 포장/풀기 **2세트**

```
📄 usePurchase  ① 객체→문자열  JSON.stringify(input)     ← 포장 #1
   ─── 네트워크(가는 길) ───
📄 route.ts     ② 문자열→객체  request.json()            ← 풀기 #1
                ③ 검증·createPurchase (서버 안에선 객체로 일함)
                ④ 객체→문자열  NextResponse.json(data)   ← 포장 #2 ★또 문자열됨!
   ─── 네트워크(오는 길) ───
📄 usePurchase  ⑤ 문자열→객체  res.json()                ← 풀기 #2
```
- **②에서 만든 객체는 서버 안에서만 삶** — 네트워크(국경) 못 건넘. 객체는 그 나라 안에서만 사는 값.
- 돌려보내려면 `NextResponse.json()`이 **다시 문자열로 포장**(④) → 손님이 받아 **또 풀어야(res.json)**.
- 국경 비유: 객체=풀어헤친 짐(국경 못 넘음), 문자열=트렁크에 싼 짐. **건널 때마다 싸고, 도착하면 품. 왕복이면 2세트.**

### ⑤ `NextResponse.json(내용물, {status})` — 내용물만 문자열, status는 겉면

| | 어떻게 | 손님이 보는 법 |
| --- | --- | --- |
| ① 내용물 (`purchase`/`{error}`) | **문자열로 포장** → body | `res.json()` **열어야** |
| ② `{status}` | 문자열 안 됨 → 봉투 **겉면(운송장)** | `res.ok`/`res.status` **안 열어도** |
- 왜 나눔? status(성공/실패)는 **빨리** 판단해야 하니 겉면에 → 안 열고 `res.ok`로 즉시 봄.

### ⑥ `const { error } = await res.json()` — 한 줄에 두 동작

```
① await res.json()  : body 전체 문자열 → 객체로 변환
② const { error }   : 그 객체에서 error 칸만 꺼냄 (구조분해)
```
- 변환 대상 = "에러 문자"가 아니라 **body 전체**. 꺼낸 `error`는 결국 **문자열 메시지**.
- 구조분해는 **객체라야** 됨 → ①(객체로 변환)이 먼저여야 ②(칸 꺼내기) 가능. 순서 중요.

---

## 🔑 오늘의 핵심 한 줄
**`fetch('/api/purchases', {method:'POST', body:stringify(input)})`(손님) → `route.ts`의 `POST(request)`가 받아 `request.json()`으로 풀기 → 검증(2차 방어선) → `createPurchase`에 위임해 DB insert → `NextResponse.json(purchase,201)` 응답. 손님·가게는 한 통화의 양쪽 끝, 포장(stringify)↔풀기(json())로 대화.**

---

## ▶ 다음에 여기서 시작
- 돌아오는 길 **거의 완료** (섹션 11): `res` 응답 담김 → `res.ok`로 성공/실패 갈림 → 실패 `res.json()`으로 error 꺼내 `throw` / 성공 `res.json()` 반환.
- **마지막 1조각**: `postPurchase`가 `throw`/`return`한 다음 → **React Query가 `onError`(에러 표시) / `onSuccess`(결제창)로** 넘기는 곳. (page.tsx의 mutate 콜백)
- 그다음: `createPurchase` 서비스 안(payment_id 생성, insert)과 결제 검증(`markPurchasePaid`, service role) 흐름.
