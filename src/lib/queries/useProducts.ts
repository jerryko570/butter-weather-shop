import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/product'

const PAGE_SIZE = 12

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
