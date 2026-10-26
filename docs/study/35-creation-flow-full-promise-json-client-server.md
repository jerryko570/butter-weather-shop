# 35. 생성 흐름 전체(실행순서·JSON 왕복·Promise/await) + 타입vs값 + 클라훅vs서버 + mutate vs mutateAsync

> 한 줄: **생성 흐름 실행순서 = usePurchase(배선, 렌더) → 클릭 mutate(데이터) → postPurchase 실행 → 그 안에서 fetch → res.json() → return Promise → React Query가 await로 풀어 → onSuccess(createdPurchase) → payment.mutate → 팝업. 데이터는 객체→문자열(stringify, 보낼때)→문자열(응답)→객체(res.json, 받을때) 왕복(네트워크 구간만 문자열). Promise<Purchase>=「곧 Purchase 객체 줄게」시간 약속(진동벨), await는 「그 값을 지금 쓸 때」만(error 블록 O / return X=받는쪽 React Query가 await). 타입(설계도)≠값(실제 객체). usePurchase=클라이언트 훅(서버 API를 "호출"할 뿐, 서버에서 도는 게 아님). mutate=콜백 중첩/mutateAsync=await 평평.**
> fetch/에러·?? [[34-fetch-structure-error-handling-nullish]] · 타입적용·Promise·제네릭 [[33-type-apply-generics-hook-kinds-promise]] · 입구·useMutation 꾸러미 [[31-entry-point-mutate-chain-createdpurchase]] · 심기vs누르기 [[23-usecart-abstraction-boundary]]

---

## 1. ⭐⭐ 실행 순서 (클릭부터 끝까지) — fetch는 postPurchase "안"의 일

```
0. [렌더]  const purchase = usePurchase()   → 배선(연결)만. 실행·fetch X
──────── 버튼 클릭 ────────
1. purchase.mutate({객체})                   → 발사 (데이터 넣고)
2. postPurchase({객체}) 실행                 → React Query가 mutationFn 호출
3.   fetch '/api/purchases' (await)          → ★ postPurchase 안에서 서버로 보냄
4.   서버(route.ts→service) 저장 → 응답
5.   return res.json()                       → Promise<Purchase> 돌려줌
6. React Query가 await로 풀음 → 성공 판정
7. onSuccess(createdPurchase)                → 완성본(객체) 들어옴
8. payment.mutate(createdPurchase)           → 결제
9. 성공 → trackEvent + setShowSuccess(true)  → 팝업
```

- **배선(usePurchase, 렌더) ≠ 실행(mutate, 클릭)** — 심기 vs 누르기. mutationFn에 postPurchase 심어두고, mutate() 눌러야 실행.
- **fetch는 혼자 안 돌아** — mutate 눌러 postPurchase가 실행돼야 그 안의 fetch가 발사. (1→2→3 순서, fetch를 맨 앞에 두면 틀림)

---

## 2. ⭐⭐ 데이터 왕복 — 객체 → 문자열 → 객체 (JSON 2번)

```
page:  { 사과, 2개, 58000 }          ← 객체
          ↓ JSON.stringify (객체→문자열, 보낼 때)
       "{사과,2개,58000}"             ← 문자열 (body에 실어 보냄)
          ↓ fetch → 서버 저장(payment_id) → 응답(문자열)
       "{사과,2개,payment_id}"        ← 문자열
          ↓ res.json() (문자열→객체, 받을 때) ★
       { 사과, 2개, payment_id }      ← 다시 객체!
          ↓ React Query await
   createdPurchase = 그 객체
```

- **네트워크(전화선)로는 "글자(문자열)"만** 갈 수 있음 → 보낼 때 `JSON.stringify`(객체→문자열), 받을 때 `res.json()`(문자열→객체).
- ⚠️ **`res.json()`은 "문자열로"가 아니라 "문자열을 객체로"** (풀기). 양 끝(page·createdPurchase)은 객체, 네트워크 구간만 문자열.

---

## 3. ⭐⭐ Promise / await

- **`Promise<Purchase>`** = 「곧 Purchase **객체** 줄게」 **시간** 약속(네트워크 느려서). `<Purchase>`=그 객체의 모양(타입). 🔔 진동벨: 지금 음식 없지만 "준비되면 줄게".
- **`res.json()`도 Promise** — 봉투 여는 데도 시간 걸려서. `return res.json()`=약속(진동벨)을 그대로 넘김 → 리턴타입 `Promise<Purchase>`.
- **await = "그 값을 *지금* 쓸 때만" 붙인다**:
  - `const {error} = await res.json()` → error를 바로 throw에 **써야** 해서 await O.
  - `return res.json()` → 값 안 쓰고 **넘기기만** 해서 await X (받는 쪽이 풀음).
- **받는 쪽 = React Query** (usePurchase 안의 useMutation). 우리 코드엔 await 안 보이지만 **React Query가 내부에서 await**해서 createdPurchase/data로 전달.

---

## 4. ⭐ 타입(설계도) ≠ 값(실제 객체)

| | `Purchase` (타입) | Purchase "값" |
| --- | --- | --- |
| 뭐 | 모양 설계도(붕어빵 틀) | 그 모양으로 된 실제 객체(구운 붕어빵) |
| 예 | `interface Purchase {...}` | `{ id:'ord-1', quantity:2, payment_id:'...' }` |
| 언제 | 개발중(TS), 실행땐 사라짐 | 실행중, 서버가 준 진짜 데이터 |

- `Promise<Purchase>`의 `<Purchase>`=타입 / await로 풀면 Purchase "값"(객체)이 createdPurchase에.

### 왜 쓰기에 타입이 더 중요 (읽기도 `as Product` 쓰지만)
- **읽기**: 보낼 게 `slug`(문자열 하나)·받기만 → 입력 타입 불필요, `Product` 1개.
- **쓰기**: ①복잡한 객체를 **내가 조립해 보냄**(모양 체크 필요) ②page→hook→route→service **여러 레이어** 거침(공유 계약) ③입력(CreatePurchaseInput)/출력(Purchase) **모양 다름**(둘 다) → 타입이 더 중요.

---

## 5. ⭐ usePurchase = 클라이언트 훅 (서버 훅 아님)

| | 어디서 도나 | 하는 일 |
| --- | --- | --- |
| `usePurchase`·`useProduct`·`useCart` | **클라이언트(브라우저)** | 서버 API 호출/데이터 관리 |
| `route.ts`·`service` | **서버** | 요청 받아 처리(훅 아닌 서버 함수) |

- "API 호출 훅" = 서버 API를 **"호출(전화 건다)"**는 뜻. **서버에서 도는 게 아님.**
- **`use~` 훅은 전부 클라이언트** / 서버 코드(route·service)는 훅 안 씀.
- `fetch('/api/purchases')`가 **클라↔서버 경계**. ☎️ usePurchase=전화 거는 사람(집) / route·service=받는 콜센터(서버).

---

## 6. ⭐ mutate vs mutateAsync

| | `mutate`(지금) | `mutateAsync` |
| --- | --- | --- |
| 결과 | 콜백(onSuccess) | Promise 반환(await 가능) |
| 순차 | 콜백 **중첩**(안에 안에) | **await 평평**(위→아래) |
| 에러 | onError | try/catch |

- mutateAsync면 숨은 await가 내 코드에 드러남: `const createdPurchase = await purchase.mutateAsync(데이터)`. 체인 길면 평평한 쪽이 읽기 쉬움. (이 프로젝트는 2단계라 mutate 중첩 선택)

---

## 7. 전체 아키텍처 (왕복)

```
가는 길:  page(mutate) → usePurchase(fetch) → route.ts(받음·검증) → service(저장·payment_id) → purchases 테이블
오는 길:  createdPurchase ← usePurchase(res.json) ← route.ts(201) ← service(return 완성본) ←┘
```
- DB→타입→usePurchase(클라 훅)→page→route.ts(서버)→service(서버)→DB 저장, 완성본이 역순으로 createdPurchase까지.

---

## 한 줄 정리 모음

1. 실행순서: 배선(usePurchase,렌더) → 클릭 mutate → postPurchase → (그 안)fetch→res.json→return Promise → RQ await → onSuccess(createdPurchase) → payment → 팝업. fetch는 postPurchase 안.
2. 데이터 왕복: 객체→문자열(stringify 보낼때)→문자열→객체(res.json 받을때). res.json()=문자열을 객체로(풀기), 네트워크만 문자열.
3. Promise<Purchase>=「곧 객체 줄게」시간약속(진동벨). await는 값 지금 쓸때만(error O/return X). 받는쪽=React Query가 await.
4. 타입(설계도)≠값(객체). 쓰기가 타입 더 중요=복잡객체 조립·여러레이어·입력/출력 다름.
5. usePurchase=클라 훅(서버 API "호출"일 뿐). use~=클라 / route·service=서버. fetch가 경계.
6. mutate=콜백 중첩 / mutateAsync=await 평평(Promise 반환). 길면 평평이 읽기 쉬움.
