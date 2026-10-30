# 31. 입구(진입점) 찾는 법 + handlePurchase + mutate/useMutation 꾸러미 + onSuccess 체인 + createdPurchase·payment_id

> 한 줄: **낯선 코드 입구는 "훅 이름 검색(grep/Shift+F12)→쓰이는 파일→그 안에서 `.mutate`·`onClick`·`handle…`"로 역추적. 결제 입구=상품 상세의 "바로 구매" 버튼(handlePurchase). `mutate`는 React Query의 `useMutation`이 만들어 꾸러미 `{mutate, isPending}`에 담아줌(useQuery `{data}` 꾸러미와 같은 패턴). mutation이 2개(purchase·payment)라 onSuccess도 2개 — `mutate(데이터, {onSuccess})` 2인자, 앞 성공해야 다음이 도는 순차 도미노. createdPurchase=onSuccess 매개변수(React Query가 postPurchase return값=완성본으로 채움), 그 안 payment_id는 서버가 crypto.randomUUID로 만든 주문↔결제 연결 열쇠.**
> useMutation/쓰기흐름 [[29-type-design-usemutation-write-flow]] · 콜백 부르는사람이채움 [[18-full-flow-map]] · 낯선코드 파는법 [[30-reading-unfamiliar-code-route-service-type-design]] · useCart창구/() [[23-usecart-abstraction-boundary]]

---

## 1. ⭐ 입구(진입점) 찾는 법 — 2단계 역추적

```
1단계: 훅/함수 이름으로 레포 전체 검색
   grep "usePurchase"  (또는 VS Code 커서+Shift+F12 = Find References)
   → "[slug]/page.tsx에서 쓰네" 발견
2단계: 그 파일 안에서 발사 지점 찾기
   grep ".mutate" "onClick" "handle…"  (또는 Cmd+F 파일 내 검색)
   → handlePurchase + <button onClick={handlePurchase}> 발견
```

- 낯선 코드 "이거 어디서 시작되지?" = 항상 이 2단계로 역추적.
- 결제 입구 = **상품 상세 페이지의 "바로 구매" 버튼**(별도 체크아웃 page 아님). CartDrawer "주문하기"는 아직 미배선(onClick 없음).
- 단서: **`.mutate`가 보이면 useMutation이, `.data`가 보이면 useQuery가 어딘가 있다** — 꾸러미에서 뭘 꺼내는지로 안쪽 훅을 역추적.

---

## 2. ⭐ handlePurchase 해부 (주문 데이터 조립)

```ts
const handlePurchase = () => {
  purchase.mutate({
    product_id: product.id,       // key=필드명(언더스코어) / value=product.id(점으로 꺼냄)
    product_name: product.name,
    quantity,                      // = quantity: quantity (shorthand)
    price_krw: product.price_krw * quantity,
    price_usd: product.price_usd ? product.price_usd * quantity : null,
  })
}
```

- **`quantity`는 `product.quantity` 아님** — 상품(product)엔 수량 개념 없음("뭔지"일 뿐). quantity=page의 `useState`(사용자가 +/-로 고른 수량 = 주문의 속성). 노트 20 "진열대 물건 vs 몇 개 담음".
- **key vs value**: `product_id`(key=CreatePurchaseInput 필드명) : `product.id`(value=product에서 꺼냄). `product.id`를 key로 쓰면 에러.
- **`* quantity`**: 단가 × 수량 = **총액**(실제 낼 돈). 2개면 2배. 장바구니 totalKrw의 `price × quantity`와 같은 공식.
- **`? ... : null` vs `?? 0`** (장바구니와 다른 이유):
  - 저장(여기) → `: null`. null="값 없음"/0="0달러"라 의미 다름 → "USD 가격 없음"을 정직하게 null로 기록.
  - 계산(장바구니 totalUsd) → `?? 0`. null 못 더하니 0으로 임시(합계 영향 X).
  - **저장=진실 정직히(null) / 계산=안 터지게 임시변환(0).**

---

## 3. ⭐ `mutate`는 어디서 오나 — useMutation 꾸러미

```
useMutation({ mutationFn })          ← React Query (usePurchase 안에 숨어있음)
   ↓ 돌려줌
{ mutate, isPending, isError }       ← 꾸러미 (mutate가 여기!)
   ↓ usePurchase가 return
const purchase = usePurchase()       ← purchase = 그 꾸러미
   ↓
purchase.mutate(주문데이터)           ← 꾸러미에서 mutate 꺼내 발사
```

- "React Query가 없다"는 오해 — `useMutation`이 바로 React Query고, usePurchase가 그걸 **감싸고 있음**(창구). page는 usePurchase만 import하지만 안에 들어있음.
- **mutate는 내가 안 만듦** — useMutation이 쥐어주는 것.
- **useQuery와 같은 패턴**: `useQuery → {data, isLoading}` ↔ `useMutation → {mutate, isPending}`. 훅이 꾸러미를 돌려주고 필요한 걸 꺼냄.
- usePurchase = mutate 든 꾸러미를 건네주는 창구 / 발사(`purchase.mutate()`)는 page가(심기 vs 누르기).

---

## 4. ⭐⭐ onSuccess 2개 = mutation 2개 (순차 체인)

```ts
purchase.mutate(주문데이터, {
  onSuccess: (createdPurchase) => {     // #1 purchase 성공 콜백
    payment.mutate(createdPurchase, {
      onSuccess: () => {                // #2 payment 성공 콜백
        trackEvent('purchase', {...})   // 분석(곁다리)
        setShowSuccess(true)            // 완료 팝업(진짜 결과)
      },
    })
  },
})
```

- **onSuccess가 2개인 이유 = mutation이 2개**(purchase·payment), 각자 자기 성공 콜백을 가짐.

| | 누구 거 | 언제 | 하는 일 |
| --- | --- | --- | --- |
| onSuccess #1 | purchase.mutate | 주문 생성 성공 | createdPurchase → payment.mutate(결제 발사) |
| onSuccess #2 | payment.mutate | 결제 성공 | trackEvent + 팝업 |

- **`mutate(데이터, { onSuccess })` = 인자 2개**: ①보낼 데이터 ②옵션 객체(onSuccess 등).
- **순차 도미노**: 주문 성공해야 결제 시작, 결제 성공해야 완료 처리 → 그래서 중첩(안에 안에). **결제 실패 시 onSuccess#2 안 돎 → 팝업 안 뜸, 주문은 pending으로 남음**(생성됐지만 미결제).
- trackEvent는 체인의 목적이 아니라 성공 지점에 얹은 분석(빼도 결제는 됨) / setShowSuccess가 진짜 결과.

---

## 5. ⭐ createdPurchase — "부르는 사람이 채운다"

- `(createdPurchase) =>` = onSuccess 콜백의 **매개변수(빈칸)**. **React Query가 채워줌** — `mutationFn`(postPurchase)이 `return`한 값(서버가 만든 완성본 Purchase).
- set의 `state`·map의 `i`와 같은 콜백 패턴: **onSuccess를 부르는 건 React Query → createdPurchase도 React Query가 채움.**
- 값 흐름: `mutate → postPurchase → fetch → 서버가 완성본 반환 → 성공 → onSuccess(완성본)`.
- 왜 payment에 넘기나: createdPurchase 안에 **payment_id**가 있어서(결제창에 필요) → `payment.mutate(createdPurchase)`.

---

## 6. ⭐ payment_id / crypto.randomUUID — 주문↔결제 연결 열쇠

```ts
const paymentId = crypto.randomUUID()  // "550e8400-e29b-..." 같은 고유 식별자
```

- **UUID** = 겹치지 않는 고유 식별자. `crypto.randomUUID()`=그걸 생성(사실상 절대 안 겹침).
- **왜 UUID**: payment_id는 고유해야 함 — 겹치면 "이 결제=어느 주문?" 매칭이 깨짐.
- **왜 crypto**(Math.random 아님): 암호학적으로 안전(예측 불가). 결제번호가 예측되면 위험.
- **역할 = 주문↔결제 잇는 열쇠** 🎫:
  1. createPurchase에서 서버가 생성 → purchases 저장
  2. 결제창(PortOne)에 넘김
  3. 결제 후 그 payment_id로 매칭 → `markPurchasePaid: .eq('payment_id', id)` → paid 처리
- 대기표 비유: 주문에 번호표 뽑아 붙임 → 결제 때 제시 → "47번 결제 완료"로 그 주문 찾아 paid.

---

## 한 줄 정리 모음

1. 입구 찾기 = 훅 이름 검색 → 쓰이는 파일 → 그 안 `.mutate`/`onClick`/`handle…`. `.mutate`=useMutation, `.data`=useQuery 역추적.
2. handlePurchase: quantity=page state(상품 속성 X), key=필드명/value=product.꺼냄, `*quantity`=총액, 저장은 `:null`·계산은 `??0`.
3. mutate는 useMutation이 만든 꾸러미 `{mutate,...}`에서 꺼냄(useQuery `{data}`와 같은 패턴). React Query는 usePurchase 안에.
4. onSuccess 2개 = mutation 2개. `mutate(데이터, {onSuccess})`. 순차 도미노(앞 성공→다음), 실패 시 pending.
5. createdPurchase=onSuccess 매개변수, React Query가 postPurchase return값(완성본)으로 채움. 그 안 payment_id를 payment에 넘김.
6. payment_id=crypto.randomUUID 고유 열쇠(예측불가). 생성→PortOne→매칭(paid). 겹치면 매칭 깨짐.
