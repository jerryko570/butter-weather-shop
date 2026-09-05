import { useCartStore } from '@/store/cartStore'

export function useCart() {
  const store = useCartStore()

  // store: 값+함수 다 들어있음
  return {
    items: store.items,
    isOpen: store.isOpen,
    addItem: store.addItem, // 🟢 같은 함수를 그대로 넘김
    totalKrw: store.totalKrw(),
    totalUsd: store.totalUsd(),
    totalCount: store.totalCount(),
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    openCart: store.openCart,
    closeCart: store.closeCart,
  }
}

/**
 * useCart = store와 컴포넌트 사이의 창구(경계)
 * cartStore = 주방
 * useCart = 창구
 *  재정의 X, 원본을 '가리키기만'
 * 🟢 컴포넌트가 주방 (store)에 직접 안 들어가고
 * 창구 (useCart) 한테만 주문함
 *
 * 🟢 필요한 이유
 * 1. 계산함수 미리 실행 - 창구에서 미리 처리해서 실수 원천봉쇄
 * 2. 컴포넌트가 store 내부 구조 몰라도 됨 (추상화)
 * - items 가 zustand에 있는지 localStorage에 있는지 이름이 items인제 알 필요 없음 (창구가 다 가려줌)
 * 3. 단일 창구 (일관성)
 * - useCart 하나로 장바구니에 접근함
 * 4. 갈아 끼우기 쉬움
 * - 나중에 store 구조를 바꾸거나 zustand를 딴걸로 교체하거나
 * 장바구니를 서버 DB 저장으로 바꿔두 useCart 내부만 고치면 끝
 *
 *  🟢 useCart는 store와 컴포넌트 사이 추상화 경계
 *
 */
