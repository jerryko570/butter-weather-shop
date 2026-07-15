/* ════════════════════════════════════════════════════════════════
    insert (createPurchase): RLS 거쳐도 통과됨 (프리패스 정책)
    ㄴ RLS에 주문 넣기(insert)는 허용 정책이 있어서 createClient로도 문을 통과함
    ㄴ 진짜 방어선은 돈이 움직이는 곳에 있음
    ㄴ 누구나 주문 생성 (insert)
   ════════════════════════════════════════════════════════════════ */

import { createClient } from '@/lib/supabase/server' // 서버용
import { createAdminClient } from '@/lib/supabase/admin'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

export async function createPurchase(
  input: CreatePurchaseInput
): Promise<Purchase> {
  const supabase = await createClient()

  const paymentId = crypto.randomUUID() // 상자(crypto).함수(randomUUID) -> 켜면 랜덤 아이디 나옴

  const { data, error } = await supabase
    .from('purchases')
    .insert({
      // 넣어!
      payment_id: paymentId, // server (cryto.randomUUID())
      product_id: input.product_id, // user (input)
      product_name: input.product_name, // user
      quantity: input.quantity, // user
      price_krw: input.price_krw, // user
      price_usd: input.price_usd, // user
      total_price: input.price_krw, // server (input 값으로 계산 )
      status: 'pending', // server (고정값: 걸제대기)
    })
    .select() // 자동 생성값 도로 줘!
    .single() // 객체만!

  // 쿼리체인 사용 이유 : 이어 붇니는 이유는 주문서 한 장을 조금씩 채우기 때문. 각각 따로 DB에 갔다 오는게 아님 -> 한 장의 주문서에 요구사항을
  // 하나씩 붙여서 마지막에 한번에 await가 DB로 쏨응

  if (error) throw error
  // error는 catch (error)로 따로 받음
  return data as Purchase
}

export async function getPurchaseByPaymentId(
  paymentId: string
): Promise<Purchase | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select()
    .eq('payment_id', paymentId)
    .single()

  if (error) return null
  return data as Purchase
}

export async function markPurchasePaid(paymentId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('purchases')
    .update({ status: 'paid' })
    .eq('payment_id', paymentId)

  if (error) throw error
}

export async function markPurchaseCancelled(paymentId: string): Promise<void> {
  const admin = createAdminClient()
  const { error } = await admin
    .from('purchases')
    .update({ status: 'cancelled' })
    .eq('payment_id', paymentId)

  if (error) throw error
}

/* ════════════════════════════════════════════════════════════════
   ▌ 코드 + 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   purchase.service.ts — 실제 DB 작업 계층 ("주방")
   · route.ts(접수처)가 DB 작업을 여기에 "위임" → 여기서 supabase에 insert
   · 3층 위임: route.ts → createPurchase(여기) → Supabase/DB(RLS 검사) → 저장

   함수 4개
     createPurchase          : 주문 1건 'pending'으로 저장 (+ payment_id 발급)
     getPurchaseByPaymentId  : payment_id로 주문 1건 조회 (검증 때 금액 대조용)
     markPurchasePaid        : 검증 통과 주문을 'paid'로   (service role)
     markPurchaseCancelled   : 취소된 주문을 'cancelled'로 (service role)


   ─────────────────────────────────────────────
   ★ 이 파일의 핵심: 클라이언트 2종 (server vs admin)
   ─────────────────────────────────────────────
   · createClient()      = 서버용 일반 클라이언트 → RLS 적용됨 (insert/select에 사용)
   · createAdminClient() = service role 클라이언트 → RLS "우회" (update에 사용)

   ⚠️ 왜 update는 admin(service role)인가?
     purchases 테이블 RLS가 UPDATE를 막아둠. anon/일반으로 update하면
     "에러 없이 0건만 바뀌는" 조용한 실패 → 상태가 pending에 묶여버림.
     markPurchasePaid/Cancelled는 "이미 서버에서 결제 검증을 통과한" 신뢰된
     작업이므로, RLS를 우회(admin)해도 안전하다.
   → 규칙: 안전이 확인 안 된 입력은 RLS로 막고, 검증 끝난 서버 작업만 우회.


   ─────────────────────────────────────────────
   ★ .insert → .select() → .single() — 3단이 각각 왜 필요한가
   ─────────────────────────────────────────────
   .insert(...)            "이 데이터 넣어줘"
                           → 저장은 하는데 뭘 저장했는지 안 돌려줌 (완료 처리만)
   .select()               방금 저장된 그 줄을 도로 꺼내서 줌
                           → 왜? 저장돼봐야 알 수 있는 값이 있음 (id, created_at 등
                             DB가 자동으로 채우는 값) → 완성된 주문 1건을 손에 쥐려고
   .single()               원래 결과는 배열 → 상자 벗기고 객체 하나로

   결과 모양 비교
     .select()            → [{ id, payment_id, … }]   배열(상자 안에 하나)  → data[0].id
     .select().single()   → { id, payment_id, … }     객체(알맹이만)        → data.id ✅


   ─────────────────────────────────────────────
   ★ snake_case ↔ camelCase — 어느 쪽이 누구 이름인가
   ─────────────────────────────────────────────
     payment_id : paymentId
     ───┬────    ───┬────
        │            └ camelCase = 내가 지은 JS 변수 값 (내 맘대로 바꿔도 됨)
        └ snake_case = DB 칸(컬럼) 이름 — DB 스키마가 정함 (고정)
   → 왼쪽(키) = DB가 정한 칸 이름 / 오른쪽(값) = 그 칸에 넣을 JS 값


   ─────────────────────────────────────────────
   1. createPurchase — 주문을 'pending'으로 저장
   ─────────────────────────────────────────────
   export async function createPurchase(input): Promise<Purchase> {
     const supabase = await createClient()          // 서버용(RLS 적용)

     const paymentId = crypto.randomUUID()
     // · crypto = 브라우저·서버에 기본 내장된 "도구상자" (보안/랜덤 관련)
     //   crypto.randomUUID = 그 상자 안의 도구를 가리킴 → () = 실행!
     // · 결제 고유번호 생성 (충돌 없는 랜덤 ID) — "서버에서 만든 값"
     // · PortOne 결제창에 paymentId로 그대로 넘김
     // · 결제 끝난 뒤 "이 결제가 그 주문 맞아?" 매칭하는 열쇠
     //   (route.ts의 body엔 없던 값 → 여기서 덧붙여 저장)

     const { data, error } = await supabase
     // · supabase 응답을 { data, error } 객체 하나에 담아 돌려줌 → 구조분해로 꺼냄
     //   성공이면 error = null / 실패면 data = null
       .from('purchases')
       .insert({
         payment_id: paymentId,      // DB칸(snake) : JS값(camel)
         ...주문정보,
         status: 'pending',
       })
       .select()      // 방금 넣은 행을 되돌려 받기 (id·created_at 등 자동값 포함)
       .single()      // 배열 벗기고 객체 1개로

     if (error) throw error
     // · "supabase가 에러 줬네? 난 처리 안 하고 던진다 — 나를 부른 놈(route.ts)한테"
     // · throw 즉시 createPurchase는 멈춤(튕김) → route.ts의 catch가 받아 500
     return data as Purchase   // ← 이 return이 route.ts의 purchase 변수로 돌아감
   }
   // ★ 여기선 아직 돈 안 받음(pending). 실제 결제 확정은
   //   verifyPayment(서버 검증) → markPurchasePaid 에서 이뤄진다.


   ─────────────────────────────────────────────
   2. getPurchaseByPaymentId — 검증용 조회
   ─────────────────────────────────────────────
   export async function getPurchaseByPaymentId(paymentId): Promise<Purchase | null> {
     const supabase = await createClient()
     const { data, error } = await supabase
       .from('purchases').select().eq('payment_id', paymentId).single()

     if (error) return null    // ★ 여기선 throw 대신 null (없을 수 있는 조회라)
     return data as Purchase
   }
   // · 결제 검증 단계에서 "사용자가 결제한 금액" vs "우리가 저장한 주문 금액"
   //   이 같은지 비교하려고 꺼내온다 (금액 위조 방지)


   ─────────────────────────────────────────────
   3. markPurchasePaid — 'paid'로 확정 (service role)
   ─────────────────────────────────────────────
   export async function markPurchasePaid(paymentId): Promise<void> {
     const admin = createAdminClient()               // ★ RLS 우회 (위 ⚠️ 참고)
     const { error } = await admin
       .from('purchases').update({ status: 'paid' }).eq('payment_id', paymentId)
     if (error) throw error
   }
   // · 반드시 "서버에서 PortOne 검증을 통과한 뒤에만" 호출
   //   (프론트 말만 믿고 바꾸면 안 됨 — 위조 위험)
   // · 반환값 없음(void): 상태만 바꾸면 끝 → { error }만 구조분해 (data 안 씀)


   ─────────────────────────────────────────────
   4. markPurchaseCancelled — 'cancelled'로 (service role)
   ─────────────────────────────────────────────
   export async function markPurchaseCancelled(paymentId): Promise<void> {
     const admin = createAdminClient()               // 3번과 같은 이유로 admin
     const { error } = await admin
       .from('purchases').update({ status: 'cancelled' }).eq('payment_id', paymentId)
     if (error) throw error
   }
   // · 반드시 "서버에서 PortOne 취소가 성공한 뒤에만" 호출


   ─────────────────────────────────────────────
   상태 흐름 (status 라이프사이클)
   ─────────────────────────────────────────────
   createPurchase        결제 검증(서버)           결제 취소(서버)
       │                      │                        │
       ▼                      ▼                        ▼
   [pending] ──────────▶ [paid]                  [cancelled]
   (주문 생성,           (markPurchasePaid,        (markPurchaseCancelled,
    돈 아직 X)            service role)             service role)


   ─────────────────────────────────────────────
   헷갈릴 때 메모
   ─────────────────────────────────────────────
   · createClient(server) vs createAdminClient
       insert/select = 서버 일반(RLS 적용)  /  update = admin(RLS 우회)
       → "검증 끝난 신뢰 작업"만 우회, 나머지는 RLS로 막는다

   · anon으로 RLS 막힌 update = 조용한 0건 실패 (에러 안 나고 안 바뀜) → 함정

   · .insert / .select() / .single()
       insert만  → 저장은 되나 결과 안 줌
       + select  → 저장된 행 도로 받기 (id·created_at 등 DB 자동값 확인 가능)
       + single  → 배열 [{…}] 벗겨 객체 {…} 로 → data.id 로 바로 접근

   · snake_case(왼쪽 키) = DB 칸 이름(스키마가 정함, 고정)
     camelCase(오른쪽 값) = 내 JS 변수(내가 지음, 변경 가능)

   · crypto = 내장 도구상자 / crypto.randomUUID = 그 안의 도구 / () = 실행

   · payment_id = crypto.randomUUID()
       주문 ↔ PortOne 결제를 잇는 열쇠. 생성은 createPurchase 한 곳에서만.

   · throw vs return null
       createPurchase/mark…  → 실패면 throw (있어야 하는 작업)
       getPurchaseByPaymentId → 실패면 null (없을 수도 있는 조회)

   · throw는 "나를 부른 쪽"으로 던진다
       service가 throw → route.ts의 catch가 받음 → 500 응답
   ════════════════════════════════════════════════════════════════ */
