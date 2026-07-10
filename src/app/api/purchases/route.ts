//  라우트 핸들러 (route handler): 서버 코드 / 서버 핸들러

import { NextResponse } from 'next/server'
import { createPurchase } from '@/services/purchase.service'
import type { CreatePurchaseInput } from '@/types/purchase'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePurchaseInput
    //            ===================== 문자열 -> 객제 풀기
    // request.json() : 들어온 요청 열어서 읽기

    // 검증
    if (
      !body.product_id ||
      !body.product_name ||
      !body.quantity ||
      !body.price_krw
    ) {
      return NextResponse.json(
        // 서버의 답장
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    // DB 저장
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

   주문 생성 API Endpoint  (서버 = 받는 쪽)
   · front(usePurchase)와 DB 로직(Service) 사이의 "중간 다리"
   · 직접 DB를 만지지 않고 createPurchase에게 위임한다

   요약:
     POST 요청이 들어오면 실행되는 비동기 함수.
     body에서 요청 데이터를 JSON으로 꺼내 담고 (CreatePurchaseInput 타입으로 취급),
     필수 4개 중 하나라도 비면 400(2차 방어선)을 돌려주고,
     다 있으면 createPurchase로 저장 → 201로 성공 응답,
     중간에 터지면 catch가 받아 500을 돌려준다.


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
   한 줄씩
   ─────────────────────────────────────────────
   export async function POST(request: Request) {
   // · POST 요청이 오면 Next.js가 이 함수를 실행 (파일명·위치로 라우팅됨)
   // · request = 손님(브라우저)이 fetch로 보낸 요청 "전체"
   //     (body · headers · method 다 들어있는 봉투)
   //   → 내가 만드는 게 아니라 Next.js가 자동으로 POST의 인자로 넣어줌

     try {
       const body = (await request.json()) as CreatePurchaseInput
       // · request.json() = 봉투(요청) 열어서 본문(주문 데이터)을 꺼냄
       //   (보낼 때 JSON.stringify 했던 걸 → 여기서 다시 객체로 푸는 반대 동작)
       // · await = 본문 다 읽을 때까지 기다림
       // · as CreatePurchaseInput = "이 모양일 거다"라고 타입만 약속 (검사 X)

       if (!body.product_id || !body.product_name || !body.quantity || !body.price_krw) {
         return NextResponse.json(
           { error: '필수 항목을 모두 입력해주세요.' },
           { status: 400 }
         )
       }
       // · 필수 4개 중 하나라도 비면 → 400(Bad Request)로 즉시 반환
       // · ★ 2차 방어선: 브라우저(클라)에서 막았어도 서버가 한 번 더 검사
       //   (요청은 조작될 수 있으니 서버 검증이 진짜 방어선)
       // · || = 하나라도 비어있으면(falsy) true → 검증 실패

       const purchase = await createPurchase(body)
       // · 통과하면 → Service에 위임해 실제 DB 저장 (여기선 DB 직접 안 만짐)
       // · 반환값 purchase = 저장된 주문(payment_id 등 포함)

       return NextResponse.json(purchase, { status: 201 })
       // · 201(Created) = "새 자원 생성 성공" → 저장된 주문을 그대로 응답 본문에
       //   이 응답이 postPurchase의 res.json() → onSuccess(createdPurchase)로 이어짐

     } catch (error) {
       console.error('Purchase creation failed:', error)
       return NextResponse.json(
         { error: '주문 처리 중 오류가 발생했습니다.' },
         { status: 500 }
       )
       // · try 안 어디서든 터지면 여기로 → 500(서버 오류)로 응답
       //   (실제 에러는 로그로만, 손님에겐 일반 메시지만 — 내부 노출 방지)
     }
   }


   ─────────────────────────────────────────────
   헷갈릴 때 메모
   ─────────────────────────────────────────────
   · request는 내가 안 만든다 — Next.js가 POST의 인자로 자동 주입
   · request.json()  ↔  JSON.stringify(보낼 때)  : 서로 반대 (풀기 ↔ 싸기)
   · 검증은 2차 방어선 — 클라 검증 믿지 말고 서버가 다시 (요청은 위조 가능)
   · 상태코드
       400 = 입력값 문제(검증 실패) / 201 = 생성 성공 / 500 = 서버 내부 오류
   · 역할 분리
       route(이 파일) = 문지기·통역 (검증 + 요청/응답 변환)
       service(createPurchase) = 실제 DB 작업
     → route는 DB를 직접 만지지 않고 service에 위임
   ════════════════════════════════════════════════════════════════ */
