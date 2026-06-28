'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useProducts } from '@/lib/queries/useProducts'
import { formatKRW } from '@/lib/utils/formatPrice'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'
import { useT } from '@/hooks/useT'
import { localizedName } from '@/lib/i18n/dictionary'
import { Suspense, useCallback } from 'react'
import Text from '@/components/ui/Text/Text'

const CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Keyring', value: 'keyring' },
  { label: 'Bead', value: 'bead' },
  { label: 'Etc', value: 'etc' },
]

export default function ProductsPage() {
  return (
    // ProductsContent가 준비될 때까지 fallback UI를 보여줌
    // 준비 완료되면 자동으로 <ProductsContent/> 으로 바뀜
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Text as="p" className="text-[13px] text-[#aaa]">
            로딩 중...
          </Text>
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}

function ProductsContent() {
  const { locale } = useT()
  const searchParams = useSearchParams()
  const category = searchParams.get('category') ?? undefined
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useProducts(category)

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const loadMoreRef = useIntersectionObserver({
    onIntersect: loadMore,
    enabled: hasNextPage,
  })

  const products = data?.pages.flat() ?? []

  return (
    <div>
      {/* 카테고리 필터 */}
      <div className="flex items-center gap-6 border-b border-[#e5e5e5] px-7 py-4">
        {CATEGORIES.map((cat) => {
          const isActive = (category ?? '') === cat.value
          return (
            <Link
              key={cat.value}
              href={cat.value ? `/products?category=${cat.value}` : '/products'}
              className={`text-[11px] tracking-widest uppercase transition-colors ${
                isActive
                  ? 'border-b border-[#111] pb-0.5 text-[#111]'
                  : 'text-[#aaa] hover:text-[#111]'
              }`}
            >
              {cat.label}
            </Link>
          )
        })}
      </div>

      {/* 로딩 */}
      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <Text as="p" className="text-[13px] text-[#aaa]">
            상품을 불러오는 중...
          </Text>
        </div>
      )}

      {/* 상품 없음 */}
      {!isLoading && products.length === 0 && (
        <div className="flex items-center justify-center py-20">
          <Text as="p" className="text-[13px] text-[#aaa]">
            등록된 상품이 없습니다.
          </Text>
        </div>
      )}

      {/* 상품 그리드 */}
      {products.length > 0 && (
        <div className="grid grid-cols-2 border-b border-[#e5e5e5] md:grid-cols-4">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group border-r border-b border-[#e5e5e5] last:border-r-0 [&:nth-child(2n)]:border-r-0 md:[&:nth-child(2n)]:border-r md:[&:nth-child(4n)]:border-r-0"
            >
              <div className="relative flex aspect-3/4 items-center justify-center overflow-hidden bg-[#f5f5f5]">
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={localizedName(product, locale)}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-[#e0dbd2]" />
                )}
              </div>
              <div className="border-t border-[#e5e5e5] p-4">
                <Text
                  as="p"
                  className="mb-1 text-[10px] tracking-widest text-[#aaa] uppercase"
                >
                  {product.category ?? 'Butter Weather'}
                </Text>
                <Text
                  as="p"
                  className="mb-2 text-[13px] text-[#111] group-hover:underline"
                >
                  {localizedName(product, locale)}
                </Text>
                <Text as="p" className="text-[13px] font-medium text-[#111]">
                  {formatKRW(product.price_krw)}
                </Text>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 무한 스크롤 트리거 */}
      <div ref={loadMoreRef} className="py-8 text-center">
        {isFetchingNextPage && (
          <Text as="p" className="text-[12px] text-[#aaa]">
            더 불러오는 중...
          </Text>
        )}
      </div>
    </div>
  )
}
