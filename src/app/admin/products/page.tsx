'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  useAdminProducts,
  useDeleteProduct,
} from '@/lib/queries/useAdminProducts'
import { formatKRW } from '@/lib/utils/formatPrice'
import Text from '@/components/ui/Text/Text'

export default function AdminProductsPage() {
  const { data: products, isLoading, isError } = useAdminProducts()
  const deleteProduct = useDeleteProduct()

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`"${name}" 상품을 삭제할까요? 되돌릴 수 없어요.`)) return
    deleteProduct.mutate(id)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Text
            as="h1"
            className="text-[20px] font-semibold text-[var(--color-ink)]"
          >
            상품 관리
          </Text>
          <Text
            as="p"
            className="mt-1 text-[12px] text-[var(--color-ink-muted)]"
          >
            {products ? `총 ${products.length}개` : ' '}
          </Text>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-[var(--color-ink)] px-4 py-2.5 text-[13px] font-medium text-white transition-opacity hover:opacity-90"
        >
          + 새 상품
        </Link>
      </div>

      {isLoading && (
        <Text
          as="p"
          className="py-16 text-center text-[13px] text-[var(--color-ink-muted)]"
        >
          불러오는 중…
        </Text>
      )}
      {isError && (
        <Text as="p" className="py-16 text-center text-[13px] text-red-500">
          불러오지 못했어요. 로그인 상태를 확인해주세요.
        </Text>
      )}

      {products && products.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#ddd] py-16 text-center">
          <Text as="p" className="text-[13px] text-[var(--color-ink-muted)]">
            아직 상품이 없어요. 첫 상품을 등록해보세요.
          </Text>
        </div>
      )}

      {products && products.length > 0 && (
        <ul className="space-y-2">
          {products.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-sm"
            >
              {/* 썸네일 */}
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[var(--color-cloud)]">
                {p.images?.[0] && (
                  <Image
                    src={p.images[0]}
                    alt={p.name}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                )}
              </div>

              {/* 정보 */}
              <div className="min-w-0 flex-1">
                <Text
                  as="p"
                  className="truncate text-[14px] font-medium text-[var(--color-ink)]"
                >
                  {p.name}
                </Text>
                <Text
                  as="p"
                  className="text-[12px] text-[var(--color-ink-muted)]"
                >
                  {formatKRW(p.price_krw)} · 재고 {p.stock}
                </Text>
              </div>

              {/* 상태 뱃지 */}
              <div className="flex shrink-0 gap-1.5">
                <Text
                  as="span"
                  className={
                    p.is_active
                      ? 'rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600'
                      : 'rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500'
                  }
                >
                  {p.is_active ? '공개' : '비공개'}
                </Text>
                {p.status === 'sold_out' && (
                  <Text
                    as="span"
                    className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-500"
                  >
                    품절
                  </Text>
                )}
              </div>

              {/* 액션 */}
              <div className="flex shrink-0 items-center gap-3 text-[12px]">
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                >
                  수정
                </Link>
                <button
                  onClick={() => handleDelete(p.id, p.name)}
                  disabled={deleteProduct.isPending}
                  className="text-red-400 hover:text-red-600 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
