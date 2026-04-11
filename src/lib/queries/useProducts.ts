// 상품 데이터를 가져오는 hook 함수 (DB랑 연결하려고 createClient 함수 사용)

// useQuery: 한 번 조회하는 기본 훅 (그냥 조회, 단일 조회, 상세 조회)
// useInfiniteQuery: 여러 페이지를 계속 이어서 가져오는 훅 (이어서 조회, 무한 조회, 리스트 조회)
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'

// Supabase 연결 함수 import
import { createClient } from '@/lib/supabase/client'

// Product라는 데이터 모양을 정의한 타입
import type { Product } from '@/types/product'

const PAGE_SIZE = 12

// supabase에서 상품 목록을 페이지 단위로 계속 가지고 오는 무한 스크롤 훅
//
export const useProducts = (category?: string) => {
  const supabase = createClient()
  return useInfiniteQuery({
    queryKey: ['products', category],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .range(pageParam as number, (pageParam as number) + PAGE_SIZE - 1)
        .order('created_at', { ascending: false })
      if (category) query = query.eq('category', category)
      const { data, error } = await query
      if (error) throw error
      return data as Product[]
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60 * 5,
  })
}

export const useProduct = (slug: string) => {
  const supabase = createClient()
  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .single()
      if (error) throw error
      return data as Product
    },
    staleTime: 1000 * 60 * 10,
  })
}
