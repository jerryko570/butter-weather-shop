// 상품 데이터 타입 정의
export interface Product {
  id: string
  slug: string
  name: string
  name_en: string | null // 영어 이름 있을 수도 있고 없을 수 도 있음
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
