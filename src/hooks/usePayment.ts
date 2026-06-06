/**
 usePayment.ts - 결제창을 띄우고, 결제 결과를 서버에 검증시키는 다리 역할

 [흐름]
 1. payWithPortOne(purchase) 호출
 2. PortOne.requestPayment(...)  -> 결제창이 뜨고, 사용자가 카드/카카오페이 등으로 결제
 3. 결제창이 닫히면서 결과(response)가 돌아옴
 4. 실패/취소면 -> throw (page에서 에러 표시)
 5. 성공이면 -> /api/payments/complete 로 paymentId를 보내 서버 검증 요청
 6. 서버 검증까지 통과해야 진짜 끝 (이때 page가 "주문완료" 팝업을 띄움)

 [핵심]
 - 이 훅은 usePurchase(주문 생성) 다음에 이어서 돈다.
   usePurchase가 만든 주문(payment_id 포함)을 받아 결제창에 넘긴다.
*/

import { useMutation } from '@tanstack/react-query'
import * as PortOne from '@portone/browser-sdk/v2'
import {
  PORTONE_STORE_ID,
  PORTONE_CHANNEL_KEY,
  isPortOneConfigured,
} from '@/lib/portone/config'
import type { Purchase } from '@/types/purchase'

async function payWithPortOne(purchase: Purchase) {
  // 콘솔 키를 아직 .env.local에 안 넣었으면 여기서 친절히 막아준다.
  if (!isPortOneConfigured) {
    throw new Error(
      'PortOne 키가 설정되지 않았습니다. .env.local에 Store ID / Channel Key를 넣어주세요.'
    )
  }

  // 결제창 띄우기. 결제가 끝나거나 취소되면 response가 돌아온다.
  const response = await PortOne.requestPayment({
    storeId: PORTONE_STORE_ID,
    channelKey: PORTONE_CHANNEL_KEY,
    paymentId: purchase.payment_id, // 주문 만들 때 서버가 생성해둔 결제번호
    orderName: purchase.product_name, // 결제창에 표시될 주문명
    totalAmount: purchase.price_krw, // 결제 금액 (원)
    currency: 'CURRENCY_KRW',
    payMethod: 'CARD', // 우선 카드. 나중에 KAKAOPAY/Alipay 등으로 확장 가능
    // 구매자 정보. 이니시스 V2는 email이 필수.
    // ⚠️ 지금은 테스트용 고정값. 실제 서비스에선 주문 폼에서 입력받아 넣어야 함.
    customer: {
      fullName: '테스트 구매자',
      email: 'test@example.com',
      phoneNumber: '010-0000-0000',
    },
  })

  // response.code가 있으면 = 결제 실패 또는 사용자가 취소함
  if (response?.code !== undefined) {
    throw new Error(response.message ?? '결제가 취소되었습니다.')
  }

  // 결제 성공처럼 보여도, 진짜인지 서버에 검증을 맡긴다 (프론트 말은 안 믿음)
  const res = await fetch('/api/payments/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId: purchase.payment_id }),
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? '결제 검증에 실패했습니다.')
  }

  return res.json()
}

export const usePayment = () => {
  return useMutation({
    mutationFn: payWithPortOne,
  })
}

/**
 결제 취소를 서버에 요청하는 함수.
 - paymentId를 /api/payments/cancel 로 보내면, 서버가 PortOne 취소 + DB cancelled 처리를 한다.
*/
async function cancelPaymentRequest(paymentId: string) {
  const res = await fetch('/api/payments/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentId, reason: '고객 요청' }),
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? '결제 취소에 실패했습니다.')
  }

  return res.json()
}

export const useCancelPayment = () => {
  return useMutation({
    mutationFn: cancelPaymentRequest,
  })
}
