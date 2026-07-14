/* ════════════════════════════════════════════════════════════════
   가는 길:  객체 →[포장]→ 문자열 →네트워크→ 문자열 →[풀기]→ 객체
   오는 길:  객체 →[포장]→ 문자열 →네트워크→ 문자열 →[풀기]→ 객체
   📄 usePurchase (손님)
   ① 객체 → 문자열   JSON.stringify(input)      ← 포장 #1
      ─── 네트워크 (가는 길) ───
📄 route.ts (서버)
   ② 문자열 → 객체   await request.json()        ← 풀기 #1  ★네가 말한 이거!
   ③ ...검증, createPurchase... (서버 안에서 객체로 일함)
   ④ 객체 → 문자열   NextResponse.json(data)     ← 포장 #2  ★여기서 또 문자열됨!
      ─── 네트워크 (오는 길) ───
📄 usePurchase (손님)
   ⑤ 문자열 → 객체   await res.json()             ← 풀기 #2  ★그래서 또 풀어야 함
   ════════════════════════════════════════════════════════════════ */

import { NextResponse } from 'next/server'
import { createPurchase } from '@/services/purchase.service'
import type { CreatePurchaseInput } from '@/types/purchase'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePurchaseInput
    // request.json() -> 이 객체는 서버 안에서만 살아 있고
    // 네트워크를 다시 건널 땐 또 문자열로 포장
    if (
      !body.product_id ||
      !body.product_name ||
      !body.quantity ||
      !body.price_krw
    ) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' }, // 내용물만 문자열이 됨 -> 뜯어야 보임 (res.json)
        { status: 400 } // 문자열 안됨 (res.ok 보임)
      )
    }

    const purchase = await createPurchase(body)

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
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
   · 직접 DB를 만지지 않고 createPurchase에게 위임한다

   요약:
     POST 요청이 들어오면 실행되는 비동기 함수.
     body에서 요청 데이터를 JSON으로 꺼내 담고 (CreatePurchaseInput 타입으로 취급),
     필수 4개 중 하나라도 비면 400(2차 방어선)을 돌려주고,
     다 있으면 createPurchase로 저장 → 201로 성공 응답,
     중간에 터지면 catch가 받아 500을 돌려준다.


   ─────────────────────────────────────────────
   ★ 네트워크 O vs X — 두 종류의 "호출"을 구분
   ─────────────────────────────────────────────
   fetch('/api/purchases', …)  = 브라우저 → 서버    : 네트워크 O (선 타고 감, 문자열만)
   createPurchase(body)        = 서버 안 함수 호출  : 네트워크 X (같은 서버 안에서 "점프")
   · () = 함수를 "실행하는 스위치" (지금 실행)
   · 그래서 fetch엔 stringify/파싱이 필요하고, 함수 호출엔 필요 없음(객체 그대로 전달)


   ─────────────────────────────────────────────
   포장 ↔ 풀기 — "어디서" 도는가 (위치가 핵심)
   ─────────────────────────────────────────────
   포장 = JSON.stringify   → 커스텀 훅(postPurchase)에서, 즉 브라우저에서 돎
   풀기 = request.json()   → route.ts(POST)에서, 즉 서버에서 돎
   · 둘 사이는 네트워크 → 문자열만 건너감 → 한쪽이 싸고(포장) 한쪽이 푼다(풀기)
   · 여는 주체 = 서버 (request.json() 줄이 그 지점)


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
   // · POST 요청이 오면 Next.js가 이 함수를 실행 (파일명·위치로 라우팅됨)
   // · request = 손님(브라우저)이 fetch로 보낸 요청 "전체" (method+headers+body 봉투)
   //   = Request 타입 모양을 한 객체 / "요청 처리 그 순간 채워지는 받는 손"
   //   → 내가 만드는 게 아니라 Next.js가 자동으로 POST의 첫 매개변수에 끼워줌

     try {
       const body = (await request.json()) as CreatePurchaseInput
       // · request.json() = 봉투(요청) 열어서 본문 꺼내기(받기 파싱) — 커스텀 훅에서 온 데이터
       //   (보낼 때 JSON.stringify 했던 걸 → 여기 서버에서 다시 객체로 푸는 반대 동작)
       // · ★ await = 결과를 즉시 주는 게 아니라 "약속(Promise=교환권)"부터 받고,
       //     준비되면 교환해 값(body)을 꺼냄 (body가 아직 들어오는 중일 수 있어서)
       // · const 변수 = (표현식) 꼴 — (await …) 결과를 body에 담음
       // · as CreatePurchaseInput = "이 모양일 거다"라고 타입만 약속 (검사 X)

       if (!body.product_id || !body.product_name || !body.quantity || !body.price_krw) {
         return NextResponse.json(
           { error: '필수 항목을 모두 입력해주세요.' },   // ← 응답 본문(실패 전용)
           { status: 400 }                                // ← 옵션(상태코드)
         )
       }
       // · 필수 4개 중 하나라도 비면(|| falsy) → 400(Bad Request)로 즉시 반환
       // · ★ early return = POST 함수를 여기서 "즉시 종료" → 400을 손님(fetch)이 받음
       // · ★ 2차 방어선: 브라우저(클라)에서 막았어도 서버가 한 번 더 검사
       //     (요청은 조작될 수 있으니 서버 검증이 진짜 방어선)
       //   + 낭비 방지: 필수값 없는 요청을 createPurchase까지 보내면 supabase에서
       //     어차피 에러 → DB 호출 낭비. 미리 걸러낸다
       // · NextResponse.json(본문, 옵션) = 응답 만들어 밖으로 내보냄
       //     → 네트워크 타고 손님의 res.json()으로 열림 (손님이 { error } 구조분해)

       const purchase = await createPurchase(body)
       // · () = 함수를 "실행하는 스위치" → createPurchase를 지금 실행
       // · ★ 이 점프는 "같은 서버 안" 함수 호출 → 네트워크 X (fetch와 다른 점!)
       //     (fetch = 브라우저→서버 네트워크 O / 여긴 서버 내부라 네트워크 X, 객체 그대로)
       // · 검증 통과한 body를 넘겨 실행 → DB insert
       //     (service가 payment_id 등 "서버에서 만든 값"을 덧붙여 저장)
       // · DB insert는 시간이 걸려서 await가 그 함수의 return까지 "멈춰서 기다림"
       // · service의 return data → 이 줄로 돌아와 purchase 변수에 담김

       return NextResponse.json(purchase, { status: 201 })
       // · 내용물(purchase) + { status: 201 } 두 개를 직접 넣으면
       //   NextResponse.json()이 HTTP 응답 형태로 "포장만" 해준다
       // · 201(Created) = "새 자원 생성 성공"
       //   이 응답이 postPurchase의 res.json() → onSuccess(createdPurchase)로 이어짐

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
   · 네트워크 O vs X
       fetch(주소, …)     = 브라우저→서버, 네트워크 O (stringify/파싱 필요)
       createPurchase(…)  = 서버 안 함수 호출, 네트워크 X (객체 그대로, () = 실행)
   · await = 결과 즉시 X → "약속(Promise)"부터 → 준비되면 값 교환
   · early return = 검증 실패 시 POST 함수 즉시 종료 (뒤로 안 감)
   · throw(service) → catch(route) → 500 : 던지는 곳과 받는 곳이 다름
   · 2차 방어선 = 위조 대비 + 헛된 DB 호출 낭비 방지
   · 포장/풀기는 "장소"가 다르다
       포장(stringify) = 브라우저(훅) / 풀기(request.json) = 서버(route)
   · 요청 = method+headers+body  /  응답 = status+headers+body
   · request.json()(받기 파싱) ↔ NextResponse.json()(응답 만들기) — 짝
   · export하는 이유 = Next.js가 이 함수를 찾아 라우팅하려고 (내가 직접 호출 X)
   · request는 내가 안 만든다 — Next.js가 POST의 첫 인자로 자동 주입
   · 상태코드
       400 = 입력값 문제(검증 실패) / 201 = 생성 성공 / 500 = 서버 내부 오류
   · 역할 분리
       route(이 파일) = 문지기·통역 (검증 + 요청/응답 변환)
       service(createPurchase) = 실제 DB 작업
     → route는 DB를 직접 만지지 않고 service에 위임
   ════════════════════════════════════════════════════════════════ */
