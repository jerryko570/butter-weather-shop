import { useMutation } from '@tanstack/react-query'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const res = await fetch('/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? '주문에 실패했습니다.')
  }

  return res.json()
}

export const usePurchase = () => {
  return useMutation({
    mutationFn: postPurchase,
  })
}
