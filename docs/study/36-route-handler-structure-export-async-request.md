# 36. route.ts = 접수 창구(받·확·넘·결) + export 유무 + async 규칙 + fetch 목적지 + request는 Next.js가 채움

> 한 줄: **route.ts = "접수 창구": try{ ①받기(request.json) → ②확인(필수값 없으면 400) → ③주방에 넘기기(createPurchase 위임) → ④완료(201) } catch{ ⑤사고(500) }. 직접 DB 저장 안 하고 service에 위임. `export`는 "밖에서 쓰면"(POST=Next.js가 찾아 호출→필수 / usePurchase=page가 씀→O / postPurchase=내부용→X). `async`는 "안에서 await 쓰면"(postPurchase·POST·createPurchase O / usePurchase X). fetch의 첫 인자 `/api/purchases`=목적지=route.ts(폴더=URL). request는 Next.js가 "POST 요청 오면 호출하며 자동으로 채워줌"(부르는 사람이 채운다). request=받기 / response(NextResponse)=주기.**
> 생성흐름 전체·async [[35-creation-flow-full-promise-json-client-server]] · fetch/에러·?? [[34-fetch-structure-error-handling-nullish]] · route/service·2차검증 [[30-reading-unfamiliar-code-route-service-type-design]] · 부르는사람이 채움 [[31-entry-point-mutate-chain-createdpurchase]]

---

## 1. ⭐⭐ route.ts = 접수 창구 (받·확·넘·결)

```ts
export async function POST(request: Request) {
  try {
    const body = await request.json()                  // ① 받기
    if (!body.product_id || ... ) return 400            // ② 확인 (필수값 없으면 반려)
    const purchase = await createPurchase(body)         // ③ 넘기기 (주방=service에 위임)
    return NextResponse.json(purchase, { status: 201 }) // ④ 완료
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 })// ⑤ 사고
  }
}
```

🏢 **창구 직원(POST)이 손님 서류(request)를 처리**:

| 코드 | 창구에서 | 단계 |
| --- | --- | --- |
| `request.json()` | 서류 꺼냄 | ① 받기 |
| `if(필수값 없음) 400` | 빈칸 있으면 반려 | ② 확인 |
| `createPurchase(body)` | **주방에 넘김**(직접 요리 X) | ③ 넘기기 |
| `return 201` | 완료증 발급 | ④ 완료 |
| `catch → 500` | 사고나면 사과문 | ⑤ 사고 |

- **기억 훅: 받·확·넘·결** (받기→확인→넘기기→결과). 세부 코드는 까먹어도 이 모양만 있으면 됨.
- **상태코드 3개**: 400(빈칸=손님 잘못) / 201(완료) / 500(사고=서버 잘못).
- 핵심: **직접 DB 저장 안 하고 service(createPurchase)에 위임.** (route=접수/service=주방)
- 2차 검증(`if !body...`) = 프론트 말 안 믿고 서버가 재확인(노트 30).

---

## 2. ⭐ `export` 유무 — "밖에서 쓰면 export"

| | export? | 왜 |
| --- | --- | --- |
| `POST` (route.ts) | ✅ 필수 | **Next.js가 "요청 오면 찾아서 호출"** (프레임워크 규칙) |
| `usePurchase` | ✅ | **page가 import해 씀** |
| `postPurchase` | ❌ | **usePurchase 내부에서만** 씀 (비공개 helper) |

- 🏷️ export = 간판(밖에서 보임). POST=간판 단 가게(Next.js가 찾아옴) / postPurchase=집안 물건(안 씀).
- Next.js 규칙: `route.ts`의 export된 `GET/POST/PATCH/DELETE`를 그 주소의 HTTP 요청에 연결. 안 하면 못 찾음.

---

## 3. ⭐ `async` 규칙 — "안에서 await 쓰면 async"

| 함수 | 안에서 await? | async? |
| --- | --- | --- |
| `postPurchase` | ✅ await fetch | ✅ |
| `POST`(route) | ✅ await request.json | ✅ |
| `createPurchase`(service) | ✅ await supabase | ✅ |
| `usePurchase` | ❌ (연결만) | ❌ |

- **await는 async 함수 안에서만.** 네트워크(fetch)·DB(supabase) 만지면 시간 걸려 await→async. 연결·계산만 하면 안 붙임.
- async는 usePurchase가 아니라 **postPurchase**(혼동 주의).

---

## 4. ⭐ fetch의 첫 인자 = 목적지(route.ts). 폴더 = URL

```ts
fetch('/api/purchases', {...})   // 첫 인자 = 보내는 주소
```
- `/api/purchases` = **`app/api/purchases/route.ts`** 가 담당(Next.js: 폴더구조=URL).
- 즉 postPurchase(클라)가 → **우리 서버 route.ts로** 보냄. fetch가 클라↔서버 경계.
  - `app/api/payments/complete/route.ts` → `/api/payments/complete`

---

## 5. ⭐ request는 Next.js가 자동으로 채운다 (req ≠ res)

```ts
export async function POST(request: Request) { ... }
```
- POST 요청이 오면 Next.js가 **POST 함수를 호출하면서 들어온 요청을 `request`에 자동으로 채워줌.** 내가 만드는 게 아님.
- **"부르는 사람이 채운다"** — 부르는 쪽=Next.js(set·onSuccess·map과 같은 패턴).
- **request(받기) ≠ response(주기)**:
  - `request` = 들어온 요청 (Next.js가 채움). `request.json()`으로 body(데이터) 꺼냄.
  - `NextResponse.json(...)` = 내가 만들어 **return하는 응답**.
  - postPurchase의 `res`(응답 받은 봉투)와 route의 `request`(들어온 요청)는 **방향 반대**.

---

## 6. 타이핑 함정 (usePurchase·타입)

- `if (!res.ok)` — 봉투(res)가 아니라 **성공 도장(.ok)** 체크. (!res는 거의 안 씀)
- `throw new Error(error ?? '주문 실패')` — **`new` 필수**(에러 객체 생성), **`??` 물음표 2개**(없으면 오른쪽, 쉼표로 2개 넣는 거 아님).
- `usePurchase = () => { return useMutation(...) }` — **`() =>`**(함수), `return useMutation` 바로(또 `{}`로 감싸지 말기).
- 이름 `CreatePurchaseInput`(Create, Omit<Purchase,...> 감싸기) / 경로 `/api/purchases`(복수) / buyer **3개**(name·phone·address).

---

## 한 줄 정리 모음

1. route.ts=접수 창구: 받(request.json)→확(필수 없으면 400)→넘(createPurchase 위임)→결(201)/사고(catch 500). 직접 저장 X, service 위임.
2. export="밖에서 쓰면": POST(Next.js가 호출)·usePurchase(page가 씀)=O / postPurchase(내부용)=X.
3. async="안에서 await 쓰면": postPurchase·POST·createPurchase=O / usePurchase=X.
4. fetch 첫 인자=목적지. /api/purchases=route.ts(폴더=URL). postPurchase(클라)→route.ts(서버).
5. request는 Next.js가 자동으로 채움(부르는 사람이 채운다). request=받기/response=주기, 방향 반대.
6. 함정: !res.ok · throw new Error(?? 2개) · () => · CreatePurchaseInput · /api/purchases.
