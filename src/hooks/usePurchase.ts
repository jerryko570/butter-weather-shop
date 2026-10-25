import { useMutation } from '@tanstack/react-query'
import type { CreatePurchaseInput, Purchase } from '@/types/purchase'

async function postPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const res = await fetch('/api/purchases', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!res.ok) {
    const { error } = await res.json()
    throw new Error(error ?? '주문에 실패했습니다.')
  }

  return res.json()
}

export const usePurchase = () => {
  return useMutation({
    mutationFn: postPurchase,
  })
}

/* ════════════════════════════════════════════════════════════════
   ▌ 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   목차
     0. 한눈에 보기
     1. 이 파일의 자리 — cartStore와 정반대 축
     2. postPurchase — 서버에 쏘는 함수
     3. 응답은 2단계 — res vs res.json()
     4. 에러 처리 — throw가 신호다
     5. useMutation — 실행이 아니라 "배선"
     6. 꾸러미 — mutate · isPending · isError · error
     7. 전체 흐름 타임라인
     8. useQuery vs useMutation
     9. 헷갈릴 때 메모


   ═════════════════════════════════════════════
   0. 한눈에 보기
   ═════════════════════════════════════════════
   usePurchase.ts — 주문을 서버로 보내는 다리

   ★ 이 파일엔 조각이 딱 두 개다
       postPurchase   실제로 서버에 쏘는 함수 (fetch)        ← 일꾼
       usePurchase    그 함수를 useMutation에 연결한 훅       ← 배선

   ⭐️ 한 줄 흐름
       mutate(주문데이터) → postPurchase 실행 → fetch로 전송 → 응답 반환

   ★ 네트워크라 "시간이 걸린다"는 게 이 파일의 전제
     · 그래서 await로 기다리고, 기다리는 동안 isPending = true
     · cartStore(즉시 끝남)와 가장 크게 다른 점


   ═════════════════════════════════════════════
   1. 이 파일의 자리 — cartStore와 정반대 축
   ═════════════════════════════════════════════
   page(화면) ──→ usePurchase(이 파일) ──→ /api/purchases ──→ DB
                      React Query            서버 라우트

   ★★ 같은 "쓰기"지만 성격이 정반대다
       cartStore(addItem)        usePurchase(mutate)
         Zustand                   React Query
         브라우저가 주인            서버가 주인
         네트워크 X                 네트워크 O
         즉시 완료                  시간이 걸림 (await)
         실패 없음                  실패 가능 (isError)
         로딩 상태 없음             isPending 있음
     · ★ 그래서 담기 버튼엔 로딩 문구가 없고, 주문 버튼엔 있는 것

   ★ 왜 주문은 서버로 보내나
     · 돈·영구 기록이라서. 브라우저 값은 사용자가 고칠 수 있다
     · 금액 검증은 반드시 서버에서 (10번 설계 판단과 같은 기준)


   ═════════════════════════════════════════════
   2. postPurchase — 서버에 쏘는 함수
   ═════════════════════════════════════════════
   async function postPurchase(input: CreatePurchaseInput): Promise<Purchase>
                  ─────┬─────   ──────────┬──────────       ───────┬──────
                    함수 이름        받는 재료(매개변수)        돌려주는 값
                                                          (Promise로 감싼 Purchase)

   ★ async / await 한 쌍
       async  "이 함수 안에 기다릴 게 있다"는 표시
       await  "응답이 올 때까지 여기서 멈춰라"
     · ★ await가 붙은 줄은 끝나야 다음 줄로 간다
     · Promise<Purchase> = "지금은 없지만 나중에 Purchase를 줄게"라는 약속

   ─── fetch 한 줄씩 ───
   fetch('/api/purchases', {          ← 인자1: 어디로
     method: 'POST',                  ← 인자2: 어떻게 (옵션 객체)
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify(input),
   })

   ★ 옵션 3개가 하는 일
       method   'POST' = 보내는 요청 (GET은 가져오는 요청)
       headers  "지금 보내는 몸통은 JSON이다"라고 서버에 알려줌
       body     실제로 실어 보내는 내용물

   ★★ ⭐️ JSON.stringify(input) — 왜 문자열로 바꾸나
     · 네트워크로는 "글자"만 보낼 수 있다. 객체는 그대로 못 간다
     · 그래서 객체 → 문자열로 납작하게 펴서 보냄
         { product_id: 'abc', quantity: 2 }
              ↓ JSON.stringify
         '{"product_id":"abc","quantity":2}'
     · 받는 쪽(서버)은 거꾸로 풀어서 객체로 되돌린다
     · ★ headers의 'application/json' 이 "이건 JSON 문자열이야"라는 안내문

   ★★ input은 어디서 오나 = mutate가 넣어준다
       purchase.mutate({ product_id, quantity, … })   ← page에서 부름
                       └────────┬────────┘
                         이 객체가 input 자리로 꽂힘
     · ★ cartStore의 addItem(item)과 완전히 같은 구조
         부르는 쪽이 값을 넣고, 정의한 쪽이 매개변수로 받는다
     · 내가 mutate에 넣은 값 = postPurchase의 input = fetch의 body


   ═════════════════════════════════════════════
   3. 응답은 2단계 — res vs res.json()
   ═════════════════════════════════════════════
   ⭐️ await가 두 번 나오는 이유 = 응답이 두 겹이기 때문

       const res = await fetch(…)    ① 봉투가 도착
       return res.json()             ② 봉투를 열어 알맹이를 꺼냄

   ★★ 봉투 vs 알맹이
       res         상태코드 · 헤더 · "성공했나?" 정보    ← 봉투
       res.json()  서버가 보낸 진짜 데이터 (JSON)        ← 알맹이
     · ★ res 자체엔 데이터가 없다. 한 번 더 꺼내야 나온다
     · res.json()도 시간이 걸려서 Promise를 돌려준다 (그래서 await 대상)

   ★ 여기선 왜 return에 await를 안 붙였나?
       return res.json()         ○ Promise를 그대로 돌려줌
       return await res.json()   ○ 똑같이 동작 (풀었다가 다시 감쌀 뿐)
     · async 함수의 리턴은 자동으로 Promise에 감싸진다 → 둘 다 맞음
     · ★ 단, 에러 처리를 try/catch로 할 땐 await를 붙여야 잡힌다

   ★ 반대로 위쪽 에러 블록에선 await를 붙였다
       const { error } = await res.json()
     · 여기선 error 값을 "지금 당장" 꺼내 써야 하니까 기다려야 함


   ═════════════════════════════════════════════
   4. 에러 처리 — throw가 신호다
   ═════════════════════════════════════════════
   if (!res.ok) {
     const { error } = await res.json()
     throw new Error(error ?? '주문에 실패했습니다.')
   }

   ★ res.ok = 상태코드가 200~299면 true
     · !res.ok = "서버가 거절했다" → 400, 404, 500 등
     · ⚠️ fetch는 404·500에도 에러를 안 던진다 — 봉투는 왔으니까
       → 그래서 내가 직접 !res.ok를 확인해서 던져줘야 한다

   ★★ ⭐️ React Query와의 약속 — throw냐 아니냐로 판정한다
       throw 했다          → 실패로 본다 → isError = true, error에 담김
       throw 없이 리턴했다  → 성공으로 본다 → onSuccess 호출
     · ★ 성공/실패를 내가 플래그로 알려주는 게 아니라, 던지냐 마냐로 알린다
     · 그래서 이 함수엔 "성공했어요" 같은 리턴이 없다. 그냥 데이터만 돌려줌

   ★ error ?? '주문에 실패했습니다.'
     · ?? = "왼쪽이 null/undefined면 오른쪽을 써라"
     · 서버가 에러 메시지를 안 줬을 때를 대비한 기본 문구
     · 이 문구가 page의 {(purchase.error)?.message} 자리에 그대로 뜬다

   ★ 구조분해로 꺼낸 error
       const { error } = await res.json()
     · 서버가 { error: '재고가 부족합니다' } 를 보냈다고 가정하고 꺼내는 것
     · 없는 키를 꺼내면 undefined → 그래서 ?? 기본값이 필요


   ═════════════════════════════════════════════
   5. useMutation — 실행이 아니라 "배선"
   ═════════════════════════════════════════════
   export const usePurchase = () => {
     return useMutation({
       mutationFn: postPurchase,
     })
   }

   ★★ ⭐️ postPurchase 뒤에 괄호가 없다 = 지금 실행하는 게 아니다
       mutationFn: postPurchase     ○ 함수 자체를 넘김 (등록)
       mutationFn: postPurchase()   ✗ 지금 실행해서 결과를 넘김 → 에러
     · ★ cartStore의 "괄호 붙였으면 지금 실행 / 안 붙였으면 나중에 남이 실행"과 동일
     · page의 onClick={handleAddToCart} 와도 같은 규칙

   ★ useMutation이 하는 일 = 연결만
     · "나중에 mutate가 불리면 이 함수를 실행해라"라고 선을 이어두는 것
     · 이 줄에서는 서버로 아무것도 안 간다
     · 실행 주체 = React Query (내가 아니라)

   ★ 훅 이름에 use가 붙은 이유
     · 안에서 React Query의 상태(isPending 등)를 쓰기 때문 = 훅
     · 그래서 컴포넌트 맨 위에서만 부를 수 있다 (조건문 안 X)


   ═════════════════════════════════════════════
   6. 꾸러미 — mutate · isPending · isError · error
   ═════════════════════════════════════════════
   const purchase = usePurchase()
                              ─┬─
                        실행해서 "꾸러미"를 받는다

   ★ 꾸러미 안에 들어 있는 것
       purchase.mutate      실제로 보내는 함수 ← 방아쇠
       purchase.isPending   보내는 중?  → 버튼 비활성화 · '주문 생성 중...'
       purchase.isError     실패했나?
       purchase.error       실패 이유 (내가 throw한 Error가 여기 담김)
       purchase.data        성공 시 받은 데이터

   ★★ mutate에 두 번째 인자로 콜백을 줄 수 있다
       purchase.mutate(주문데이터, {
         onSuccess: (createdPurchase) => { … },
         onError:   (err) => { … },
       })
     · ⭐️ createdPurchase = postPurchase가 return한 값이 그대로 들어온다
     · ★ 내가 채우는 게 아니라 React Query가 채워주는 매개변수
       (cartStore의 "부르는 사람 = 채우는 사람"과 같은 규칙)

   ★ mutate vs mutateAsync
       mutate        결과를 콜백(onSuccess)으로 받는다. await 불가
       mutateAsync   Promise를 돌려줘서 await로 받을 수 있다
     · 이 프로젝트는 중첩 onSuccess로 순서를 잡고 있어서 mutate를 씀


   ═════════════════════════════════════════════
   7. 전체 흐름 타임라인
   ═════════════════════════════════════════════
   [페이지 진입]  const purchase = usePurchase()
                  → useMutation 꾸러미 생성. 서버엔 아무 일도 안 일어남

   [버튼 클릭]    purchase.mutate(주문데이터)
                  → isPending = true (버튼 비활성화 · 문구 바뀜)
                  → postPurchase(주문데이터) 실행
                  → fetch로 POST 전송 … 기다리는 중 …

   [서버 응답]    ┌ 성공(2xx) → res.json() 반환 → isPending = false
                  │             → onSuccess(createdPurchase) 호출
                  └ 실패       → throw → isError = true, error에 메시지
                                → 화면에 에러 문구 표시

   ★ 이 파일의 일은 "보내고 결과를 돌려주기"까지
     · 성공 팝업을 띄우거나 결제창을 여는 건 page가 onSuccess에서 한다
     · ★ 역할 분리: 이 파일 = 통신 / page = 그 다음에 뭘 할지


   ═════════════════════════════════════════════
   8. useQuery vs useMutation
   ═════════════════════════════════════════════
       useQuery (useProducts)          useMutation (여기)
         읽기 🔵                          쓰기 🔴
         화면에 뜨면 자동 실행              내가 mutate를 불러야 실행
         캐시 O · staleTime O             캐시 X (매번 새 요청)
         isLoading                        isPending
         queryKey 필요                    queryKey 없음

   ★ 한 줄 판정
       가져오는 것 → useQuery / 보내는 것 → useMutation
     · 조회는 여러 번 해도 안전하지만, 주문은 두 번 보내면 안 되니까
       자동 실행이 아니라 "내가 부를 때만" 실행되는 것


   ═════════════════════════════════════════════
   9. 헷갈릴 때 메모
   ═════════════════════════════════════════════
   · 조각 둘: postPurchase(일꾼, fetch) / usePurchase(배선, useMutation)

   · ⭐️ mutationFn: postPurchase — 괄호 없음 = 등록만. mutate()를 불러야 실행
       (cartStore의 "괄호 붙였으면 지금 / 안 붙였으면 나중에"와 같은 규칙)

   · mutate(데이터) → 그 데이터가 postPurchase의 input → fetch의 body
       cartStore의 addItem(item)과 같은 "넣는 쪽 / 받는 쪽" 구조

   · ⭐️ JSON.stringify = 객체를 문자열로 펴기 (네트워크엔 글자만 보낼 수 있음)
       headers의 'application/json' = "이건 JSON이야"라는 안내문

   · ⭐️ 응답은 2단계 — res(봉투: 상태코드·헤더) / res.json()(알맹이: 진짜 데이터)
       그래서 await가 두 번. res만 받으면 데이터가 없다

   · ⚠️ fetch는 404·500에도 에러를 안 던진다 → !res.ok를 내가 확인해야 함

   · ⭐️ React Query와의 약속
       throw 했다 → 실패 (isError) / 무사히 리턴 → 성공 (onSuccess)
       성공 여부를 플래그가 아니라 "던지냐 마냐"로 알린다

   · ?? = 왼쪽이 null·undefined면 오른쪽 (에러 메시지 기본값)

   · 꾸러미: mutate / isPending / isError / error / data
       isPending으로 버튼 비활성화 + 문구 교체 (별도 상태 안 만들어도 됨)

   · onSuccess(createdPurchase)의 인자 = postPurchase가 return한 값
       내가 채우는 게 아니라 React Query가 채워준다

   · cartStore(Zustand) vs 여기(React Query)
       브라우저가 주인 / 서버가 주인
       즉시·실패없음 / 느림·실패가능 → 그래서 isPending·isError가 있다

   · 가져오면 useQuery 🔵 / 보내면 useMutation 🔴
       조회는 자동 실행, 주문은 내가 부를 때만 (두 번 보내면 안 되니까)

   · 이 파일의 일은 "보내고 돌려주기"까지. 그 다음 행동은 page가 한다
   ════════════════════════════════════════════════════════════════ */
