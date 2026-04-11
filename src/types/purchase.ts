export type PurchaseStatus = 'pending' | 'paid' | 'cancelled'

export interface Purchase {
  id: string
  product_id: string
  product_name: string
  quantity: number
  price_krw: number
  price_usd: number | null
  buyer_name: string
  buyer_phone: string
  buyer_address: string
  status: PurchaseStatus
  created_at: string
}

export type CreatePurchaseInput = Omit<Purchase, 'id' | 'status' | 'created_at' | 'buyer_name' | 'buyer_phone' | 'buyer_address'>
