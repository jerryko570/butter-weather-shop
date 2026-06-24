import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/types/product'

/* ═══════════════════════════════════════════════════════════════════
   어드민 전용 상품 훅
   - 손님용 useProducts 와 달리 is_active 필터를 걸지 않는다.
     → 미공개(초안) 상품까지 전부 보여줘야 관리가 되니까.
   - 로그인한 관리자만 이 데이터에 접근 가능 (RLS의 "admin manage products" 정책).
   - 쓰기(등록/수정/삭제)도 같은 RLS가 관리자 이메일만 통과시킨다.
   ═══════════════════════════════════════════════════════════════════ */

// 등록/수정 시 폼이 채우는 값. id·시각은 DB가 알아서 만든다.
export type ProductInput = Omit<
  Product,
  'id' | 'created_at' | 'updated_at'
>

/** 목록 — 전체 상품(초안 포함), 최신순 */
export const useAdminProducts = () => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as Product[]
    },
  })
}

/** 단일 — id로 1개 (수정 폼 채울 때) */
export const useAdminProduct = (id?: string) => {
  const supabase = createClient()

  return useQuery({
    queryKey: ['admin', 'product', id],
    enabled: !!id, // id 없으면(=등록 모드) 요청 안 함
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Product
    },
  })
}

/** 등록 */
export const useCreateProduct = () => {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (input: ProductInput) => {
      const { data, error } = await supabase
        .from('products')
        .insert(input)
        .select()
        .single()
      if (error) throw error
      return data as Product
    },
    // 성공하면 목록 캐시를 무효화 → 자동 새로고침
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

/** 수정 */
export const useUpdateProduct = () => {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string
      input: ProductInput
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Product
    },
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
      qc.invalidateQueries({ queryKey: ['admin', 'product', id] })
    },
  })
}

/** 삭제 */
export const useDeleteProduct = () => {
  const supabase = createClient()
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'products'] })
    },
  })
}

/**
 * 이미지 업로드 — Storage 'product-images' 버킷에 올리고 public URL을 돌려준다.
 * 파일명은 충돌 방지를 위해 시각+랜덤으로 만든다.
 */
export const uploadProductImage = async (file: File): Promise<string> => {
  const supabase = createClient()

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}
