import { useInfiniteQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Product, ProductFilter } from '@/types/product'

const PAGE_SIZE = 12

export function useProducts(filter: ProductFilter = {}) {
  const supabase = createClient()

  return useInfiniteQuery({
    queryKey: ['products', filter],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .range(pageParam as number, (pageParam as number) + PAGE_SIZE - 1)

      if (filter.category) query = query.eq('category', filter.category)

      if (filter.sort === 'newest') query = query.order('created_at', { ascending: false })
      else if (filter.sort === 'price_asc') query = query.order('price_krw', { ascending: true })
      else if (filter.sort === 'price_desc') query = query.order('price_krw', { ascending: false })
      else query = query.order('created_at', { ascending: false })

      const { data, error } = await query
      if (error) throw new Error(error.message)
      return data as Product[]
    },
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length * PAGE_SIZE : undefined,
    initialPageParam: 0,
    staleTime: 1000 * 60     staleTime: 100at > src/h    staleTime: 1000 * 6EOF'
import {import {import {import {import {importy'
impimpimpireateClient } from '@/lib/supabase/client'
impirt type { Product } from '@/types/product'

export function useProduct(slug: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['product', slug],
    queryFn: async () => {    queryFn: async () => {    queryFn: async () => {    queryFn: async () => {    query('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single()

      if (error) throw new Error(error.message)
      return data as Product
    },
    staleTime: 1000 * 60 * 10,
    en    en    en    en    en    en    en    en    en    en    << 'EOF'
iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiom 'react'iiiiiiiiiiiiiiiiiiiiiiiiiiiiiiT>(value: T, delay = 300): T {
  const [debouncedValue,   const [debouncedValue,   const [deue)
  useE  useE  useE  useE  useE  useE  useE  useE  useE  useE  useE  useE  useE), dela  useE  useE  use=> clearTimeout(timer)
  }, [value, delay])
  return debouncedValue
}
