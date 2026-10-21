'use client'

/**
 * CartDrawer — 오른쪽에서 슬라이드되는 장바구니 패널.
 * · isOpen(Zustand)을 구독해 열림/닫힘. openCart()/closeCart()로 토글.
 * · 서버 안 감(네트워크 X) — items는 전부 로컬(Zustand + localStorage).
 * · 담기·수량변경·삭제 모두 스토어 함수만 호출 → persist가 localStorage 자동 백업.
 */

import Image from 'next/image'
import { useCart } from '@/hooks/useCart'
import { formatKRW } from '@/lib/utils/formatPrice'
import Text from '@/components/ui/Text/Text'

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    clearCart,
    removeItem,
    updateQuantity,
    totalKrw,
    totalCount,
  } = useCart()

  return (
    <>
      {/* 뒷배경 (dim) — 클릭하면 닫힘 */}
      <div
        onClick={closeCart}
        aria-hidden
        className={`fixed inset-0 z-40 cursor-pointer bg-black/30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* 패널 — 오른쪽에서 슬라이드 (isOpen에 따라 translate) */}
      <aside
        className={`fixed top-0 right-0 z-50 flex h-full w-full max-w-100 flex-col bg-white shadow-xl transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
          <Text as="span" variant="label" className="text-ink text-[14px]">
            Cart ({totalCount})
          </Text>
          <button
            type="button"
            onClick={closeCart}
            aria-label="닫기"
            className="text-ink-subtle hover:text-ink cursor-pointer text-[24px] leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* 본문 — 비었으면 안내, 있으면 목록 */}
        {items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <Text as="span" className="text-ink-subtle text-[13px]">
              장바구니가 비어있어요.
            </Text>
          </div>
        ) : (
          <ul className="flex-1 divide-y divide-gray-100 overflow-y-auto">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 px-6 py-5">
                {/* 썸네일 */}
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden bg-gray-100">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="h-8 w-8 rounded-full bg-[#e0dbd2]" />
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <div className="flex items-start justify-between gap-2">
                    <Text as="span" className="text-ink truncate text-[13px]">
                      {item.name}
                    </Text>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="text-ink-subtle hover:text-ink flex-shrink-0 text-[11px] transition-colors"
                    >
                      삭제
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    {/* 수량 스테퍼 — 0이 되면 스토어가 알아서 제거 */}
                    <div className="flex items-center border border-gray-200">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="text-ink-muted hover:text-ink flex h-7 w-7 cursor-pointer items-center justify-center transition-colors"
                      >
                        −
                      </button>
                      <Text
                        as="span"
                        className="text-ink w-7 text-center text-[14px]"
                      >
                        {item.quantity}
                      </Text>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="text-ink-muted hover:text-ink flex h-7 w-7 cursor-pointer items-center justify-center transition-colors"
                      >
                        +
                      </button>
                    </div>

                    {/* 라인 합계 = 단가 × 수량 */}
                    <Text
                      as="span"
                      className="text-ink text-[13px] font-medium"
                    >
                      {formatKRW(item.price_krw * item.quantity)}
                    </Text>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* 푸터 — 합계 + 결제 (결제 페이지는 다음 단계) */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 px-6 py-5">
            <div className="mb-4 flex items-baseline justify-between">
              <Text
                as="span"
                variant="label"
                className="text-ink-subtle text-[11px]"
              >
                Total
              </Text>
              <Text as="p" className="text-ink text-[18px] font-medium">
                {formatKRW(totalKrw)}
              </Text>
            </div>
            {/* TODO: 체크아웃 페이지 연결 (지금은 미배선) */}
            <button
              type="button"
              className="w-full cursor-pointer bg-gray-900 py-3.5 text-[12px] tracking-widest text-white uppercase transition-colors hover:bg-gray-800"
            >
              주문하기
            </button>
            {/* 장바구니 전체 비우기 — clearCart() 호출 */}
            <button
              type="button"
              onClick={clearCart}
              className="text-ink-subtle hover:text-ink mt-2 w-full cursor-pointer py-3 text-[12px] tracking-widest uppercase transition-colors"
            >
              상품 전체 삭제
            </button>
          </div>
        )}
      </aside>
    </>
  )
}
