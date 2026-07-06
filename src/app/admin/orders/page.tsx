'use client'

import { useAdminOrders, useCancelOrder } from '@/lib/queries/useAdminOrders'
import { formatKRW } from '@/lib/utils/formatPrice'
import type { PurchaseStatus } from '@/types/purchase'
import Text from '@/components/ui/Text/Text'

// 상태별 뱃지 색/문구
const STATUS_BADGE: Record<PurchaseStatus, { label: string; className: string }> =
  {
    paid: {
      label: '결제완료',
      className: 'bg-green-50 text-green-600',
    },
    pending: {
      label: '결제대기',
      className: 'bg-gray-100 text-gray-500',
    },
    cancelled: {
      label: '취소됨',
      className: 'bg-red-50 text-red-500',
    },
  }

export default function AdminOrdersPage() {
  const { data: orders, isLoading, isError, error } = useAdminOrders()
  const cancelOrder = useCancelOrder()

  const handleCancel = (paymentId: string, productName: string) => {
    if (
      !confirm(
        `"${productName}" 주문을 결제 취소(환불)할까요?\n포트원에 실제 취소 요청이 들어갑니다.`
      )
    )
      return
    cancelOrder.mutate(paymentId, {
      onError: (e) => alert(e instanceof Error ? e.message : '취소 실패'),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <Text
          as="h1"
          className="text-[20px] font-semibold text-[var(--color-ink)]"
        >
          주문 관리
        </Text>
        <Text as="p" className="mt-1 text-[12px] text-[var(--color-ink-muted)]">
          {orders ? `총 ${orders.length}건` : ' '}
        </Text>
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
          {error instanceof Error
            ? error.message
            : '불러오지 못했어요. 로그인 상태를 확인해주세요.'}
        </Text>
      )}

      {orders && orders.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#ddd] py-16 text-center">
          <Text as="p" className="text-[13px] text-[var(--color-ink-muted)]">
            아직 주문이 없어요.
          </Text>
        </div>
      )}

      {orders && orders.length > 0 && (
        <ul className="space-y-2">
          {orders.map((o) => {
            const badge = STATUS_BADGE[o.status]
            // 취소는 "결제완료(paid)"인 주문만 가능. 대기·이미취소는 비활성.
            const canCancel = o.status === 'paid'
            return (
              <li
                key={o.id}
                className="flex items-center gap-4 rounded-xl bg-white p-4 shadow-sm"
              >
                {/* 정보 */}
                <div className="min-w-0 flex-1">
                  <Text
                    as="p"
                    className="truncate text-[14px] font-medium text-[var(--color-ink)]"
                  >
                    {o.product_name}
                    <span className="ml-1.5 text-[var(--color-ink-muted)]">
                      × {o.quantity}
                    </span>
                  </Text>
                  <Text
                    as="p"
                    className="mt-0.5 text-[11px] text-[var(--color-ink-muted)]"
                  >
                    {formatKRW(o.price_krw)} ·{' '}
                    {new Date(o.created_at).toLocaleString('ko-KR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </Text>
                </div>

                {/* 상태 뱃지 */}
                <Text
                  as="span"
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.className}`}
                >
                  {badge.label}
                </Text>

                {/* 취소 버튼 */}
                <button
                  onClick={() => handleCancel(o.payment_id, o.product_name)}
                  disabled={!canCancel || cancelOrder.isPending}
                  className="shrink-0 rounded-lg border border-[#e5e5e5] px-3 py-1.5 text-[12px] text-red-500 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-[#eee] disabled:text-[#ccc] disabled:hover:bg-transparent"
                >
                  {cancelOrder.isPending && cancelOrder.variables === o.payment_id
                    ? '취소 중…'
                    : '결제 취소'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
