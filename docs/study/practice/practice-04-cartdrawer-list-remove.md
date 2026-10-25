```ts
// 자ㅡ 나는 이제 결제하기 버튼을 누르면 supabase에 저장되어 있는 purchase 테이블에서 필요한 데이터만 가지고 올거야. 그 전에 데이터 타입먼저 구성할거야

// 내가 구매하는 과정을 status 3단계로 나눠서 타입 덩어리로 지정했어
export type PurchaseStatus = 'pending' | 'paid' | 'cancelled'

// purchase 테이블 데이터들 모두 타입으로 지정함
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
  status: PurchaseStatus
  payment_id: string
}

// Omit을 활용해서 서버에서 받는 데이터를 사용자가 입력할 때 제외한다
export type CreatePurchaseInput = Omit<
  Purchase,
  | 'id'
  | 'created_at'
  | 'buyer_phone'
  | 'buyer_name'
  | 'buyer_address'
  | 'status'
  | 'payment_id'
>

// usePurchase.ts
import { useMutation } from '@tanstack/react-query'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {}

// 타입은 완성했고, Page에서
```
