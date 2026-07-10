/* ────────────────────────────────────────────────────────────
   usePurchase.ts — 주문을 서버로 보내는 훅  (브라우저 = 거는 쪽)
     ↔ 짝: route.ts (서버 = 받는 쪽)

   · postPurchase : fetch로 실제 주문을 쏘는 함수
   · usePurchase  : postPurchase를 useMutation에 연결한 커스텀 훅

   흐름:  mutate(주문데이터) → postPurchase(fetch POST) → route.ts
          → createPurchase(DB에 씀) → 응답 → res.json() → onSuccess
   ──────────────────────────────────────────────────────────── */

import { useMutation } from '@tanstack/react-query'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const res = await fetch('/api/purchases', {
    method: 'POST', // 쓰기 요청
    headers: { 'Content-Type': 'application/json' }, // 본문이 JSON임을 알림
    body: JSON.stringify(input), // 객체 → 문자열 (네트워크는 문자만 감)
  })

  // fetch는 4xx·5xx도 throw 안 함 → 실패는 직접 던져야 isError로 잡힘
  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? '주문에 실패했습니다.') // 서버 메시지 없으면 기본 문구
  }

  return res.json() // 문자열 → 객체 (풀어서 반환) → onSuccess
}

export const usePurchase = () => {
  return useMutation({
    mutationFn: postPurchase, // () 없이 "함수 자체"만 등록 → mutate() 부를 때 실행됨
  })
}

/* ────────────────────────────────────────────────────────────
   헷갈릴 때 메모
   ────────────────────────────────────────────────────────────
   · useQuery(읽기/GET)   → 화면 뜨면 알아서 조회
     useMutation(쓰기/POST) → mutate() 부를 때만 실행 (주문·삭제·수정)

   · 함수 vs 함수()
       mutationFn: postPurchase   → 넘김 (나중에 실행)
       onClick={handleClick}      → 넘김 (클릭 때 실행)
       onClick={handleClick()}    → 렌더 때 바로 실행돼 버림 ← 실수 주의

   · 연결 vs 실행
       mutationFn: postPurchase   → 지금은 "배선"만
       mutate(데이터)             → 실제 실행 (버튼 누를 때)

   · res vs res.json()
       res        → 봉투 (상태코드·헤더)          ← ok는 () 없음, 저장된 값
       res.json() → 봉투 열어 꺼낸 데이터         ← () 있음, 함수 실행

   · JSON.stringify  ↔  request.json()   (정반대 짝)
       stringify      = 객체 → 문자열 (보낼 때, 브라우저)
       request.json() = 문자열 → 객체 (받을 때, 서버 route.ts)

   · async / await
       await = 응답 올 때까지 기다림 → 그 사이 isPending = true

   · ?? (널 병합)
       error ?? '기본문구'  = error 있으면 그것, null/undefined면 기본문구

   · 꾸러미: useMutation은 { mutate, isPending, isError, isSuccess, data } 반환
   ──────────────────────────────────────────────────────────── */
