/* ════════════════════════════════════════════════════════════════
   ▌ 코드 원본 ─ 주석 없이 실제로 돌아가는 코드
   ════════════════════════════════════════════════════════════════ */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

// createPurchase (동사) : 만들다 (함수)
// createdPurchase (명사) : 결과물
export async function createPurchase(
  input: CreatePurchaseInput
): Promise<Purchase> {
  const supabase = await createClient()

  const paymentId = crypto.randomUUID()
  //      ㄴ 나온 결과값을 넣는다     ㄴ () 붙음 -> 지금 실행 -> 결과가 튀어나옴 (문자열을 담음) : 결제아이디

  const { data, error } = await supabase
    // 전송 -> supabase 안에서 쿼리체인 -> SQL로 변환 -> Postgres 실행 -> 결과를 {data, error} 한 객체로 포장해 돌려줌
    // 한덩어리의 객체를 전달 받은게 아닌, createPurchase가 깔끔하게 정리한 결과 하나를 받음
    .from('purchases')
    .insert({
      payment_id: paymentId,
      product_id: input.product_id,
      product_name: input.product_name,
      quantity: input.quantity,
      price_krw: input.price_krw,
      price_usd: input.price_usd,
      total_price: input.price_krw,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
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
   ★★ insert는 RLS "프리패스" — 진짜 방어선은 돈이 움직이는 곳
   ─────────────────────────────────────────────
   · createPurchase의 insert = RLS에 "주문 넣기 허용" 정책이 있어서
     일반 createClient로도 문을 통과함 → 누구나 주문 생성(insert) 가능
   · 왜 느슨하게? 주문 "생성"만으론 돈이 안 움직임 (status: pending일 뿐)
   · ★ 진짜 방어선은 돈이 확정되는 곳(update: paid) → 거긴 RLS가 막고 admin만 통과
   → 정리: insert 문턱은 낮게(프리패스), update 문턱은 높게(admin 전용)


   ─────────────────────────────────────────────
   ★ createClient()에 await 붙는 이유 = 쿠키 읽기 (네트워크 X)
   ─────────────────────────────────────────────
   const supabase = await createClient()
   · 여기서 DB에 가는 게 아님. 서버 클라이언트가 "쿠키(cookie)"를 읽어야 해서 await
   · 실제 DB 왕복은 그 연장을 써서 .insert()/.select() 할 때 (아래 await supabase…) 일어남
   → 같은 await라도: createClient=쿠키 읽기 / await supabase.…=DB 왕복 (원인 다름)


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
   ★ insert 필드는 누가 채우나 — server vs user
   ─────────────────────────────────────────────
     payment_id   ← server  (crypto.randomUUID())
     product_id   ← user    (input)
     product_name ← user    (input)
     quantity     ← user    (input)
     price_krw    ← user    (input)
     price_usd    ← user    (input)
     total_price  ← server  (input 값으로 계산)
     status       ← server  (고정값 'pending')
   → user(손님이 보낸 것)와 server(내가 만든/정한 것)를 한 행에 섞어 저장
     (돈·상태 관련은 server가 정함 = 손님이 못 건드림)


   ─────────────────────────────────────────────
   ★ .insert → .select() → .single() — 3단이 각각 왜 필요한가
   ─────────────────────────────────────────────
   .insert(...)            "이 데이터 넣어줘" → 저장은 하나 뭘 저장했는지 안 돌려줌
   .select()               방금 저장된 그 줄을 도로 꺼내서 줌
                           → id, created_at 등 "저장돼봐야 아는 DB 자동값" 때문
   .single()               원래 결과는 배열 → 상자 벗기고 객체 하나로

   결과 모양 비교
     .select()            → [{ id, payment_id, … }]   배열  → data[0].id
     .select().single()   → { id, payment_id, … }     객체  → data.id ✅

   ★ 왜 점(.)으로 이어 붙이나 (쿼리 체인)
     각각 따로 DB에 갔다 오는 게 아님. "주문서 한 장"을 조금씩 채우는 것.
     .from → .insert → .select → .single 로 요구사항을 쌓고,
     마지막에 await 한 번으로 DB에 쏜다.


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
   // · input = 매개변수(받는 곳). route.ts가 준 인자(넣는 곳)를 여기서 받음
     const supabase = await createClient()          // 서버용(RLS 적용) / await = 쿠키 읽기

     const paymentId = crypto.randomUUID()
     // · crypto = 브라우저·서버 양쪽에 기본 내장된 "도구상자" (전역 객체)
     //     서버(Node, route.ts, service)에도 있어서 여기서 써도 이슈 없음
     //   crypto.randomUUID = 상자 안 도구(랜덤 UUID 기계) → () = 실행 스위치
     //   결과 = 36글자 랜덤 고유번호 (충돌 없는 ID) — "서버에서 만든 값"
     // · payment_id = 주문 ↔ PortOne 결제를 잇는 열쇠
     //   (route.ts의 body엔 없던 값 → 여기서 덧붙여 저장)

     const { data, error } = await supabase   // ★ 이 await가 진짜 DB 왕복
     //   성공이면 error = null / 실패면 data = null
       .from('purchases')
       .insert({
         payment_id: paymentId,      // DB칸(snake) : JS값(camel)  / server 발급
         ...주문정보(user),           // product_id·name·quantity·price = 손님 input
         total_price: input.price_krw, // server 계산값
         status: 'pending',          // server 고정값
       })
       .select()      // 자동 생성값(id·created_at) 도로 받기
       .single()      // 배열 벗기고 객체 1개로

     if (error) throw error
     // · "supabase가 에러 줬네? 난 처리 안 하고 던진다 — 나를 부른 route.ts한테"
     // · throw 즉시 createPurchase 멈춤(튕김) → route.ts의 catch가 받아 500
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
     const admin = createAdminClient()               // ★ RLS 우회 (진짜 방어선 지점)
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
       │  insert=프리패스     │  update=admin만        │  update=admin만
       ▼                      ▼                        ▼
   [pending] ──────────▶ [paid]                  [cancelled]
   (누구나 생성,          (markPurchasePaid,        (markPurchaseCancelled,
    돈 아직 X)            service role)             service role)


   ─────────────────────────────────────────────
   헷갈릴 때 메모
   ─────────────────────────────────────────────
   · insert = RLS 프리패스(누구나 주문 생성) / update = 돈 움직임 → admin만
       진짜 방어선은 pending 생성이 아니라 paid 확정 쪽

   · await 두 종류 (같은 파일 안에서도)
       await createClient()  → 쿠키 읽기 (네트워크 X)
       await supabase.…      → 실제 DB 왕복

   · insert 필드 출처: server(payment_id·total_price·status) vs user(input 나머지)
       돈·상태는 server가 정함 = 손님이 못 건드림

   · createClient(server) vs createAdminClient
       insert/select = 서버 일반(RLS 적용)  /  update = admin(RLS 우회)

   · anon으로 RLS 막힌 update = 조용한 0건 실패 (에러 안 나고 안 바뀜) → 함정

   · 쿼리 체인(.from.insert.select.single) = 주문서 한 장 채우기
       각각 DB 왕복 아님. 다 쌓은 뒤 마지막 await 한 번에 쏨

   · .insert / .select() / .single()
       insert만→결과 없음 / +select→자동값 도로 받기 / +single→배열 벗겨 객체

   · snake_case(왼쪽 키)=DB 칸 이름(고정) / camelCase(오른쪽 값)=내 JS 변수

   · crypto = 내장 도구상자 / crypto.randomUUID = 그 안의 도구 / () = 실행

   · throw vs return null
       createPurchase/mark…  → 실패면 throw (있어야 하는 작업)
       getPurchaseByPaymentId → 실패면 null (없을 수도 있는 조회)

   · throw는 "나를 부른 쪽"으로 던진다 → route.ts catch → 500
   ════════════════════════════════════════════════════════════════ */
