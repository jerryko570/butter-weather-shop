```ts
// 🟢. supabase에서 purchase DB 체크하고 타입으로 정의한다.

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

export type CreatePurchaseInput = Omit<
  Purchase,
  | 'id'
  | 'created_at'
  | 'status'
  | 'payment_id'
  | 'buyer_name'
  | 'buyer_phone'
  | 'buyer_address'
>

import { usePurchase } from '@/hooks/usePurchase'
import { usePayment } from '@/hooks/usePayment'
import { useProduct } from '@/lib/queries/useProducts'

export default function Page() {
  const purchase = usePurchase()
  const payment = usePayment()
  const { data: product, isLoading, error } = useProduct(slug)

  const handlePurchase = () => {
    purchase.mutate(
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        price_krw: product.price_krw * quantity,
        price_usd: product.price_usd ? price_usd * quantity : null,
      },
      {
        onSuccess: (createdPurchase) => {
          payment.mutate((createdPurchase) => {
            onSuccess: () => {
              trackEvent('purchase', {
                product_id: product.id,
                product_name: product.name,
                quantity: product.quantity,
                price_krw: product.price_krw * quantity,
              })
              setShowSuccess()
            }
          })
        },
      }
    )
  }
}
```
