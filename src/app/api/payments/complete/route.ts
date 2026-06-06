/**
 [결제 완료 확정 API]
 - 프론트가 결제창에서 결제를 마치면 { paymentId }를 들고 이 API를 부른다.
 - 서버는 그 paymentId로:
     1) 우리 DB에서 주문을 찾고 (기대 금액 확보)
     2) PortOne에 진짜 결제됐는지/금액 맞는지 확인하고
     3) 통과하면 주문 상태를 paid로 바꾼다.
 - 이 검증을 통과해야만 프론트가 "주문완료" 팝업을 띄운다.
*/

import { NextResponse } from 'next/server'
import {
  getPurchaseByPaymentId,
  markPurchasePaid,
} from '@/services/purchase.service'
import {
  getPortOnePayment,
  isPaymentValid,
} from '@/services/payment.service'

export async function POST(request: Request) {
  try {
    const { paymentId } = (await request.json()) as { paymentId?: string }

    if (!paymentId) {
      return NextResponse.json(
        { error: 'paymentId가 필요합니다.' },
        { status: 400 }
      )
    }

    // 1) 우리 DB에서 이 결제번호로 만든 주문을 찾는다 (기대 금액을 알아내기 위해)
    const purchase = await getPurchaseByPaymentId(paymentId)
    if (!purchase) {
      return NextResponse.json(
        { error: '해당 주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 2) PortOne에 직접 물어본다: 진짜 결제됐어? 얼마야?
    const payment = await getPortOnePayment(paymentId)

    // 3) 상태가 PAID이고 금액이 주문 금액과 정확히 같은지 확인
    if (!isPaymentValid(payment, purchase.price_krw)) {
      return NextResponse.json(
        { error: '결제 검증에 실패했습니다. (금액 불일치 또는 미결제)' },
        { status: 400 }
      )
    }

    // 4) 검증 통과 -> 주문을 결제완료로 확정
    await markPurchasePaid(paymentId)

    return NextResponse.json({ status: 'paid' }, { status: 200 })
  } catch (error) {
    console.error('Payment completion failed:', error)
    return NextResponse.json(
      { error: '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
