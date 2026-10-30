```ts
// 🟢 purchase 테이블 DB를 타입 모양으로 정의한다.

export type StatusPurchase = 'pending' | 'paid' | 'cancelled'

export interface Purchase {
  id: string
  product_id: string
  product_name: string
  quantity: number
  total_price: number
  buyer_name: string
  created_at: string
  price_krw: number
  price_usd: number | null
  buyer_phone: string
  buyer_address: string
  status: StatusPurchase
  payment_id: string
}

export type CreatePurchaseInput = Omit<
  Purchase,
  | 'product_id'
  | 'created_at'
  | 'buyer_phone'
  | 'buyer_address'
  | 'status'
  | 'payment_id'
  | 'product_id'
>

// 🟢
```
