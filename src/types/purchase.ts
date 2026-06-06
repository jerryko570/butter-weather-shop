/**
 주문이 어떻게 생겨야 하는지(전체모양 + 상태종류)를 정해두고 그중 사용자가 직접
 입력할 할목만 따로 추려낸 설명서들
 */

// 구매하는 사용자들의 구매상태 및 구매정보 타입 구성
// PurchaseStatus (구매상태 : 결제대기, 결제완료, 취소)
export type PurchaseStatus = 'pending' | 'paid' | 'cancelled'

// 주문(구매) 한 건의 전체 정보 - 상품+가격+구매자+주문상태 및 시각
export interface Purchase {
  id: string // 주문 고유 번호 (문자)
  payment_id: string // 결제 고유 번호 (PortOne에 넘기고, 나중에 이 값으로 "이 결제=이 주문" 매칭)
  product_id: string // 상품 번호
  product_name: string // 상품 이름
  quantity: number // 수량 (숫자)
  price_krw: number // 원화 가격
  price_usd: number | null // 달러 가격 (숫자 혹은 없음)
  buyer_name: string // 구매자 이름
  buyer_phone: string // 구매자 전화번호
  buyer_address: string // 구매자 주소
  status: PurchaseStatus // 구매 상태
  created_at: string // 생성 시각
}

// 뺄 항목들 외 원본타입을 CreatePurchaseInput이라는 새 설명서로 정의
// 사용자가 직접 입력해야 하는 것만 남기려고 함
export type CreatePurchaseInput = Omit<
  Purchase, //원본 타입 (주문의 전체 모양)
  | 'id'
  | 'payment_id' // 결제번호는 서버가 만들어주므로 사용자 입력에서 제외
  | 'status'
  | 'created_at'
  | 'buyer_name'
  | 'buyer_phone'
  | 'buyer_address'
>
