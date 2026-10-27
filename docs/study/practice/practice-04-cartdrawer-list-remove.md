```ts
// supabase DB table -> purchase의 아이템을 타입으로 구조화 한다.

export type PurchaseStatus = 'pending' | 'paid' | 'cancelled'

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

export type CreateInputPurchase = Omit<
  Purchase,
  'id' | 'created_at' | 'buyer_phone' | 'buyer_address' | 'payment_id'
>

// hooks/usePurchase.ts (API 커스텀 훅)
import { useMutaion } from '@tanstack/react-query'
import { CreatePurchase, Purchase } from '@/types/purchase'

async function postPurchase(input: CreateInputPurchase): Promise<Purchase> {
  const res = await fetch('/api/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if(!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? '주문실풰')
  }

  return res.json()
}


export const usePurchase = {
  return {
    useMutation({
      mutationFn: postPurchase
    })
  }
}
```
