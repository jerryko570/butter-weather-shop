import { createClient } from '@/lib/supabase/server'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

/**
 주문 1건을 DB에 'pending'(결제대기)으로 저장한다.
 - 이때 payment_id(결제 고유번호)를 새로 만들어 같이 저장한다.
   -> 이 값을 PortOne 결제창에 넘기고, 결제가 끝난 뒤 "이 결제가 그 주문 맞아?"를 매칭하는 열쇠로 쓴다.
 - 아직 돈은 안 받은 상태. 실제 결제 성공은 verifyPayment 후 markPurchasePaid에서 확정된다.
*/
export async function createPurchase(
  input: CreatePurchaseInput
): Promise<Purchase> {
  const supabase = await createClient()

  // 결제 고유번호 생성 (충돌 없는 랜덤 ID). PortOne의 paymentId로 그대로 사용한다.
  const paymentId = crypto.randomUUID()

  const { data, error } = await supabase
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

/**
 payment_id로 주문 1건을 찾아온다.
 - 결제 검증 단계에서 "사용자가 결제한 금액"과 "우리가 저장해둔 주문 금액"이 같은지 비교하려고 꺼내온다.
*/
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

/**
 결제가 진짜로 확인된 주문을 'paid'(결제완료)로 바꾼다.
 - 반드시 서버에서 PortOne 검증을 통과한 뒤에만 호출할 것. (프론트 말만 믿고 바꾸면 안 됨)
*/
export async function markPurchasePaid(paymentId: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('purchases')
    .update({ status: 'paid' })
    .eq('payment_id', paymentId)

  if (error) throw error
}
