/**
 * 주문 생성 API ANDPOINT
 * front(usePurchase)와 DB 로직(Service) 사이의 중간 다리 역할
 * 직접 DB를 만지지 않고 createPurchase에게 위임한다.
 POST 요청이 들어오면 실행되는 비동기 함수다.
 body에 요청 데이터를 JSON으로 꺼내 담고 (CreatePurchaseInput 타입으로 취급)
 필수 4개 중 하나라도 비면 400 검증 (2차 방어선) 에러를 돌려주고 다 있으면 createPurchase로 저장한다.
 201로 성공 응답하고 중간에 터지면 catch가 받아서 500 에러를 돌려준다.
 */

import { NextResponse } from 'next/server'
import { createPurchase } from '@/services/purchase.service'
import type { CreatePurchaseInput } from '@/types/purchase'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreatePurchaseInput

    if (
      !body.product_id ||
      !body.product_name ||
      !body.quantity ||
      !body.price_krw
    ) {
      return NextResponse.json(
        { error: '필수 항목을 모두 입력해주세요.' },
        { status: 400 }
      )
    }

    const purchase = await createPurchase(body)

    return NextResponse.json(purchase, { status: 201 })
  } catch (error) {
    console.error('Purchase creation failed:', error)

    return NextResponse.json(
      { error: '주문 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
