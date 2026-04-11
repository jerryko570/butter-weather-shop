import { useCartStore } from '@/store/cartStore'

export function useCart() {
  const store = useCartStore()

  return {
    items: store.items,
    isOpen: store.isOpen,
    totalKrw: store.totalKrw(),
    totalUsd: store.totalUsd(),
    totalCount: store.totalCount(),
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    openCart: store.openCart,
    closeCart: store.closeCart,
  }
}
