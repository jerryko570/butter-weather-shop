// 상품 데이터 타입 정의 (실제 Supabase products 테이블 컬럼과 1:1)
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
  images: string[] // 대표/갤러리 이미지 (썸네일·상단 큰 이미지)
  detail_images: string[] // 상세페이지 설명 이미지 (세로로 길게 쌓이는 스마트스토어식)
  category: string | null
  tags: string[]
  options: string[] // 선택지 목록 (예: ['그린','블루']). 없으면 빈 배열
  status: ProductStatus // 판매 상태 (active / sold_out 등) — 공개 여부와는 별개
  is_active: boolean // 공개(노출) 여부. RLS·훅에서 published 기준으로 쓰는 플래그
  created_at: string
  updated_at: string
}

export type ProductCategory = 'keyring' | 'bead' | 'etc'

// status: 판매 상태. (is_active=노출여부와 혼동 주의)
export type ProductStatus = 'active' | 'sold_out'
