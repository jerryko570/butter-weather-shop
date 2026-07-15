/* ════════════════════════════════════════════════════════════════
   const 변수            =    함수(인자)
         ㄴ 반환값(나오는 것)     ㄴ 인자(넣는 것)
         ㄴ 답장(서버)          ㄴ 나가는 편지 (내가 보냄)
         res: 서버의 답장이 들어감 (201, 400)
         보낸 데이터를 res에 저장 XXXX
         res에 담기는 건 내가 보낸 편지 body가 아니라 서버가 보낸 답장
         body는 이미 나갔고 res에 안남음 -> res는 답장만 받음
   ════════════════════════════════════════════════════════════════ */

import { useMutation } from '@tanstack/react-query'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const res = await fetch('/api/purchases', {
    //  ㄴ 응답 전체 (상태코드 + 헤더 + body 문자열)
    // res에 담는 건 fetch(브라우저) / Next.js는 봉투(응답)을 만들어 보낸 족
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    // status 겉면 확인. 안열어도 됨 (201, 400, 500?)
    const { error } = await res.json() // 실패 봉투 열어서 에러 메시지 먼저 꺼냄 ->
    //
    // res.json() = 서버 응답 봉투를 열어 (문자열 -> 객체) body 값 모두 꺼내기
    throw new Error(error ?? '주문에 실패했습니다.')
  }

  return res.json()
  // 봉투 열어 꺼낸 객체 -> 이게 진짜 purchase
  // 성공 봉투 안엔 purchase / 실패 봉투 안엔 {error} 둘다 res 봉투로 옴
}

export const usePurchase = () => {
  return useMutation({
    mutationFn: postPurchase,
  })
}

/* ════════════════════════════════════════════════════════════════
   ▌ 코드 + 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   usePurchase.ts — 주문을 서버로 보내는 훅  (브라우저 = 거는 쪽)
     ↔ 짝: route.ts (서버 = 받는 쪽)

     postPurchase : fetch로 실제 주문을 쏘는 함수
     usePurchase  : postPurchase를 useMutation에 연결한 커스텀 훅

   흐름:  mutate(주문데이터) → postPurchase(fetch POST) → route.ts
          → createPurchase(DB에 씀) → 응답 → res.json() → onSuccess


   ─────────────────────────────────────────────
   0. 목록 조회(useProducts)와 뭐가 다른가
   ─────────────────────────────────────────────
   · useQuery / useInfiniteQuery = "읽기(GET)"      → 화면 뜨면 알아서 조회
   · useMutation                 = "쓰기(POST 등)"  → 내가 mutate() 부를 때만 실행
     (주문·삭제·수정처럼 "내가 일으키는 변화"에 씀)


   ─────────────────────────────────────────────
   1. postPurchase — 서버에 주문 쏘는 함수 (한 줄씩)
   ─────────────────────────────────────────────
   async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {
   // · input  = mutate(주문데이터)로 들어온 값
   // · async  = 안에서 await 쓰겠다는 표시 → 반환은 Promise<Purchase>

     const res = await fetch('/api/purchases', {   // fetch = 브라우저 내장함수 (발송 주체)
       method: 'POST',                              // 쓰기 요청 (종류)
       headers: { 'Content-Type': 'application/json' }, // 본문이 JSON임을 알림 (형식/부가정보)
       body: JSON.stringify(input),                 // 실제 데이터: 객체 → 문자열 (네트워크는 문자만 감)
     })
     // ★ fetch 인자 2개 = (주소 문자열, 설정객체 { method, headers, body })
     // ★ fetch 3부분: method(무엇을) · headers(어떤 형식) · body(실제 내용)
     // ★ fetch가 "보내기 + 받기"를 다 함 → 내 주문(body)이 나가고, 돌아온 응답이 res에 담김
     //     res = 돌아온 응답(봉투: 상태코드·헤더). 아직 알맹이 아님
     // · await = 응답 올 때까지 기다림 (네트워크라 시간 걸림)
     //
     // ★ 주소·method → 어느 파일의 어느 함수로?
     //     '/api/purchases'  = 어느 파일 (app/api/purchases/route.ts)
     //     method: 'POST'    = 그 파일의 어느 함수 (export한 POST)
     //   → Next.js가 경로·이름으로 "라벨 붙여" 연결해준다

     if (!res.ok) {
       const { error } = await res.json()
       throw new Error(error ?? '주문에 실패했습니다.')   // 서버 메시지 없으면 기본 문구
     }
     // · res.ok = 성공(2xx) true / 실패 false
     // · fetch는 4xx·5xx도 throw 안 함 → 실패는 직접 던져야 isError로 잡힘

     return res.json()
     // · 성공이면 봉투에서 진짜 데이터를 꺼내 반환 (문자열 → 객체, 풀어서 반환)
     // · ★ 이 반환값을 React Query가 onSuccess(반환값)으로 넘김 → createdPurchase
   }


   ─────────────────────────────────────────────
   2. usePurchase — 연결(배선)만 하는 훅
   ─────────────────────────────────────────────
   export const usePurchase = () => {
     return useMutation({
       mutationFn: postPurchase,   // () 없이 "함수 자체"만 등록 → mutate() 부를 때 실행됨
     })
   }
   // · () => {} = 화살표 함수. 원래 "이름 없음(익명)"
   //     const usePurchase = … 로 담으면 그 변수명이 함수 이름이 됨
   // · useMutation = 실행이 아니라 "연결(배선)"만 함 (postPurchase를 등록)
   // · 돌려주는 꾸러미: mutate, isPending, isError, isSuccess, data ...


   ─────────────────────────────────────────────
   3. 전체 흐름
   ─────────────────────────────────────────────
   [페이지 진입] const purchase = usePurchase()   // useMutation 꾸러미 생성
   [버튼 클릭]   purchase.mutate(주문데이터)        // → postPurchase → fetch
   [대기 중]     isPending = true                  // 스피너·버튼 비활성 등
   [성공]        onSuccess → 성공 팝업 표시
   [실패]        throw → isError → 에러 메시지 표시


   ─────────────────────────────────────────────
   4. 헷갈릴 때 메모
   ─────────────────────────────────────────────
   · useQuery(읽기/GET)   → 화면 뜨면 알아서 조회
     useMutation(쓰기/POST) → mutate() 부를 때만 실행 (주문·삭제·수정)

   · 함수 vs 함수()
       mutationFn: postPurchase   → 넘김 (나중에 실행)
       onClick={handleClick}      → 넘김 (클릭 때 실행)
       onClick={handleClick()}    → 렌더 때 바로 실행돼 버림 ← 실수 주의

   · 화살표 함수 이름
       () => {}                   → 원래 익명(이름 없음)
       const usePurchase = () =>  → const에 담으면 이름 생김

   · 연결 vs 실행
       mutationFn: postPurchase   → 지금은 "배선"만
       mutate(데이터)             → 실제 실행 (버튼 누를 때)

   · res vs res.json()
       res        → 봉투 (상태코드·헤더)          ← ok는 () 없음, 저장된 값
       res.json() → 봉투 열어 꺼낸 데이터         ← () 있음, 함수 실행

   · fetch 정리
       인자 2개 = (주소, 설정객체{method,headers,body})
       보내기 + 받기 다 함 → res = 돌아온 응답
       fetch 자체는 브라우저 내장함수(발송 주체)

   · 주소·method → 파일·함수 매핑
       '/api/purchases'(주소) → route.ts(파일) / 'POST'(method) → POST 함수
       Next.js가 이름으로 연결

   · JSON.stringify  ↔  request.json()   (정반대 짝)
       stringify      = 객체 → 문자열 (보낼 때, 브라우저)
       request.json() = 문자열 → 객체 (받을 때, 서버 route.ts)

   · async / await
       await = 응답 올 때까지 기다림 → 그 사이 isPending = true

   · ?? (널 병합)
       error ?? '기본문구'  = error 있으면 그것, null/undefined면 기본문구

   · 꾸러미: useMutation은 { mutate, isPending, isError, isSuccess, data } 반환
   ════════════════════════════════════════════════════════════════ */
