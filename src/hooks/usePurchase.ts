/**
 * usePurchase.ts — 주문을 서버로 보내는 다리
 *
 *   postPurchase : 실제로 서버에 주문을 쏘는 함수 (fetch)
 *   usePurchase  : postPurchase를 useMutation에 연결한 커스텀 훅
 *
 * 흐름: mutate(주문데이터) → postPurchase 실행 → fetch로 전송 → 응답 반환
 * 네트워크라 시간이 걸려서 await로 기다리고, 그동안 isPending = true.
 *
 * useMutationdms mutate와 postPurchase를 연결해두고, 내가 mutate(주문데이터)를 부르면
 * 그 데이터가 postPurchase의 input으로 전달되서 fetch로 서버에 보내고 await로 응답을 받아온다.
 */

import { useMutation } from '@tanstack/react-query'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

// 서버에 주문을 보내고 결과를 받아오는 함수
async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const res = await fetch('/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input), // input = mutate(주문데이터)로 들어온 값. 함수 인자로 넘겨준다
    // mutate(데이터) 값이 fetch body에 실어 보냄
  })

  // 응답이 와야 다음 줄로 넘어감. 실패하면 에러를 던져 isError로 잡히게 한다.
  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? '주문에 실패했습니다.')
  }

  return res.json()
  // 서버에 POST -> 응답(res) 받음. 성공이면 데이터를 반환함.
  // res: 서버가 보낸 상태코드, 헤더 -> 한번 더 res.json()으로 꺼내야 결과 데이타가 나옴
  // res.json: 진짜 데이터(json)을 꺼내는 것
  // reactQuery: throw 없이 무사히 돌려줌 -> 성!공! -> onSuccess를 불러줌
}

// postPurchase를 mutationFn에 "등록"만 해두는 훅 (실행 X, 연결 O)
// → 나중에 mutate가 불리는 순간 postPurchase가 실행된다.
export const usePurchase = () => {
  return useMutation({
    // useMutation은 실행이 아닌 연결(배선)만 함
    mutationFn: postPurchase, // ()가 없으니 호출이 아니라 함수 자체를 넘김. mutate()를 불러야 실행 됨
  })
}

/**
 * 전체 흐름
 *   [페이지 진입] const purchase = usePurchase()   // useMutation 꾸러미 생성
 *   [버튼 클릭]   purchase.mutate(주문데이터)        // → postPurchase → fetch
 *   [성공]        onSuccess → 성공 팝업 표시
 *   [실패]        throw → isError → 에러 메시지 표시
 */
