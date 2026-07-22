/* ════════════════════════════════════════════════════════════════
   
   ════════════════════════════════════════════════════════════════ */

import { useMutation } from '@tanstack/react-query'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const res = await fetch('/api/purchases', {
    //  ㄴ 한번에 하나만 (error, data)
    // 성공이면, 201+purchase
    // 실패면, 400/500 + error (catch throw)
    // 나가는 것: fetch 인자로 나감 | 들어오는 것: res 서버 답장 (성공+실패)
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? '주문에 실패했습니다.')
    // RQ: throw 됐네? 실패! isError = true, error = Error 담음 -> 상태를 갈아끼움
  }

  return res.json() // 알맹이 꺼냄
  // 네트워크 전송은 이미 끝남 (브라우저 안에서 벌어지는 일)
  // res가 브라우저에 담긴 순간, 국경 넘기는 일은 끝남 -> 개봉 + 반환
  // 브라우저 안 -> 리액트쿼리 (로컬반환 X)
  // 문자열 -> 객체 | return은 그 객체를 reactQuery에게 돌려줌 -> RQ가 onSuccess
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
   ★★ fetch는 400·500을 "실패"로 안 친다 (그래서 내가 판정)
   ─────────────────────────────────────────────
   · fetch 입장: 400이든 201이든 "봉투(응답)를 무사히 받아왔으면" 그건 성공.
     → 400·500을 받아도 fetch 자체는 throw 안 함 (네트워크가 끊긴 게 아니니까)
   · 그래서 성패 판정은 내가 직접: if (!res.ok) → 실패면 throw
   · 순서: ① fetch는 무조건 먼저 실행돼 res에 봉투 담김
           ② res.ok(겉면)로 성패 판단
           ③ 실패면 봉투 열어 { error } 꺼내 throw

   ★ throw하면 무슨 일?
     postPurchase가 throw → React Query가 그 에러를 잡아 "꾸러미 상태를 갈아끼움"
       isError: false → true (그리고 error 칸에 담음)
     → 컴포넌트는 isError를 보고 에러 UI를 그림


   ─────────────────────────────────────────────
   ★★ res에 담기는 건 "답장"이지 내가 보낸 body가 아니다
   ─────────────────────────────────────────────
   const  res   =  await fetch(주소, { …body… })
   ────┬────      ─────────┬──────────────────
       │                   └ 인자(넣는 것) = 나가는 편지 (내가 보냄)
       └ 반환값(나오는 것) = 답장 (서버가 보냄)

   · ❌ "보낸 데이터가 res에 저장된다"  ← 흔한 오해
   · ✅ body는 이미 나갔고 res엔 안 남음 → res는 "답장만" 받는다
     (body는 fetch 설정객체의 key(칸) — 거기에 보낼 내용을 넣는 것뿐)
   · 담는 주체 = fetch(브라우저) / 봉투(응답)를 만들어 보낸 쪽 = Next.js(서버)


   ─────────────────────────────────────────────
   ★ 봉투(res) 안에 뭐가 있나 — 겉면 vs 알맹이
   ─────────────────────────────────────────────
   res = 응답 전체 = 상태코드(status) + 헤더 + body(문자열, 아직 안 풀림)

     res.ok        → 겉면만 확인 (봉투 안 열어도 됨) → 2xx면 true
     res.json()    → 봉투를 열어 (문자열 → 객체) body를 꺼냄

   · 성공 봉투 안 → purchase (주문 데이터)
   · 실패 봉투 안 → { error: '…' }
     → 둘 다 똑같이 res 봉투로 온다. 겉면(status)만 다를 뿐
   → 그래서 순서: res.ok로 성패 판단 → 그 다음 res.json()으로 알맹이 꺼내기


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
       body: JSON.stringify(input),                 // 보낼 내용을 담는 칸: 객체 → 문자열 (네트워크는 문자만)
     })
     //   ↑ res         ↑ 주소(인자)        ↑ 설정객체(HTTP 정보)
     //   답장 저장
     //
     // ★ 400이든 201이든 fetch는 "무조건 먼저" 실행돼 res에 봉투가 담김
     //     (400을 받아도 fetch는 실패로 안 침 — 봉투를 무사히 받았으니까)
     // ★ fetch 인자 2개 = (주소 문자열, 설정객체 { method, headers, body })
     // ★ fetch가 "보내기 + 받기"를 다 함 → 답장이 res에 담김
     //     res = 응답 전체 (상태코드 + 헤더 + body 문자열, 아직 안 풀림)
     // · await = 답장 올 때까지 기다림 (네트워크) → 그 사이 isPending = true
     //
     // ★ 주소·method → 어느 파일의 어느 함수로?
     //     '/api/purchases' = 파일(route.ts) / 'POST' = 그 파일의 POST 함수
     //   → Next.js가 경로·이름으로 "라벨 붙여" 연결

     if (!res.ok) {
       // · ★ 400인지 여기서 판단 — res.ok(겉면)만 확인 (2xx면 true)
       const { error } = await res.json()
       // · 실패 봉투를 열어 { error } 메시지를 꺼냄 (문자열 → 객체, value만 구조분해)
       throw new Error(error ?? '주문에 실패했습니다.')   // 서버 메시지 없으면 기본 문구
       // · ★ throw → React Query가 잡아서 꾸러미 상태 갈아끼움 (isError: false→true)
     }
     // · fetch는 4xx·5xx도 throw 안 함 → 실패는 내가 직접 던져야 isError로 잡힘

     return res.json()
     // · 성공 봉투를 열어 꺼낸 객체 → 이게 진짜 purchase
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
   · fetch는 4xx·5xx를 실패로 안 침 (봉투만 무사히 받으면 성공)
       → 성패 판정은 내가 res.ok로 / 실패면 throw
       → throw하면 React Query가 상태 갈아끼움 (isError false→true)

   · const 변수 = 함수(인자)   좌우 구분
       왼쪽(res)  = 반환값 = 답장(서버가 보냄)
       오른쪽(인자) = 나가는 편지(내가 보냄)
       → body는 나갔고 res엔 안 남음. res는 답장만!

   · 봉투 열기 순서
       res.ok     → 겉면(status) 확인, 안 열어도 됨
       res.json() → 봉투 열어 body 꺼내기 (성공=purchase / 실패={error})

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
       res        → 응답 전체 (status·헤더·body문자열)  ← ok는 () 없음, 저장된 값
       res.json() → 봉투 열어 꺼낸 객체                ← () 있음, 함수 실행

   · fetch 정리
       인자 2개 = (주소, 설정객체{method,headers,body})
       보내기 + 받기 다 함 → res = 돌아온 답장
       fetch 자체는 브라우저 내장함수(발송 주체)

   · 주소·method → 파일·함수 매핑
       '/api/purchases'(주소) → route.ts(파일) / 'POST'(method) → POST 함수
       Next.js가 이름으로 연결

   · JSON.stringify  ↔  request.json()   (정반대 짝)
       stringify      = 객체 → 문자열 (보낼 때, 브라우저)
       request.json() = 문자열 → 객체 (받을 때, 서버 route.ts)

   · async / await
       await = 답장 올 때까지 기다림 → 그 사이 isPending = true

   · ?? (널 병합)
       error ?? '기본문구'  = error 있으면 그것, null/undefined면 기본문구

   · 꾸러미: useMutation은 { mutate, isPending, isError, isSuccess, data } 반환
   ════════════════════════════════════════════════════════════════ */
