export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'done' | 'cancelled'
export type PaymentMethod = 'toss' | 'stripe'
export type Currency = 'KRW' | 'USD'

export interface ShippingInfo {
  name: string
  phone: string
  address: string
  zipcode: string
  memo?: string // 배송메모(요청사항). shipping_info(jsonb)에 같이 담김 — 별도 컬럼 아님
}

// 주문 1건 = 영수증 표지. 상품 N개는 order_items(줄들)에 따로.
export interface Order {
  id: string
  user_id: string // 로그인 필수 — RLS(orders_own: auth.uid()=user_id)로 강제
  status: OrderStatus
  total_krw: number | null
  total_usd: number | null
  currency: Currency
  payment_method: PaymentMethod | null
  payment_id: string | null
  shipping_info: ShippingInfo | null
  agree_privacy: boolean // 개인정보 수집·이용 동의 (필수 — 주문하려면 true)
  agree_marketing: boolean // 마케팅 수신 동의 (선택)
  created_at: string
}

// 주문 항목 = 영수증 줄. order 1건에 N개.
// product_name·option·price_at_purchase = 주문 시점 박제(스냅샷).
// 현재 사진·재고는 product_id로 products와 JOIN해서 가져온다.
export interface OrderItem {
  id: string
  order_id: string // fk → orders.id (어느 영수증)
  product_id: string | null // fk → products.id (번호표). 상품 삭제 시에도 주문 기록 보존
  product_name: string // 박제 📸
  option: string | null // 박제 📸 (선택한 옵션, 예 '그린'). 옵션 없는 상품은 null
  quantity: number
  price_at_purchase: number // 박제 📸 (그때 단가, 원 단위)
  created_at: string
}
