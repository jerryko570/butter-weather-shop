import { createClient } from '@/lib/supabase/server'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

export async function createPurchase(
  input: CreatePurchaseInput
): Promise<Purchase> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .insert({
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
