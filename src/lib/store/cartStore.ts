import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface CartItem {
  id: string
  slug: string
  name: string
  price_krw: number
  price_usd: number | null
  image: string
  quantity: number
}

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  totalKrw: () => number
  totalUsd: () => number
  totalCount: () => number
}

export const useCartStore = create<CartStore>()(
  // 빈 호출 값을 B에 전달 X ->첫 호출이 B를 리턴한다
  // create = ① 타입 저장하고 끝! | ② 스토어 내용 = 실제 스토어 내용물 (persist)을 B가 받아 완성함
  // B = 타입은 정해졌고, 이제 내용물만 주면 완성할게 하고 기다리는 함수 | B(persist(...) -> 기다리던 내용물을 넣어주고 완성)
  // create는 타입(1번) 과 내용물(2번) 을 나눠 받는다. create<타입>() 가 1번(타입)을 처리하고 내용물 기다리는 B를 내놓으면, persist(내용물)를 그 B에 넣는다. → 그래서 B로 들어감.
  persist(
    //create()(persist) -> 두 번 눌러야 스토어가 나옴
    (set, get) => ({
      items: [],
      isOpen: false,
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        }),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity === 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        })),
      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      totalKrw: () =>
        get().items.reduce((sum, i) => sum + i.price_krw * i.quantity, 0),
      totalUsd: () =>
        get().items.reduce(
          (sum, i) => sum + (i.price_usd ?? 0) * i.quantity,
          0
        ),
      totalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'butter-weather-cart' }
  )
)
