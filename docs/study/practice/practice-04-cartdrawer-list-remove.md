```ts
// 1. supabase table를 서버 레이어 훅에서 불러온다.

import { createClient } from '@/lib/supabase/client'
import { useQuery, useInfiniteQuery } from '@tanstack/react-query'

export const useProduct = (slug: string) => {
  const supabase = createClient()
  return useQuery({
    queryKey: [''],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products', slug)
        .select('*')
        .eq('slug',slug)
        .eq('is_active', true)
        .single()
        if (error) throw error
        return data
    },
  })
}

// 2. page에서 서버 레이어 훅 데이터를 RQ를 통해 가지고 온다.
import { useProduct } from '@/lib/queries/useProducts'

export default function Page() {
  const { data: product, error } = useProduct()
  const { addItem } = useCart()

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price_krw: product.price_krw,
        price_usd: product.price_usd,
        image: product.images?.[0] ?? '',
      })
    }
  }
}

// 3. useCart.ts (cartStore)
const { useCartStore } from '@/'

export function useCart() {
    const store = useCartStore()

    return {
        items: store.items,
        isOpen: store.isOpen,
        addItem: store.addItem,
        removeItem: store.removeItem,
        clearCart: store.clearCart
    }
}
```
