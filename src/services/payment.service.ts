/**
 [이 파일이 하는 일 - 결제의 "진짜 확인" 담당]
 - 프론트가 "결제 끝났어요!" 라고 말해도 그 말을 믿지 않는다.
 - 대신 PortOne 서버에 직접 물어본다: "이 paymentId, 진짜로 결제됐어? 얼마 결제됐어?"
 - 이 확인은 비밀키(API Secret)로 이뤄지므로 반드시 서버에서만 돈다. (브라우저 X)

 [왜 이렇게까지 하나]
 - 결제 성공 신호는 브라우저에서 오는데, 브라우저는 조작이 가능하다.
   누가 결제 안 하고 "성공!" 신호만 위조해 보내면 공짜로 물건을 가져갈 수 있다.
 - 그래서 돈의 출처(PortOne)에 서버가 직접 확인하는 절차가 필수다.
*/

// 서버 전용 비밀키. .env.local의 PORTONE_API_SECRET에서 읽어온다. (NEXT_PUBLIC_ 아님 = 브라우저에 안 나감)
const PORTONE_API_SECRET = process.env.PORTONE_API_SECRET

// PortOne이 결제 1건의 상태를 알려줄 때 주는 응답 중, 우리가 쓰는 부분만 추려낸 타입
interface PortOnePayment {
  status: string // 'PAID' | 'READY' | 'CANCELLED' | 'FAILED' ...
  amount: {
    total: number // 실제 결제된 총액
  }
  currency: string // 'KRW' ...
}

/**
 PortOne 서버에 paymentId로 결제 정보를 조회한다.
 - 성공하면 결제 상태/금액이 담긴 객체를 돌려준다.
*/
export async function getPortOnePayment(
  paymentId: string
): Promise<PortOnePayment> {
  if (!PORTONE_API_SECRET) {
    // .env.local에 키를 아직 안 넣었을 때 바로 알 수 있게 막아둔다.
    throw new Error('PORTONE_API_SECRET이 설정되지 않았습니다. (.env.local 확인)')
  }

  const res = await fetch(
    `https://api.portone.io/payments/${encodeURIComponent(paymentId)}`,
    {
      headers: {
        // PortOne 인증 방식: "PortOne {비밀키}" 형태로 Authorization 헤더에 넣는다.
        Authorization: `PortOne ${PORTONE_API_SECRET}`,
      },
    }
  )

  if (!res.ok) {
    throw new Error('PortOne 결제 조회에 실패했습니다.')
  }

  return res.json() as Promise<PortOnePayment>
}

/**
 결제가 "기대한 그대로" 됐는지 최종 판정한다.
 - 상태가 PAID(결제완료)이고, 결제된 금액이 우리가 주문에 저장해둔 금액과 정확히 같아야 통과.
 - 금액 비교를 꼭 해야 한다: 결제창에서 금액이 바뀌치기 당하는 경우를 막기 위함.
*/
export function isPaymentValid(
  payment: PortOnePayment,
  expectedAmount: number
): boolean {
  return payment.status === 'PAID' && payment.amount.total === expectedAmount
}
