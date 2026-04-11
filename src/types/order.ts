export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'done' | 'cancelled'
export type PaymentMethod = 'toss' | 'stripe'
export type Currency = 'KRW' | 'USD'

export interface ShippingInfo {
  name: string
  phone: string
  address: string
  zipcode: string
}

export interface Order {
  id: string
  user_id: string
  status: OrderStatus
  total_krw: number | null
  total_usd: number | null
  currency: Currency
  payment_method: PaymentMethod | null
  payment_id: string | null
  shipping_info: ShippingInfo | null
  created_at: string
}
