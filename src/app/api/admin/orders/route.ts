/**
 * 어드민 주문 API
 *
 *  GET  /api/admin/orders          → 전체 주문 목록 (최신순)
 *  POST /api/admin/orders          → 주문 결제 취소 ({ paymentId, reason })
 *
 * [보안]
 *  - 두 메서드 모두 "로그인한 사용자의 이메일 === ADMIN_EMAIL" 일 때만 통과한다.
 *    (손님이 로그인해도 자기 이메일이 관리자와 다르므로 막힌다)
 *  - 데이터 접근은 service role 클라이언트로 RLS를 우회한다. → 관리자는 모든 주문을 본다.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cancelPortOnePayment } from '@/services/payment.service'

// 로그인 사용자가 관리자 본인인지 확인. 맞으면 null, 아니면 거부 응답을 돌려준다.
async function rejectIfNotAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const adminEmail = process.env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }
  return null
}

// ── 주문 목록 ──
export async function GET() {
  const denied = await rejectIfNotAdmin()
  if (denied) return denied

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('purchases')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('주문 목록 조회 실패:', error)
    return NextResponse.json(
      { error: '주문을 불러오지 못했습니다.' },
      { status: 500 }
    )
  }

  return NextResponse.json(data, { status: 200 })
}

// ── 주문 취소 ──
export async function POST(request: Request) {
  const denied = await rejectIfNotAdmin()
  if (denied) return denied

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

    const admin = createAdminClient()

    // 1) 실제 존재하는 주문인지 + 이미 취소됐는지 확인
    const { data: purchase } = await admin
      .from('purchases')
      .select('payment_id, status')
      .eq('payment_id', paymentId)
      .single()

    if (!purchase) {
      return NextResponse.json(
        { error: '해당 주문을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }
    if (purchase.status === 'cancelled') {
      return NextResponse.json(
        { error: '이미 취소된 주문입니다.' },
        { status: 400 }
      )
    }

    // 2) PortOne에 실제 취소(환불) 요청 — 실패하면 throw → catch
    await cancelPortOnePayment(paymentId, reason ?? '관리자 취소')

    // 3) PortOne 취소 성공 후에만 DB를 cancelled로
    const { error: updateError } = await admin
      .from('purchases')
      .update({ status: 'cancelled' })
      .eq('payment_id', paymentId)

    if (updateError) throw updateError

    return NextResponse.json({ status: 'cancelled' }, { status: 200 })
  } catch (error) {
    console.error('주문 취소 실패:', error)
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
