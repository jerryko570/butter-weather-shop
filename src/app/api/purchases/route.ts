/* ════════════════════════════════════════════════════════════════
   ▌ 코드 원본 ─ 주석 없이 실제로 돌아가는 코드
   ════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server'
import { createPurchase } from '@/services/purchase.service'
import type { CreatePurchaseInput } from '@/types/purchase'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePurchaseInput

    if (
      !body.product_id ||
      !body.product_name ||
      !body.quantity ||
      !body.price_krw
    ) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 } // createPurchase까지 못감
      )
    }

    const purchase = await createPurchase(body)
    //    --변수A--                      --변수B--
    //  결과가 담기는 곳                   함수에 넣는 곳
    // const 주스 = 주스기(오렌지) / 오렌지: 주스기에 넣음. 주스: 주스기에 나온곳이 담기는 곳

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    // 던져진 error를 여기서 받음
    // (createPurchase가 throw -> try 중단 -> catch로 점프 -> NextRespose.json({error}, 500) 실행
    console.error('Purchase creation failed:', error)

    return NextResponse.json(
      { error: '주문 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/* ════════════════════════════════════════════════════════════════
   ▌ 코드 + 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   주문 생성 API Endpoint  (라우트 핸들러 = 서버 코드, 받는 쪽)
   · front(usePurchase)와 DB 로직(Service) 사이의 "중간 다리"
   · 역할 = 문지기(검증) + 통역(포장/풀기). DB는 createPurchase에 위임

   요약:
     POST 요청이 들어오면 실행되는 비동기 함수.
     body에서 요청 데이터를 JSON으로 꺼내 담고 (CreatePurchaseInput 타입으로 취급),
     필수 4개 중 하나라도 비면 400(2차 방어선)을 돌려주고,
     다 있으면 createPurchase로 저장 → 201로 성공 응답,
     중간에 터지면 catch가 받아 500을 돌려준다.


   ─────────────────────────────────────────────
   ★★ 포장·풀기는 왕복 4번 (편도 아님!)
   ─────────────────────────────────────────────
   가는 길:  객체 →[포장]→ 문자열 →네트워크→ 문자열 →[풀기]→ 객체
   오는 길:  객체 →[포장]→ 문자열 →네트워크→ 문자열 →[풀기]→ 객체

   📄 usePurchase (손님 / 브라우저)
     ① 객체 → 문자열    JSON.stringify(input)        ← 포장 #1
        ─── 네트워크 (가는 길) ───
   📄 route.ts (서버)  ← 이 파일
     ② 문자열 → 객체    await request.json()          ← 풀기 #1
     ③ 검증 → createPurchase …   (서버 안에서는 "객체"로 일함)
     ④ 객체 → 문자열    NextResponse.json(data)       ← 포장 #2  (여기서 또 문자열!)
        ─── 네트워크 (오는 길) ───
   📄 usePurchase (손님)
     ⑤ 문자열 → 객체    await res.json()              ← 풀기 #2  (그래서 또 풀어야 함)

   ★ 왜 또 포장하나?
     ②에서 푼 객체는 "서버 안에서만" 살아 있음. 네트워크를 다시 건널 땐
     또 문자열이어야 함 → 그래서 ④ 포장 #2, ⑤ 풀기 #2가 필요.
   → 네트워크를 건널 때마다 [포장→풀기] 한 쌍이 붙는다.


   ─────────────────────────────────────────────
   ★ 응답 중 문자열이 되는 건 "본문"뿐 (status는 아님)
   ─────────────────────────────────────────────
   NextResponse.json( { error: '…' },   { status: 400 } )
                      ───┬─────────      ───┬────────
                         │                  └ status = 문자열 X → 손님이 res.ok로 바로 봄
                         └ 본문(내용물) = 문자열 됨 → 손님이 res.json()으로 뜯어야 보임
   → 그래서 손님은: res.ok로 먼저 성패 판단 → 그 다음 res.json()으로 내용 확인


   ─────────────────────────────────────────────
   ★ 네트워크 O vs X — 두 종류의 "호출"을 구분
   ─────────────────────────────────────────────
   fetch('/api/purchases', …)  = 브라우저 → 서버    : 네트워크 O (선 타고 감, 문자열만)
   createPurchase(body)        = 서버 안 함수 호출  : 네트워크 X (같은 서버 안에서 "점프")
   · () = 함수를 "실행하는 스위치" (지금 실행)
   · 그래서 fetch엔 stringify/파싱이 필요하고, 함수 호출엔 필요 없음(객체 그대로 전달)


   ─────────────────────────────────────────────
   요청 ↔ 응답 해부 (들어오는 것 / 나가는 것)
   ─────────────────────────────────────────────
   들어오는 것 = 요청(request)  = method + headers + body
   나가는 것   = 응답(response) = status + headers + body
   · request.json()      → 들어온 요청의 body를 객체로 품
   · NextResponse.json() → 나갈 응답을 만듦 (body + status 얹어서)


   ─────────────────────────────────────────────
   이 파일의 위치 (주문 흐름 속에서)
   ─────────────────────────────────────────────
   [브라우저]  purchase.mutate(주문데이터)          (ProductDetailPage)
      → postPurchase 의 fetch('/api/purchases', POST)  (usePurchase.ts, 보내는 쪽)
      → ★ 여기 route.ts 의 POST(request)               (서버, 받는 쪽)  ← 이 파일
      → createPurchase(body)                            (purchase.service, DB 저장)
      → NextResponse.json(purchase, 201) 로 응답을 돌려줌
      → postPurchase 의 res.json() 이 그 응답을 받아 onSuccess 로 전달


   ─────────────────────────────────────────────
   누가 이 함수를 실행하나? (수령 주체 = Next.js 서버)
   ─────────────────────────────────────────────
   · export = 이 함수를 Next.js가 "찾을 수 있게" 내보내는 것 (라우팅용)
     → 내가 직접 호출하는 함수가 아님. 실행결과를 export하는 것도 아님(함수 자체)
   · 흐름: 요청 도착 → Next.js가 request 객체로 포장(body·headers·method)
           → POST(request) 실행 → 그 안에서 우리가 처리
   · 즉 request 주입도, POST 호출도 전부 Next.js가 한다 (프레임워크가 수령 주체)


   ─────────────────────────────────────────────
   한 줄씩
   ─────────────────────────────────────────────
   export async function POST(request: Request) {
   // · export = Next.js가 이 함수를 찾아 라우팅하려고 내보냄 (내가 호출 X)
   // · request = 손님(브라우저)이 fetch로 보낸 요청 "전체" (method+headers+body 봉투)
   //   = Request 타입 모양을 한 객체 / "요청 처리 그 순간 채워지는 받는 손"
   //   → Next.js가 자동으로 POST의 첫 매개변수에 끼워줌

     try {
       const body = (await request.json()) as CreatePurchaseInput
       // · ★ 풀기 #1 — 문자열 → 객체 (손님이 stringify한 걸 서버에서 품)
       // · 이 객체는 "서버 안에서만" 살아 있음
       //     → 다시 네트워크 건널 땐 또 문자열로 포장해야 함 (아래 ④)
       // · ★ await = 결과 즉시 X → "약속(Promise=교환권)"부터 받고, 준비되면 값 교환
       // · as CreatePurchaseInput = "이 모양일 거다" 타입만 약속 (검사 X)

       if (!body.product_id || !body.product_name || !body.quantity || !body.price_krw) {
         return NextResponse.json(
           { error: '필수 항목을 모두 입력해주세요.' },   // ← 본문: 문자열 됨 → res.json()으로 뜯어야 보임
           { status: 400 }                                // ← status: 문자열 X → res.ok로 바로 보임
         )
       }
       // · 필수 4개 중 하나라도 비면(|| falsy) → 400(Bad Request)
       // · ★ early return = POST 함수를 여기서 "즉시 종료" → 400을 손님(fetch)이 받음
       // · ★ 2차 방어선: 요청은 조작될 수 있으니 서버가 한 번 더 검사
       //   + 낭비 방지: 필수값 없는 요청을 createPurchase까지 보내면 supabase에서
       //     어차피 에러 → DB 호출 낭비. 미리 걸러낸다

       const purchase = await createPurchase(body)
       // · () = 함수를 "실행하는 스위치" → createPurchase를 지금 실행
       // · ★ 이 점프는 "같은 서버 안" 함수 호출 → 네트워크 X → 포장/풀기 불필요(객체 그대로)
       // · service가 payment_id 등 "서버에서 만든 값"을 덧붙여 저장
       // · await가 그 함수의 return까지 "멈춰서 기다림" → return data가 이 줄로 돌아와 담김
       // · ★ service가 throw한 error도 "이 줄로 되돌아옴" → 아래 catch로 빠짐

       return NextResponse.json(purchase, { status: 201 })
       // · ★ 포장 #2 — 객체(purchase) → 문자열로 싸서 네트워크에 태움
       //     내용물 + { status } 두 개를 넣으면 HTTP 응답 형태로 "포장만" 해줌
       // · 201 = Created(새 자원 생성 성공)  /  200 = OK (주로 GET 조회 성공)
       //   이 응답이 손님의 res.json()(풀기 #2) → onSuccess(createdPurchase)로 이어짐

     } catch (error) {
       console.error('Purchase creation failed:', error)
       return NextResponse.json(
         { error: '주문 처리 중 오류가 발생했습니다.' },
         { status: 500 }
       )
       // · ★ createPurchase가 던지면(throw) → 그 에러가 여기 catch로 잡힘 → 500
       //   (try 안 어디서든 터지면 여기로. 실제 에러는 로그로만, 손님엔 일반 메시지)
     }
   }


   ─────────────────────────────────────────────
   헷갈릴 때 메모
   ─────────────────────────────────────────────
   · 포장/풀기는 왕복 4번
       ① stringify(브라우저) → ② request.json(서버)
       ④ NextResponse.json(서버) → ⑤ res.json(브라우저)
       → 네트워크를 건널 때마다 [포장→풀기] 한 쌍. 객체는 그 안(한쪽)에서만 산다

   · 응답에서 문자열 되는 건 본문뿐
       body   → 문자열 → res.json()으로 뜯어야 보임
       status → 문자열 X → res.ok로 바로 보임

   · 네트워크 O vs X
       fetch(주소, …)     = 브라우저→서버, 네트워크 O (stringify/파싱 필요)
       createPurchase(…)  = 서버 안 함수 호출, 네트워크 X (객체 그대로, () = 실행)

   · await = 결과 즉시 X → "약속(Promise)"부터 → 준비되면 값 교환
   · early return = 검증 실패 시 POST 함수 즉시 종료 (뒤로 안 감)
   · throw(service) → 그 줄로 되돌아옴 → catch(route) → 500
   · 2차 방어선 = 위조 대비 + 헛된 DB 호출 낭비 방지
   · 요청 = method+headers+body  /  응답 = status+headers+body
   · export하는 이유 = Next.js가 이 함수를 찾아 라우팅하려고 (내가 직접 호출 X)
   · 상태코드
       200 = 조회 성공(GET) / 201 = 생성 성공(POST)
       400 = 입력값 문제(검증 실패) / 500 = 서버 내부 오류
   · 역할 분리
       route(이 파일) = 문지기(검증) + 통역(포장/풀기)
       service(createPurchase) = 실제 DB 작업
   ════════════════════════════════════════════════════════════════ */
