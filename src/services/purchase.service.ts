import { createClient } from '@/lib/supabase/server'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

export async function createPurchase(
  input: CreatePurchaseInput
): Promise<Purchase> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .insert({
      ...input,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data as Purchase
}
