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

// 4. cartStore.ts 클라이언트 데이터 훅 (zustand)
import { persist } from ''
import { create } from ''


interface CartItem {
    id: string
    slug: string
    name: string
    price_krw: number
    price_usd: number
    image: string
    quantity: number
}

interface CartStore {
    items: CartItem[]
    isOpen: boolean
    addItem: (item: Omit <CartItem, 'quantity'> => void)
    removeItem: (id: string => void)
    updateItem: (id: string, quantity: number => void)
}


export const useCartStore = create<CartStore>()(
    persist((set,get) => ({
        items:[],
        isOpen: false,
        addItem: (item) =>
            set((state) => {
                const existing = state.items.find((i) =>
                    i.id === item.id)

                if (existing) {
                    return {
                        items: state.items.map((i) =>
                            i.id === item.id ? {
                                ...i, quantity: i.quantity + 1
                            } : i
                        )
                    }
                }
                return {
                    items: [...state.items, {...item, quantity: 1}]
                }
                }
            ),
        removeItem: (id) =>
            set((state) =>
                items: state.items.filter((i) =>
                    i.id !== item.id
                )
        ),
        quantityUpdate: (id, quantity) =>
            set((state) =>
                items: quantity === 0 ?
                    state.items.filter((i) =>
                        i.id !== item.id
                    :
                    state.items.map((i) =>
                        i.id === item.id ? {...i, quantity} : i
                    )
// quantity가 0이 아니면...?
                )
            ),
            clearCart: () => set({ items: [] }),
    }))

)


```
