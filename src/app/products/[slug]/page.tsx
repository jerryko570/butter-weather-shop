'use client'

import { useParams } from 'next/navigation'
import { useProduct } from '@/lib/queries/useProducts'
import { usePurchase } from '@/hooks/usePurchase'
import { formatKRW } from '@/lib/utils/formatPrice'
import { useState } from 'react'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { data: product, isLoading, error } = useProduct(slug)
  const purchase = usePurchase()

  const [quantity, setQuantity] = useState(1)
  const [buyerName, setBuyerName] = useState('')
  const [buyerPhone, setBuyerPhone] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')

  if (isLoading) {
    return (
      <main className="mx-auto max-w-[var(--container-max)] px-4 py-12">
        <p className="text-[var(--color-ink-muted)]">상품을 불러오는 중...</p>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-[var(--container-max)] px-4 py-12">
        <p className="text-red-500">상품을 찾을 수 없습니다.</p>
      </main>
    )
  }

  const handlePurchase = () => {
    purchase.mutate({
      product_id: product.id,
      product_name: product.name,
      quantity,
      price_krw: product.price_krw * quantity,
      price_usd: product.price_usd ? product.price_usd * quantity : null,
      buyer_name: buyerName,
      buyer_phone: buyerPhone,
      buyer_address: buyerAddress,
    })
  }

  return (
    <main className="mx-auto max-w-[var(--container-max)] px-4 py-12">
      <div className="grid gap-10 md:grid-cols-2">
        {/* 상품 이미지 */}
        <div className="aspect-square overflow-hidden rounded-2xl bg-[var(--color-butter-light)]">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--color-ink-subtle)]">
              이미지 없음
            </div>
          )}
        </div>

        {/* 상품 정보 + 주문 폼 */}
        <div className="flex flex-col gap-6">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.name_en && (
              <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
                {product.name_en}
              </p>
            )}
          </div>

          <p className="text-2xl font-semibold text-[var(--color-butter-dark)]">
            {formatKRW(product.price_krw)}
          </p>

          {product.description && (
            <p className="text-[var(--color-ink-muted)]">
              {product.description}
            </p>
          )}

          {/* 수량 */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium">수량</label>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-md border text-lg"
            >
              -
            </button>
            <span className="w-8 text-center">{quantity}</span>
            <button
              type="button"
              onClick={() =>
                setQuantity((q) => Math.min(product.stock, q + 1))
              }
              className="flex h-8 w-8 items-center justify-center rounded-md border text-lg"
            >
              +
            </button>
            <span className="text-xs text-[var(--color-ink-subtle)]">
              (재고: {product.stock})
            </span>
          </div>

          {/* 주문자 정보 */}
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">주문자 정보</h2>
            <input
              type="text"
              placeholder="이름"
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-butter)]"
            />
            <input
              type="tel"
              placeholder="전화번호"
              value={buyerPhone}
              onChange={(e) => setBuyerPhone(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-butter)]"
            />
            <input
              type="text"
              placeholder="주소"
              value={buyerAddress}
              onChange={(e) => setBuyerAddress(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--color-butter)]"
            />
          </div>

          {/* 바로 주문 버튼 */}
          <button
            type="button"
            onClick={handlePurchase}
            disabled={
              purchase.isPending ||
              !buyerName ||
              !buyerPhone ||
              !buyerAddress
            }
            className="rounded-xl bg-[var(--color-butter)] px-6 py-3 text-lg font-bold text-[var(--color-ink)] transition-colors duration-[var(--duration-fast)] hover:bg-[var(--color-butter-dark)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {purchase.isPending ? '주문 처리 중...' : '바로 주문'}
          </button>

          {/* 결과 피드백 */}
          {purchase.isSuccess && (
            <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
              주문이 완료되었습니다!
            </p>
          )}
          {purchase.isError && (
            <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {purchase.error.message}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}
