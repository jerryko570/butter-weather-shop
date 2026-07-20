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

## 12. ⭐ `createPurchase` = "기계 한 대" + 세 곳이 똑같은 모양 (2026-07-15 복습)

> 헷갈렸던 질문: *"route.ts는 왜 여기서 `createPurchase`를 부르지?"* → 원인은 위임/재사용 개념이 아니라, **`createPurchase`가 뭔지**가 아직 안 잡혀서였음. 그래서 "기계" 그림부터 다시.

### ① `createPurchase` = 일 하나 하는 기계 (이름 그대로)

```
create  Purchase   =  구매를  만드는  기계
만들다   구매
```

```
        ┌─────────────────────────┐
body →  │     createPurchase       │  → 저장된 주문 1건
(주문)   │  (DB에 insert 하는 기계)  │    (id·payment_id 붙은 완성본)
        └─────────────────────────┘
        넣는 것                        나오는 것
```
- **넣는 것** = `body`(손님 주문) / **하는 일** = supabase `insert` / **나오는 것** = 저장된 주문(`return data`).

### ② route.ts 한 줄 = "기계에 넣고 → 나온 걸 담기"

```ts
const purchase = await createPurchase(body)
//    ↑ 나온 것        ↑ 기계 켜기      ↑ 넣는 것
```

### ③ ★ 세 곳이 전부 **똑같은 모양** (`const 변수 = 함수(인자)`)

```ts
const purchase = usePurchase()               // 넣는 것 없음 → 나온 꾸러미 담기
const res      = await fetch(주소, 설정)       // 주소·설정 넣기 → 나온 응답 담기
const purchase = await createPurchase(body)   // body 넣기 → 나온 주문 담기   ← 똑같은 모양!
```
- 이름·역할만 다를 뿐 **전부 "넣고 → 나온 걸 변수에 담기"** 한 패턴. (섹션 11 ①의 `const 변수 = 함수(인자)` 원칙과 같음)
- 그래서 "route가 왜 부르지?"의 답 = route는 검증까지만 하고, **DB 넣는 일은 createPurchase 기계에 넘겨(위임)** 나온 결과를 `purchase`에 담는 것.

---

## 13. ⭐ `createPurchase` 기계 안 — 한 줄씩 (crypto·insert·쿼리체인) (2026-07-15 복습)

> 섹션 12에서 "createPurchase = 기계 한 대"를 잡았으니, 이번엔 그 **기계 안**을 한 줄씩 열어봄.

### ① `const paymentId = crypto.randomUUID()` — 고유번호 뽑기

```
crypto . randomUUID ()
  🧰      🔧         ⚡
 상자    안의 함수    켜기
```
- **`crypto`** = 브라우저·서버 내장 **도구상자** 🧰 (함수 아님! `Math`처럼 원래 있는 것). 혼자 `crypto()` 못 켬.
- **`.randomUUID()`** = 상자 **안의 함수** ⚡. `()` 켜면 → **세상에 하나뿐인 랜덤 고유 아이디** 나옴 (`"a3f8c1e2-..."`).
- **구분 팁: 뒤에 `()`가 붙는 게 함수.** `crypto`(상자, () ❌) / `randomUUID()`(함수, () ⭕).
- 이건 **손님이 보낸 값이 아니라 서버가 발급하는 값** — 접수 순간 서버가 직접 번호표를 뽑음.

### ② `.insert({ key: value })` — DB 칸에 값 넣기

```ts
.insert({
  payment_id: paymentId,        // DB 칸이름 ← 넣을 값(방금 뽑은 변수)
  product_id: input.product_id, // DB 칸이름 ← 손님이 보낸 값
  status:     'pending',        // DB 칸이름 ← 고정값 "결제대기"
})
```
- **왼쪽(key) = DB 칸 이름** — 실제 `purchases` 테이블 컬럼과 **글자가 똑같아야** 저장됨(오타 시 에러). DB 스키마가 정함(못 바꿈).
- **오른쪽(value) = 넣을 값** — 내 변수/입력값. 
- ⚠️ **왼쪽·오른쪽은 다른 이름:** `payment_id`(snake_case, DB 칸) ≠ `paymentId`(camelCase, JS 변수). 헷갈리지 말 것.
- `insert({...})`의 `{ }` 하나 = **DB `purchases` 테이블의 한 줄(행).**
- 실DB 확인(2026-07-15 Schema Visualizer): `purchases` 맨 아래 `payment_id text`(nullable, 유니크 인덱스) 칸에 이 값이 들어감.

### ③ `.select().single()` — 넣은 걸 도로, 객체 하나로

```
supabase . from('purchases') . insert({...}) . select() . single()
  🎛️          어느 테이블         이 데이터        도로 줘    한 줄로
```
- **`.from('purchases')`** = 어느 테이블? (products·orders 여럿 중 지정)
- **`.insert({...})`** = "저장(넣기)" — DB에 새 줄로 넣음. (전송 ❌, 저장 ⭕)
- **`.select()`** = **넣은 줄을 도로 받기.** insert만 하면 "완료"만 주고 뭘 넣었는진 안 줌. `.select()`가 있어야 **DB가 자동 생성한 값**(`id`, `created_at`)까지 붙은 완성본을 받음.
- **`.single()`** = 배열 벗기고 **객체 하나로.**
  ```
  .select()          → [{ id, payment_id, ... }]   ← 배열 (여러 줄일 수 있어서)
  .select().single() →  { id, payment_id, ... }    ← 객체 (알맹이만)
  ```
  객체라야 나중에 `data.id`로 바로 꺼냄 (배열이면 `data[0].id`로 번거로움).

### ③-1 ⭐ 왜 점(.)으로 이어붙여야 하나 — "주문서 한 장"

> 헷갈렸던 질문: *"각각 왜 필요한지는 알겠는데, **왜 하필 체인으로** 이어야 하지?"*

- `.from()`·`.insert()`·`.select()`·`.single()`은 **각각 따로 DB에 갔다 오는 게 아님.** **한 장의 주문서에 조건을 하나씩 덧붙이는** 것. 마지막 `await`가 완성된 주문서를 DB로 **딱 한 번** 발송.
  ```
  supabase
    .from('purchases')   // 주문서: "테이블은 purchases"   (아직 발송 X)
    .insert({...})       // 추가: "이 데이터 넣어"          (아직 발송 X)
    .select()            // 추가: "넣은 거 돌려줘"          (아직 발송 X)
    .single()            // 추가: "객체 하나로"            (아직 발송 X)
  // ── await가 이 완성된 주문서를 DB로 한 번 발송 ⚡ ──
  ```
- **원리:** 각 `.메서드()`는 결과가 아니라 **"조건이 더 담긴 주문서 자신"을 반환** → 그래서 뒤에 또 `.` 찍어 이어붙일 수 있음. (문장 만들기: "나는"+"밥을"+"먹는다"를 점으로 이음)
- **왜 따로 못 쓰나:** `.select()`는 "**방금 insert한 그 줄**을 돌려줘"라는 뜻 → insert와 select는 **같은 주문**에 대한 얘기라 한 몸. 떼면 "뭘 select해?"가 되어 별개 주문이 됨(말 안 됨).
  ```
  ❌ 따로:  .insert({...})  // 넣기만
            .select()       // ← "방금 그거"가 뭔지 모름! 끊김
  ✅ 체인:  .insert({...}).select().single()  // "넣고→방금 그거→객체로" 하나의 명령
  ```

### ④ 결과 받기 — `const { data, error }`

```ts
const { data, error } = await supabase.from(...).insert(...).select().single()
```
- 결과는 한 번 받으면 안 바뀜 → `const`. 나온 걸 그 자리서 `{ data, error }`로 쪼개 받음(구조분해).
- 성공 → `error = null`, `data`에 완성된 주문 1건. 실패 → `error`에 supabase 에러.
- 다음 줄 `if (error) throw error` → 에러면 **날 부른 route.ts로 던짐**(500은 route의 catch가 붙임). 성공이면 `return data`.

---

## 14. ⭐ insert 값의 출처 3종류 + 문지기 통과값만 insert + 실DB 확인 (2026-07-15 복습)

> 헷갈렸던 질문: *"사용자가 UI에서 수량·이름 체크한 데이터를 supabase에 직접 전송하는 거야?"* / *"검증된 값이 insert에 들어가는 거지?"*

### ① insert 값은 3종류 — 전부 사용자한테서 오는 게 아님

```ts
.insert({
  payment_id:   paymentId,          // 🟦 서버가 만듦 (crypto.randomUUID())
  product_id:   input.product_id,   // 🟩 사용자 (UI에서 선택)
  product_name: input.product_name, // 🟩 사용자
  quantity:     input.quantity,     // 🟩 사용자 (수량 체크값)
  price_krw:    input.price_krw,    // 🟩 사용자
  price_usd:    input.price_usd,    // 🟩 사용자
  total_price:  input.price_krw,    // 🟦 서버가 정함 (input으로 계산)
  status:       'pending',          // 🟦 서버가 박은 고정값
})                                   // + id·created_at = 🟨 DB 자동 생성
```
- **🟩 `input.___`** = 사용자 값 (page.tsx의 `mutate({...})`에서 출발).
- **🟦 서버 값** = `payment_id`(랜덤 발급)·`status:'pending'`·`total_price`. 사용자가 못 건드림.
- **🟨 DB 자동** = `id`·`created_at`. 코드에 안 썼는데 DB가 채움 → `.select()`로 도로 받아야 앎.
- **★ 왜 나눔 = 보안.** `status`를 사용자가 보내게 하면 `status:'paid'`로 조작해 **공짜 결제완료** 가능. 그래서 **돈·상태·고유번호는 서버가 박음** 🔒.

### ② 사용자 → supabase "직통 아님". page→hook→route→service 릴레이

```
🧑 page.tsx      purchase.mutate({ quantity, ... })   ← 사용자 값 출발
📄 usePurchase   postPurchase(input) → fetch          ─ 네트워크 ─
📄 route.ts      request.json() → 🚪검증 → createPurchase(body)
📄 service       .insert({ ...input, +서버값 }) → supabase
🗄️ DB
```
- 이 줄의 `input.quantity`를 거슬러 가면 = page.tsx에서 사용자가 `mutate`에 넣은 값.
- 사용자가 DB에 직접 못 쏨 — 반드시 **route.ts(검증)** 거침.

### ③ 🚪 문지기 — 통과한 `body`만 insert까지 감

```ts
const body = await request.json()
if (!body.product_id || !body.product_name
    || !body.quantity || !body.price_krw) {
  return NextResponse.json({error}, {status:400})   // ✋ 하나라도 없으면 여기서 끊김
}
const purchase = await createPurchase(body)          // ✅ 통과한 body만 → insert
```
- **검증과 insert는 같은 `body`** — 검증한 그 값을 그대로 `createPurchase(body)`에 넘김.
- 실패 → 400으로 끊겨 insert 못 감 / 통과 → insert엔 **필수 4개 다 있는 body**만 도달.
- ⚠️ 이 검증은 **"있냐/없냐"(`!`=없으면)만** 봄. "수량 999가 말이 되나" 같은 **내용 검사는 안 함** — 최소 방어선.

### ④ 실DB 확인 (2026-07-15, service role로 조회)

`purchases` 최신 5건 실측 → 코드가 진짜로 반영됨:
- `payment_id`가 전부 **다른 UUID**(`edec2c2e-...` 등) → "안 겹치는 고유번호" 실제로 지켜짐 ✔
- `status`가 `pending`/`cancelled`만 (아직 `paid` 없음 = 결제완료까지 간 진짜 주문 없음, 다 테스트) ✔
- 코드에 안 쓴 `id`·`created_at`이 채워져 있음 = DB 자동값 ✔

### ⑤ ★ 순서 = DB 스키마(설계도) 먼저 → service(주문서)가 거기 맞춤

> 깨달음: *"처음에 DB 스키마 설정한 다음, service를 거기 맞춰서 작업하는 거구나?"* → 맞음.

- **DB 스키마 = 진실의 기준(source of truth).** 칸 이름·타입·규칙을 DB가 먼저 정하고, service의 insert는 그걸 어기면 안 됨(어기면 저장 자체가 거부됨).
- service가 스키마에 맞춰야 하는 3가지:
  1. **칸 이름 일치** — `payment_id`(오타 `paymentId` 쓰면 "그런 칸 없음" 에러)
  2. **타입 일치** — `price_krw`는 `int4` → 정수 넣어야 함 (그래서 "가격은 원 단위 정수")
  3. **제약 지키기** — `payment_id` 유니크·`product_id` NOT NULL → ★ **문지기 검증(③)이 이 NOT NULL을 미리 지키려는 것**
- 빌드 순서와 연결: `① 스키마 → ② 어드민(쓰기) → ③ 사이트(읽기) → ④ 결제(쓰기)` — ②③④가 전부 ①에 맞춤. **설계도가 흔들리면 그 위에 지은 게 다 무너지므로 "토대 먼저".**

---

## 15. ⭐ RLS — 클라이언트 2종류 + insert 프리패스/update 차단 + 정책 SQL 읽기 (2026-07-15 복습)

> 질문 흐름: *"insert도 purchases RLS를 거치는 거지?"* → 맞음. 실제 정책(`purchases_insert_anyone`)까지 DB에서 직접 찾아 읽음. RLS 상세는 [[03-rls]], 쓰기 흐름은 [[05-mutation]].

### ① 클라이언트 2종류 → RLS 거침 vs 우회 (`purchase.service.ts`)

| 함수 | 동작 | 클라이언트 | RLS |
| --- | --- | --- | --- |
| `createPurchase` | insert | `createClient()` (서버 일반, anon+쿠키) | ✅ **거침** |
| `getPurchaseByPaymentId` | select | `createClient()` | ✅ 거침 |
| `markPurchasePaid` | update | `createAdminClient()` (service role) | 🔓 **우회** |

- **insert·select** = 일반 클라이언트로 RLS 문을 **거쳐서 통과**.
- **update(결제확정)** = RLS가 막아서 일반 클라로는 거부됨 → **service role로 우회.** 비밀키(`SUPABASE_SERVICE_ROLE_KEY`)는 서버만 앎(브라우저 X).

### ② 왜 insert는 열고 update는 잠갔나 — 돈 기준

```
insert (주문 생성) → 누구나 OK   (게스트도 주문해야 하니까. 생기는 건 pending 줄 하나, 돈 안 움직임)
update (paid로 변경) → 잠금       (결제 상태 = 돈. 아무나 바꾸면 공짜 결제 조작 가능 🔒)
```
- 진짜 방어선은 "돈이 움직이는 곳"(update)에 있음. insert가 열려도 가짜 주문은 pending으로 쌓일 뿐, 결제는 PortOne 검증 통과 시에만 service role로 `paid` 처리.

### ③ 실제 insert 정책 읽기 (DB에서 직접 확인, 2026-07-15)

```sql
alter policy "purchases_insert_anyone"   -- 정책 이름(라벨) = purchases+insert+anyone, 뜻 담아 지음
on "public"."purchases"                  -- public 스키마(서랍)의 purchases 테이블에
to public                                -- 대상: 누구나(anon 포함)
with check ( true )                      -- 통과 조건: 무조건 true = 프리패스 🎫
```
- **`alter policy`** = 이미 있는 정책을 정의/수정하는 문법(Supabase 편집 화면이 기존 정책을 보여주는 것. 지금 바꾸는 게 아님).
- **`with check (조건)`** = insert/update로 **들어오는 새 줄**이 맞아야 할 조건. `(true)`라 아무 조건 없이 통과. (`auth.uid()=user_id`면 "본인 것만"으로 잠글 수 있지만, 게스트 체크아웃이라 `true`로 열어둠)
- **★ RLS는 안 거치는 게 아니라, 거치는데 `true`라 통과** — 문은 있고 프리패스.

#### ⭐ `using` vs `with check` — 검사 시점/대상이 다름

```
using      = 이미 DB에 있는 "기존 행" 검사  → select·delete·update   (나가는/건드리는 쪽 📤)
with check = 새로 들어오는/바뀌는 "새 값" 검사 → insert·update        (들어오는 쪽 📥)
```
| 동작 | 쓰는 절 | 뜻 |
| --- | --- | --- |
| select(읽기) | `using` | 기존 행 중 볼 수 있는 것만 |
| insert(넣기) | `with check` | 새 값이 규칙 맞나 |
| update(수정) | `using` + `with check` | 기존 행 건드려도 되나 + 바뀐 값 괜찮나 (둘 다!) |
| delete(삭제) | `using` | 지워도 되는 행인가 |

- 실제 예: 상품 읽기 `on products for select using (is_active = true)` / 주문 넣기 `on purchases for insert with check (true)`.
- `(true)`면 둘 다 프리패스. 조건 넣으면 잠금(예: `using (auth.uid()=user_id)` = 본인 행만).
- 기억법: **check = 체크인(들어올 때 짐 검사) 📥 / using = 나갈 때·쓸 때 신분 확인 📤.**

### ④ ⚠️ `public`이 두 번 나오는데 뜻이 다름 (함정)

```sql
on "public"."purchases"   ← public = 스키마 이름(테이블 담는 서랍 📁)
to public                 ← public = "모든 역할(누구나)" 👥
```
- 글자만 같고 뜻 다름. **위치로 구분: `on` 뒤 = 서랍 / `to` 뒤 = 대상(누구).**
- 스키마 = 테이블 폴더. 내 테이블들은 `public` 서랍, Supabase 로그인 테이블은 `auth` 서랍(`auth.users`). 점(.) = "~안의 ~".

### ⑤ 문지기 2겹 정리

```
route.ts 검증  = 양식 검사 (필수값 있나) — 통과 못하면 400
     +
RLS          = 권한 검사 (누가 뭘 해도 되나) — DB 레벨 최종 문지기
```
- insert는 양식(route)·권한(RLS) 둘 다 통과해야 저장. 어제 배운 "2차 방어선"과 이어짐.

---

## 16. ⭐ 넣는 것 vs 나오는 것 · purchase는 성공만 · res는 봉투 (2026-07-15 복습)

> 헷갈렸던 질문들: *"return data가 body에 담기나?"* / *"purchase에 error·data 둘 다 담기나?"* / *"res가 purchase(성공 data)를 받는 건가?"* / *"res에 담는 주체가 Next.js인가?"*

### ① `const purchase = await createPurchase(body)` — 넣는 것 ≠ 나오는 것

```ts
const purchase = await createPurchase(body)
//    변수A(담기는 곳)              변수B(넣는 재료)
//    주스              주스기        오렌지
```
- **`body`(오렌지)** = 함수에 **넣는 재료** ➡️. body엔 아무것도 안 담김 — 오히려 꺼내 **주는** 것. (이미 위 `request.json()`에서 만들어져 꽉 참)
- **`purchase`(주스)** = 함수가 **return한 값이 담기는 곳** ⬅️.
- **★ `return data`는 `body`가 아니라 `purchase`에 담김.** body=넣는 것, data=나온 것. 방향 반대.
- 규칙: `const 변수 = 함수(...)` → **변수엔 함수가 return한 값(나온 것)이 담김**(인자 아님). [[05-mutation]]의 res·section 12 "세 곳 같은 모양"과 동일.

### ② `body`의 상태 = 객체변환 + 검증통과 (단, 통째 저장 아님)

- `createPurchase(body)`에 오는 `body`는 항상: **① 객체로 변환됨**(`request.json()`) + **② 2차 검증 통과**(안 그러면 400에서 끊겨 못 옴).
- ⚠️ 단, body가 **통째로 저장되는 게 아님.** 저장될 한 줄 = **body(🟩사용자값) + 서버값(🟦payment_id·status·total_price) + DB자동(🟨id·created_at)**. body는 🟩부분만 채움. (섹션 14)

### ③ `purchase`엔 성공 data만 — error는 `catch`가 따로 받음

```ts
try {
  const purchase = await createPurchase(body)      // 성공: data 담김 / 실패: 튕겨서 안 담김
  return NextResponse.json(purchase, {status:201}) // 성공 줄 (201)
} catch (error) {                                   // ← 던져진 error를 여기가 받음 (purchase 아님!)
  return NextResponse.json({error:'...'}, {status:500}) // 실패 줄 (500)
}
```
- **`{ data, error }` 구조분해는 service(createPurchase) 안에서만** 있는 얘기 — supabase가 둘 다 줘서. route의 `purchase`엔 **성공 data만** 옴.
- createPurchase는 **성공이면 `return data`, 실패면 `throw`** (둘 다 주는 게 아님). throw면 그 줄에서 튕겨 `catch`로 점프 → `purchase`엔 아무것도 안 담김.
- **★ 201/500 결정 = `try/catch`(갈림길 🚦).** `NextResponse.json`은 결정 안 함 — 받은 걸 **포장만** 함.

### ④ `res` = purchase가 아니라 "봉투" (안에 문자열로 품음)

```
res (봉투) ┌─ status 201        ← 겉면 (res.ok로 안 열고 봄)
           └─ body "{id:...}"   ← purchase가 여기! 아직 문자열 📦
```
- `route.ts`가 `NextResponse.json(purchase)`로 **객체→문자열 포장**해 보냄 → `res`의 body는 **문자열**.
- **`res` = 봉투(전체)**, **`purchase` = 봉투 속 알맹이.** 봉투 ≠ 알맹이.
- 진짜 purchase 꺼내려면 → **`res.json()`**(문자열→객체). 성공 봉투엔 `purchase`, 실패 봉투엔 `{error}`.

### ⑤ 주체 — `res`에 담는 건 Next.js 아니라 `fetch`(브라우저)

```
Next.js(서버)  NextResponse.json(...) → 봉투 "만들어 보내는" 쪽
   ─ 네트워크 ─
fetch(브라우저) const res = await fetch(...) → 봉투 "받아 res에 담는" 쪽
```
- **`res`에 담는 주체 = `fetch`(브라우저).** Next.js는 내용물(봉투)을 만들어 보낸 쪽일 뿐.
- 대칭: **가는 길** request를 POST에 주입 = Next.js(서버가 받음) / **오는 길** res 담기 = fetch(브라우저가 받음). 각 편에서 "받는 쪽"이 주체.

---

## 17. ⭐ 읽기 직통 vs 쓰기 릴레이 · 구매 UI 위치 · page의 `purchase`=연장통 (2026-07-15 복습)

> 질문 흐름: *"page에 최신 데이터 어디서 받나?"* → `useProduct`. *"구매 UI 페이지 어디 있나?"* → 따로 없음. *"page의 purchase가 어떻게 쓰이나?"* → route.ts의 purchase와 딴 것.

### ① 읽기(상품)는 route.ts 안 거침 — 브라우저→supabase 직통

```
📖 읽기(상품):  page → useProduct → supabase.select() → DB       ← route.ts 없음! 직통
✍️ 쓰기(주문):  page → usePurchase → fetch → route.ts → createPurchase → supabase.insert() → DB
```
- 증거 = `import`가 다름:
  ```ts
  useProducts.ts      → '@/lib/supabase/client'  🌐 브라우저용 (직접 호출)
  purchase.service.ts → '@/lib/supabase/server'  🖥️ 서버용 (route.ts 안에서)
  ```
- **왜 다른가:** 공개 상품 읽기는 안전(RLS가 `is_active=true`만 내줌, 데이터 안 변함) → 직통으로 빠르게. 주문 쓰기는 검증·서버값(payment_id)·보안 필요 → route.ts(서버) 경유.
- 프로젝트 원칙(CLAUDE.md)과 일치: **"상품은 supabase 직접 호출, 결제·주문만 route handler."**
- 데이터 받는 지점 = `page.tsx:21` `const { data: product, isLoading, error } = useProduct(slug)`. 이 `product`로 화면 전체를 그림.

### ② 구매 UI 전용 페이지는 없음 — 상품 상세 안에 있음

- `(shop)` 페이지 전부: 홈 / about / products(목록) / products/[slug](상세). **checkout·cart 폴더 없음**(CLAUDE.md엔 계획으로만).
- 구매 UI = `[slug]/page.tsx` 안: 수량(−/+) · Total · **"Buy It Now" 버튼**(243줄) · 주문/결제 상태·에러 · **성공 팝업**(353줄~).
- **"Buy It Now" 직행 방식**: 상품 상세 → 바로 PortOne 결제창(페이지 아니라 **팝업**) → 성공 팝업. 장바구니·체크아웃 페이지 안 거침.
- `api/purchases`는 UI가 아니라 **route.ts(서버)**. 화면 없음.

### ③ ⚠️ 같은 이름 `purchase`, 완전히 다른 것 (함정)

```ts
// route.ts
const purchase = await createPurchase(body)   // = DB 주문 1건 (데이터)
// page.tsx:23
const purchase = usePurchase()                // = 주문 도구 꾸러미(연장통) 🧰
```
- **page의 `purchase` = `useMutation`이 준 꾸러미** { mutate, isPending, isError, error, ... }. 데이터 아님!
- 그 안 도구를 화면 곳곳에서 꺼내 씀:
  ```
  purchase.mutate    → 63줄:  "Buy It Now" 클릭 시 주문 발사 🔫
  purchase.isPending → 246줄: 버튼 잠금(중복클릭 방지) / 251줄: "주문 생성 중..." 글자 ⏳
  purchase.isError   → 259줄: 에러 메시지 보일지 말지 ❌
  purchase.error     → 261줄: 그 에러(throw된 메시지).message 표시
  ```
- 즉 `purchase`(연장통)는 한 번 만들어 두고, `.도구`를 꺼내 버튼·상태·에러에 연결. `purchase.mutate`가 어제 그 `postPurchase→fetch→route.ts` 흐름의 방아쇠.

---

## 18. ⭐ 페이지가 도구를 UI에 연결 + 구조분해 두 방식(이름 충돌 회피) (2026-07-15 복습)

> 캐치한 것: *"페이지에서 mutate·isPending·isError를 연결하는구나? 구조분해도 여기서 하는 거야?"* → 둘 다 맞음. 그리고 두 훅이 **꺼내는 방식이 다른 걸** 눈치챔.

### ① 연장통은 훅이 만들고, UI에 연결하는 건 페이지

- `usePurchase()`가 도구 꾸러미를 **만들어 주고**, 그 도구를 화면에 **연결**하는 건 page.
- page.tsx 실제 사용처(주석 제외 4곳):
  ```
  64줄   purchase.mutate(...)              → "Buy It Now" 클릭 시 주문 발사 🔫
  247줄  disabled={purchase.isPending||…}  → 버튼 잠금(중복주문 방지) ⏳
  252줄  purchase.isPending ? '주문 생성 중...' → 버튼 글자
  260줄  purchase.isError || payment.isError    → 에러 표시 여부 ❌
  262줄  (purchase.error ?? payment.error)?.message → 에러 메시지(어제 throw한 문구)
  ```

### ② 구조분해 두 방식 — 둘 다 "꾸러미 꺼내기", 방식만 다름

```ts
const { data: product, isLoading, error } = useProduct(slug)  // 구조분해 O (바로 쪼갬)
const purchase = usePurchase()                                // 구조분해 X (통째로 둠)
```

| 방식 | 코드 | 꺼내 쓸 때 |
| --- | --- | --- |
| 바로 쪼개기(구조분해) | `const { data: product, ... } = useProduct()` | `product`, `isLoading` (짧게) |
| 통째로 두기 | `const purchase = usePurchase()` | `purchase.mutate`, `purchase.isPending` (점으로) |

### ③ ⭐ 왜 `usePurchase`는 안 쪼갰나 — 이름 충돌 회피

- 두 훅 다 `data`·`error`를 가짐. **둘 다 구조분해하면 `data` 2개·`error` 2개 → 충돌 💥** (한 스코프에 같은 이름 못 씀).
  ```ts
  const { data, error } = useProduct(slug)
  const { data, error } = usePurchase()   // 💥 data·error 중복 선언 에러
  ```
- 해결책 2가지가 실제로 쓰임:
  - `useProduct` → `data: product`로 **이름 바꿔** 충돌 피함(별칭).
  - `usePurchase` → 아예 **통째로 `purchase`**로 둬서 `purchase.error`처럼 **소속을 붙여** 충돌 피함.
- 그래서 260줄 `purchase.error ?? payment.error` — 소속(purchase/payment)이 붙어 안 겹침.
- 결론: **둘 다 "꾸러미에서 필요한 걸 꺼내 쓴다"는 같음.** 방식(쪼개기 vs 통째)만 다르고, 이유는 **data·error 이름 충돌 회피**.

---

## 19. ⭐ await=기다림 · 요청↔응답 왕복(부메랑) · fetch는 400도 정상수신 · body는 같은 내용 다른 모양 (2026-07-16 복습)

### ① `await` = "서버"가 아니라 "**기다림**" ⭐ (오늘 큰 깨달음)

- 헷갈림: "브라우저=fetch, 서버=await"? ❌ → `await`는 **누구(주체)가 아니라 "느린 일 기다려"라는 동작**.
- **반례로 스스로 확인**: 서버 코드에도 `await` 있음 (`await request.json()`, `await createPurchase()`). "await=서버"면 말이 안 됨.
- 진짜 기준 = **"바깥(네트워크·DB·파일) 다녀오는 느린 일이냐"**:

| 작업 | 느림? | await |
| --- | --- | --- |
| `fetch(...)` (네트워크) | 느림 | ✅ |
| `request.json()`·`res.json()` (스트림 읽기) | 느림 | ✅ |
| `createPurchase()` (DB) | 느림 | ✅ |
| `JSON.stringify()`·값 꺼내기·곱셈 | **빠름(메모리)** | ❌ |

- 판별 요령: **"바깥 다녀오냐?"** 다녀오면 await, 내 안에서 즉시 끝나면 안 붙음. (심부름 vs 책상 위 처리)

### ② 요청 ↔ 응답은 **왕복 한 쌍** 🪃 (오늘 핵심)

- **던진 손(`fetch`)으로 돌아온다.** 부메랑처럼 요청 보낸 놈한테 답이 감.
- 역할 분리:

| | 누구/무엇 |
| --- | --- |
| return **보내는** 주체 | 서버 (`POST` 함수) |
| return **받는** 주체 | 요청 보낸 `fetch` |
| 받은 답 **담기는 곳** | `res` 변수 |

- **서버가 fetch를 추적하지 않음** — `request` 봉투에 **반송주소가 이미 있고 + 연결(전화선)이 살아있어서** 자동으로 돌아감. (전화 걸면 대답이 내 전화기로 들리는 것 ☎️)

### ③ `fetch`는 400도 **"정상 수신"** ⭐ (함정)

- `fetch` 입장 = "답장 **받기만** 하면 성공". 그래서 **400·500도 에러 안 던지고** 그냥 `res`에 담아옴.
- 그래서 400이든 201이든 **`fetch` 줄은 항상 먼저 실행됨** → 그 다음 판단.
- 400인지 아닌지 판단은 **내가 직접** `if (!res.ok)`로:
  ```
  ① const res = await fetch(...)   // 400 봉투도 정상 수신 (fetch 성공)
  ② if (!res.ok) {                 // 겉면 도장(status) 확인 → 400이면 진입
       const { error } = await res.json()   // 봉투 열어 error value 꺼냄
       throw new Error(error)                // → isError
     }
  ```
- ⚠️ 400 ≠ 401. **400=요청 잘못**, 401=로그인 안 됨. (다른 뜻)

### ④ `NextResponse.json(내용, 상태)` = 봉투 포장 ↔ 개봉

- `return NextResponse.json({ error: '...' }, { status: 400 })`
  - 1번 인자 `{error}` = 봉투 **속 내용** (⚠️ 요청 `body`가 아님! 서버가 새로 만든 **답장 내용**)
  - 2번 인자 `{status:400}` = 봉투 **겉면 도장**
- 브라우저가 뜯는 짝: `res.ok`(겉면) + `res.json()`(속). **포장 ↔ 개봉** 대칭.

### ⑤ `.json()` 가족 — 받으면 항상 문자열→객체

| 코드 | 방향 | 언제 |
| --- | --- | --- |
| `JSON.stringify()` | 객체 → 문자열 | 브라우저가 **보낼 때** |
| `request.json()` | 문자열 → 객체 | 서버가 **받을 때** |
| `res.json()` | 문자열 → 객체 | 브라우저가 **답장 받을 때** |

- 네트워크는 **문자만** 나름 → 나갈 땐 누르고(stringify), 들어올 땐 푼다(.json()).
- `request.json()`·`res.json()`이 **같은 방향**인 이유 = 둘 다 "**받는** 쪽"이라서.

### ⑥ `const { error }` = key로 꺼내 **value**를 담음

- `{ error: '필수 항목을...' }` 에서 `const { error }` → `error` 변수 = **value('필수 항목을...')**.
- 구조분해 = **key 이름 대고 → 그 value 꺼내** 같은 이름 변수에 담기. (key:value 쌍 전체가 아니라 value만)

### ⑦ ⚠️ 두 `body`는 같은 내용, 다른 모양·역할 (함정)

- 브라우저 `body: JSON.stringify(input)` vs 서버 `const body = await request.json()`

| | 브라우저 `body:` | 서버 `const body` |
| --- | --- | --- |
| **내용(데이터)** | 주문 정보 | 주문 정보 → **같음** ✅ |
| **모양** | 문자열 | 객체 → 다름 |
| **역할** | fetch 옵션의 **key(칸)** | **변수** → 다름 |

- 같은 주문 데이터가 **포장만 바꿔가며 왕복**: `input(객체)` →`stringify`→ 문자열 →네트워크→ 문자열 →`request.json()`→ `body(객체)`.
- `stringify`는 **네트워크 건너는 임시 문자열 모양**일 뿐, 데이터가 바뀐 게 아님. (택배 진공포장 📦 → 도착해서 뜯으면 같은 물건)

---

## 20. ⭐ React Query = `throw`(사건)를 `isError`(상태)로 번역 → 컴포넌트는 읽어서 시각화 (2026-07-16 복습)

### ① `throw`는 컴포넌트로 직접 안 감 — React Query가 받는다

- `postPurchase`를 **부른 건 React Query**(`mutate()` 내부에서 실행). throw는 "부른 쪽"으로 → **React Query한테** 던져짐.
  ```
  purchase.mutate(데이터)
     ↓ React Query가 내부에서 try/catch로 감싸 실행
     try { postPurchase(데이터) }   ← throw!
     catch (err) { ... }            ← ★ React Query가 잡음 (컴포넌트 아님)
  ```

### ② 잡은 뒤 = 사건(event)을 상태(state)로 **번역** (가공 아님)

| 사건(event) | → 상태(state) |
| --- | --- |
| `throw` | `isError=true`, `error=메시지` |
| 정상 `return` | `isSuccess=true`, `data=결과` |
| 실행 중 | `isPending=true` |

- 내용(에러 메시지)은 그대로. **"던졌다"는 순간을 → "에러 상태다"라는 계속 읽는 플래그로** 바꾼 것뿐. → "가공"보다 **"번역/표준화"**.

### ③ 컴포넌트는 상태판을 **읽어서 그림** (page.tsx 263줄)

```jsx
{(purchase.isError || payment.isError) && (      // ① 언제: 하나라도 에러면
  <Text ...>
    {(purchase.error ?? payment.error)?.message}  // ② 뭘: 발생한 에러의 message
  </Text>
)}
```
- `A ?? B` = A 있으면 A, 없으면 B (발생한 쪽 에러 집기)
- `?.message` = 에러 객체에서 message 꺼냄 (없으면 undefined, 안전)
- ⚠️ 여기는 throw가 **도착**하는 곳이 아니라, React Query가 저장해둔 상태를 **읽어 표시**하는 곳(거울 🪞).

### ④ throw한 메시지가 화면까지 오는 길 🔗

```
throw new Error('주문에 실패했습니다.')
   ↓ React Query가 잡아서
purchase.error = Error { message: '주문에 실패했습니다.' }
   ↓ re-render → JSX가 읽음
purchase.error?.message  →  '주문에 실패했습니다.'
   ↓
화면에 빨간 글씨
```
- 내가 `throw new Error(메시지)`에 넣은 그 메시지 = `purchase.error.message` = 화면 텍스트. **한 줄로 연결.**

### ⑤ ⭐ 이게 React Query 존재 이유 — 3결과를 상태로 포장

- 비동기 결과는 딱 3가지: **대기 / 성공 / 실패**. RQ 없으면 컴포넌트마다 `useState`+`try/catch`로 직접 관리(지저분).
- RQ가 대신 표준 상태로 배선 → 컴포넌트는 `isPending`·`isError`·`isSuccess`·`data`·`error` **읽기만** 하면 됨.
- 그래서 `useMutation`을 "**배선**"이라 부름 = postPurchase의 throw/return을 **컴포넌트가 읽기 좋은 상태로 연결**.
- 비유 📋: React Query = **중간 관리자**. 알바(postPurchase)가 "에러!" 소리치면(throw) → 관리자가 대신 받아 **상태판**에 적고(isError) → 사장(컴포넌트)은 소리 안 듣고 **상태판만** 봄.

---

## 21. ⭐ 인자→매개변수(body→input) 반복 · await는 대상이 각자 다름(DB/쿠키/네트워크) · createClient=연장 만들기 (2026-07-16 복습)

### ① `createPurchase(body)` → `createPurchase(input)` = 인자→매개변수 (또 같은 패턴)

```
route.ts:  const purchase = await createPurchase(body)   // body = 인자(넣는 값)
service:   export async function createPurchase(input)   // input = 매개변수(받는 그릇)
```
- 이름만 `body`→`input`, **내용은 같음**. 함수 경계 넘을 때마다 이름표만 갈아끼움.
- 오늘 벌써 3번째 반복: `mutate(데이터)→postPurchase(input)` / `createPurchase(body)→(input)`.
- **데이터 족보** 🧬: `input(브라우저)` →stringify→ 문자열 →`request.json()`→ `body(route)` →`createPurchase(body)`→ `input(service)`. 처음부터 끝까지 **같은 주문 데이터**, 이름만 바뀜.
- `body`는 **2차 검증 통과한** 것만 도달 (문지기 통과값만 주방행).

### ② ⚠️ `await`마다 이유(대상)가 다르다 — 다 "느린 일"이지만 대상은 각자

| 코드 | await 대상 | 뭘 기다리나 |
| --- | --- | --- |
| `await createClient()` | **쿠키** | 요청의 쿠키(신분) 읽기 |
| `await createPurchase(body)` | **DB** | insert 다녀옴 |
| `await request.json()`·`res.json()` | **네트워크** | body 스트림 도착 |
| `await fetch()` | **네트워크** | 서버 답장 왕복 |

- ❌ "`await createPurchase`는 body가 스트림이라" → 틀림. **`createPurchase`가 안에서 DB에 insert하러 다녀와서**(느린 함수라서).
- 규칙: **함수 안에 `await`(느린 일) 있으면 → 그 함수도 async → 부를 때도 `await`.** 안에 뭐가 있나 열어보면 이유가 보임.

### ③ `createClient`는 **연장 만들기**지 DB 접속이 아님 (`lib/supabase/server.ts`)

```
export const createClient = async () => {
  const cookieStore = await cookies()   // ★ 이 await의 정체 = 쿠키 읽기 (DB 아님)
  return createServerClient(url, key, { cookies: ... })
}
```
- `createClient()` = 쿠키에서 **신분을 읽어 supabase 연장(도구)을 조립**. 아직 DB 안 감.
- 진짜 DB 왕복은 그 연장으로 `.insert()` 할 때. (리모컨 만들기 🔧 vs 리모컨으로 작동시키기)
- 왜 쿠키? 서버 클라이언트가 **"누가 요청했나(로그인 상태)"**를 알아야 나중에 RLS 판단 가능 → 신분은 요청 쿠키에 있음. (Next.js 16의 `cookies()`는 비동기 API라 await)

---

## 🔑 오늘의 핵심 한 줄
**`fetch('/api/purchases', {method:'POST', body:stringify(input)})`(손님) → `route.ts`의 `POST(request)`가 받아 `request.json()`으로 풀기 → 검증(2차 방어선) → `createPurchase`에 위임해 DB insert → `NextResponse.json(purchase,201)` 응답. 손님·가게는 한 통화의 양쪽 끝, 포장(stringify)↔풀기(json())로 대화. `await`는 "느린 일 기다려", 답은 던진 손(fetch)의 `res`로 돌아온다(🪃), `fetch`는 400도 정상 수신이라 `if(!res.ok)`로 내가 판단.**

---

## ▶ 다음에 여기서 시작
- 돌아오는 길 **거의 완료** (섹션 11): `res` 응답 담김 → `res.ok`로 성공/실패 갈림 → 실패 `res.json()`으로 error 꺼내 `throw` / 성공 `res.json()` 반환.
- **마지막 1조각**: `postPurchase`가 `throw`/`return`한 다음 → **React Query가 `onError`(에러 표시) / `onSuccess`(결제창)로** 넘기는 곳. (page.tsx의 mutate 콜백)
- 그다음: `createPurchase` 서비스 안(payment_id 생성, insert)과 결제 검증(`markPurchasePaid`, service role) 흐름.
