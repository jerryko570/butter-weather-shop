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
