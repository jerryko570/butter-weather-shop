/**
 [결제 취소 API]
 - 프론트가 { paymentId, reason }을 보내면:
     1) 우리 DB에서 주문을 찾고 (없는 결제 취소 막기)
     2) PortOne에 취소(환불) 요청하고
     3) 성공하면 주문 상태를 cancelled로 바꾼다.
 - PortOne 취소가 성공해야만 DB도 cancelled로 바뀐다. (순서 중요)
*/

import { NextResponse } from 'next/server'
import {
  getPurchaseByPaymentId,
  markPurchaseCancelled,
} from '@/services/purchase.service'
import { cancelPortOnePayment } from '@/services/payment.service'

export async function POST(request: Request) {
  try {
    const { paymentId, reason } = (await request.json()) as {
      paymentId?: string
      reason?: string
    }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId가 필요합니다.' },
        { status: 400 }
      )
    }

    // 1) 우리 DB에 실제 존재하는 주문인지 확인
    const purchase = await getPurchaseByPaymentId(paymentId)
    if (!purchase) {
      return NextResponse.json(
        { error: '해당 주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 이미 취소된 주문이면 다시 취소하지 않는다 (중복 취소 방지)
    if (purchase.status === 'cancelled') {
      return NextResponse.json(
        { error: '이미 취소된 주문입니다.' },
        { status: 400 }
      )
    }

    // 2) PortOne에 취소 요청 (실패하면 여기서 throw -> catch로)
    await cancelPortOnePayment(paymentId, reason ?? '고객 요청')

    // 3) PortOne 취소 성공 -> DB도 cancelled로
    await markPurchaseCancelled(paymentId)

    return NextResponse.json({ status: 'cancelled' }, { status: 200 })
  } catch (error) {
    console.error('Payment cancellation failed:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : '결제 취소 중 오류가 발생했습니다.',
      },
      { status: 500 }
    )
  }
}
