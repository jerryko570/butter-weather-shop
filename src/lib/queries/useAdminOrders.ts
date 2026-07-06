import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Purchase } from '@/types/purchase'

/* ═══════════════════════════════════════════════════════════════════
   어드민 전용 주문 훅
   - 상품과 달리 주문(purchases)은 RLS로 막혀 있어서 클라이언트가 직접 못 읽는다.
     → 대신 service role을 쓰는 서버 API(/api/admin/orders)를 거친다.
   - 그 API가 "관리자 이메일"을 확인하므로, 손님은 호출해도 403으로 막힌다.
   ═══════════════════════════════════════════════════════════════════ */

/** 주문 목록 — 전체, 최신순 */
export const useAdminOrders = () => {
  return useQuery({
    queryKey: ['admin', 'orders'],
    queryFn: async (): Promise<Purchase[]> => {
      const res = await fetch('/api/admin/orders')
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? '주문을 불러오지 못했습니다.')
      }
      return res.json()
    },
  })
}

/** 주문 취소 — payment_id로 PortOne 취소 + DB cancelled 처리 */
export const useCancelOrder = () => {
  const qc = useQueryClient()

  return useMutation({
    mutationFn: async (paymentId: string) => {
      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, reason: '관리자 취소' }),
      })
      if (!res.ok) {
        const { error } = await res.json()
        throw new Error(error ?? '결제 취소에 실패했습니다.')
      }
      return res.json()
    },
    // 취소 성공 → 목록 새로고침해서 상태(cancelled) 반영
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'orders'] })
    },
  })
}
