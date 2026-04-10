export interface Product {
  id: string
  slug: string
  name: string
  name_en: string | null
  description: string | null
  description_en: string | null
  price_krw: number
  price_usd: number | null
  stock: number
  images: string[]
  category: string | null
  tags: string[]
  is_active: boolean
  created_at: string
}

export type ProductCategory = 'keyring' | 'bead' | 'etc'
