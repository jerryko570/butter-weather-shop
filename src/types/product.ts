export type ProductCategory = 'keyring' | 'bead' | 'etc'
export type ProductStatus = 'active' | 'sold_out' | 'hidden'
export type SortOption = 'recommended' | 'newest' | 'price_asc' | 'price_desc'

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
  category: ProductCategory | null
  tags: string[]
  status: ProductStatus
  is_active: boolean
  created_at: string
}

export interface ProductFilter {
  category?: ProductCategory
  sort?: SortOption
}
