'use client'

import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useProduct } from '@/lib/queries/useProducts'
import { usePurchase } from '@/hooks/usePurchase'
import { formatKRW } from '@/lib/utils/formatPrice'
import { useState } from 'react'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  // TanStack
  const { data: product, isLoading, error } = useProduct(slug)
  const purchase = usePurchase()

  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[13px] text-[#aaa]">상품을 불러오는 중...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-[13px] text-red-500">상품을 찾을 수 없습니다.</p>
      </div>
    )
  }

  const handlePurchase = () => {
    purchase.mutate(
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        price_krw: product.price_krw * quantity,
        price_usd: product.price_usd ? product.price_usd * quantity : null,
      },
      {
        onSuccess: () => {
          setShowSuccess(true)
        },
      }
    )
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    router.push('/')
  }

  return (
    <div>
      <div className="grid grid-cols-1 border-b border-[#e5e5e5] md:grid-cols-2">
        {/* 상품 이미지 */}
        <div className="relative flex aspect-square items-center justify-center border-b border-[#e5e5e5] bg-[#f5f5f5] md:border-r md:border-b-0">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-32 w-32 rounded-full bg-[#e0dbd2]" />
          )}
        </div>

        {/* 상품 정보 + 주문 폼 */}
        <div className="flex flex-col justify-between p-8 md:p-12">
          <div className="flex flex-col gap-6">
            {/* 상품명 */}
            <div>
              <p className="mb-2 text-[10px] tracking-[0.14em] text-[#aaa] uppercase">
                {product.category ?? 'Butter Weather'}
              </p>
              <h1 className="font-serif text-[28px] leading-tight text-[#111]">
                {product.name}
              </h1>
              {product.name_en && (
                <p className="mt-1 text-[13px] text-[#aaa]">
                  {product.name_en}
                </p>
              )}
            </div>

            {/* 가격 */}
            <p className="text-[22px] font-medium text-[#111]">
              {formatKRW(product.price_krw)}
            </p>

            {/* 설명 */}
            {product.description && (
              <p className="text-[13px] leading-relaxed font-light text-[#777]">
                {product.description}
              </p>
            )}

            {/* 수량 */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] tracking-widest text-[#aaa] uppercase">
                Qty
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center border border-[#e5e5e5] text-[#555] transition-colors hover:border-[#111]"
              >
                −
              </button>
              <span className="w-6 text-center text-[13px] text-[#111]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="flex h-8 w-8 items-center justify-center border border-[#e5e5e5] text-[#555] transition-colors hover:border-[#111]"
              >
                +
              </button>
              <span className="text-[11px] text-[#bbb]">
                재고 {product.stock}개
              </span>
            </div>

            {/* 구분선 */}
            <div className="border-t border-[#e5e5e5]" />
          </div>

          {/* 주문 버튼 */}
          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={handlePurchase}
              disabled={purchase.isPending}
              className="w-full bg-[#111] py-3.5 text-[11px] tracking-widest text-white uppercase transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {purchase.isPending ? '주문 처리 중...' : '바로 주문'}
            </button>

            {/* 에러 피드백 */}
            {purchase.isError && (
              <p className="text-[12px] text-red-500">
                {purchase.error.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 성공 모달 */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm bg-white p-10 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0ede8]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <h2 className="mb-2 font-serif text-[22px] text-[#111]">
              주문 완료
            </h2>
            <p className="mb-1 text-[13px] text-[#777]">
              {product.name} × {quantity}
            </p>
            <p className="mb-6 text-[15px] font-medium text-[#111]">
              {formatKRW(product.price_krw * quantity)}
            </p>
            <p className="mb-8 text-[12px] leading-relaxed text-[#aaa]">
              주문이 정상적으로 접수되었습니다.
              <br />
              감사합니다!
            </p>
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full bg-[#111] py-3 text-[11px] tracking-widest text-white uppercase transition-colors hover:bg-[#333]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
