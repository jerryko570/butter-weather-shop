# 28. reduce(누적 합계) + 불변성(왜 새로 만드나) + import/const·export default 문법

> 한 줄: **`reduce`는 배열을 "값 하나로 접는" 메서드 — 콜백이 `return`한 값이 다음 `sum`이 돼서, `sum +`를 꼭 써야 누적된다(초기값부터). 불변성 = 원본을 고치지 않고 복사해 새 걸 만들어 갈아끼우는 것 — React가 "주소(참조)"로 변화를 감지하기 때문. `import`(맨 위, from O, 도구 가져오기) ≠ `const`(함수 안, from X, 실행 결과 꺼내기). 페이지는 Next.js가 default export를 렌더링해서 `export default`.**
> updateQuantity·교체 [[26-updatequantity-value-flow-subscribe]] · spread/불변성 [[21-closure-dot-method-return]] · set/get [[27-set-vs-get-write-read]] · 함수문법 [[11-function-syntax]]

---

## 1. ⭐ reduce = 배열 → "값 하나"로 접기 (4번째 배열 메서드)

| 메서드 | 배열 → | 결과 |
| --- | --- | --- |
| `map` | 배열 | 각 요소 변환 (길이 유지) |
| `filter` | 배열 | 조건 맞는 것만 (길이 줄 수) |
| `find` | 값 하나 | 조건 맞는 첫 객체 (or undefined) |
| **`reduce`** | **값 하나** | 전부 **합쳐서 하나로** (합계·개수·최댓값…) |

```ts
totalKrw: () => get().items.reduce((sum, i) => sum + i.price_krw * i.quantity, 0)
//                  └──┬──┘          └─┬─┘ └┬┘   └──────────┬─────────┘  └┬┘
//               지금 items(배열)   누적  현재   그 상품 라인합계(단가×수량)  초기값
```

- `get().items` = 배열 (reduce는 **배열 메서드** → `.items` 꼭 필요. `get()`만으론 ❌)
- `(sum, i)` = 매개변수 **2개** (map/filter는 `(i)` 하나였음): `sum`=누적 / `i`=현재 요소
- `, 0` = **초기값** (sum 시작점)

---

## 2. ⭐⭐ reduce 작동 원리 — `return`한 값이 "다음 sum"

> **핵심: reduce는 콜백을 상품마다 한 번씩 부르고, 콜백이 `return`한 값을 다음 호출의 `sum`으로 넘겨준다.** (바통 이어달리기 🏃→🏃→🏃)

`[사과 2000, 배 3000]` 합계 (라인 합계):

```
초기 sum = 0  ← 초기값(, 0)은 1번째 호출의 sum

1번째: sum=0,    i=사과 → return 0+2000 = 2000  ─┐
2번째: sum=2000, i=배   → return 2000+3000 = 5000  ← ★ 1번째 return이 여기 sum으로!
결과: 5000 ✅
```

- **초기값 0** = **1번째** 호출의 sum (딱 한 번)
- 그 뒤 sum = **직전 호출이 return한 값** (계속 전달되며 쌓임)

### ⚠️ `sum +`를 빼먹으면 → 마지막 것만 남음

```ts
(sum, i) => i.price * i.qty         // ❌ sum 무시 → 매번 리셋 → 마지막 값만
(sum, i) => sum + i.price * i.qty   // ✅ 이전 누적 + 이번 것 → 쌓임
```

- `sum` 안 쓰면: 들어온 누적을 **버리고** 현재 값만 return → 다음 sum이 현재 값으로 덮어써짐 → 결과 = 마지막 상품 값.
- 🛒 계산대 비유: `sum +` = 화면에 있던 총액에 **더해서** 다시 띄움 / `sum` 없음 = 화면 **지우고** 이번 것만 → 매번 리셋.

---

## 3. ⭐ `?? 0` — nullable 칸에만 (타입에 `| null` 있으면)

```ts
totalKrw: sum + i.price_krw * i.quantity           // price_krw: number → ?? 불필요
totalUsd: sum + (i.price_usd ?? 0) * i.quantity    // price_usd: number | null → ?? 0 필요
```

- `price_usd`는 **null 가능**(해외가 미정 상품) → null에 곱하면 깨짐 → `?? 0`="null이면 0으로".
- `price_krw`는 `number`(필수) → 항상 숫자라 `?? 0` 불필요.
- **규칙: 타입에 `| null` 있으면 `?? 0`, 없으면 안 씀.**
- ⚠️ `??`(null이면 오른쪽)는 삼항 `?:`(조건 분기)랑 **다름** — 자주 헷갈리는 짝.
- `totalCount`는 가격 안 보고 `sum + i.quantity` (총 개수만).

---

## 4. ⭐⭐ 불변성 — 왜 원본 안 고치고 새로 만드나

### 두 가지 방법 — 우리는 B를 쓴다

```ts
i.quantity = i.quantity + 1        // 방법 A: 원본 직접 수정 ❌ (안 씀)
{ ...i, quantity: i.quantity + 1 } // 방법 B: 복사한 "새 객체" ✅
```

### 왜 B(새로 만들기)? — React는 "주소(참조)"로 변화를 감지

- React는 "내용이 바뀌었나"가 아니라 **"객체가 새 거냐(주소가 다르냐)"**를 봄.
- 원본을 직접 고치면(A) → 주소 그대로 → React "안 바뀌었네" → **화면 안 바뀜** ❌
- 복사해 새 객체(B) → 새 주소 → "바뀌었다" → **화면 갱신** ✅

🏷️ 명찰 비유: 사과 명찰의 "1"을 고쳐 쓰면(A) 같은 명찰 → React 못 알아챔 / "2" 적은 **새 명찰**을 붙이면(B) 새 명찰 → 알아챔.

### 기존 배열/객체는 어떻게 되나 → 안 고쳐지고, 버려진다

```
기존 배열 #A: [{사과,1},{배,1}]   ← map이 읽기만, 수정 ❌
     │ map이 새로 만듦
새 배열 #B:   [{사과,2},{배,1}]   ← return → set이 store를 #B로 교체
옛 #A는? 아무도 안 가리킴 → 자동으로 버려짐 🗑️ (가비지 컬렉션)
```

- 옛 버전을 **남겨둬야** React가 옛(#A) vs 새(#B)를 **비교**해서 변화를 앎.
- 📋 명단 다시 쓰기: 기존 명단 안 고치고 → 복사하며 사과만 2로 → 새 명단을 store가 봄 → 옛 명단 버려짐.

### 세 액션 전부 이 패턴

| 액션 | 새로 만드는 법 | 길이 |
| --- | --- | --- |
| addItem(중복) | `map` → 맞는 칸 `{...i, +1}` 교체 | 그대로 |
| addItem(신규) | `[...items, {...item, quantity:1}]` 추가 | +1 |
| removeItem | `filter` → 조건 맞는 것만 새 배열 | 줄 수 |
| updateQuantity | `map` 교체 / `filter` 제거 | 그대로/줄 수 |

> 전부 **원본 안 고침 → 새로 만듦 → set이 갈아끼움 → 옛 건 버려짐.**

---

## 5. ⭐ `import` vs `const` — 가져오기 vs 꺼내기

```ts
import { useProduct } from '@/lib/queries/useProducts'  // 맨 위: 다른 파일에서 "도구 가져오기"
...
const { data: product } = useProduct(slug)              // 함수 안: 그 도구 "실행 결과 꺼내기"
```

| | 쓰는 곳 | 하는 일 | `from` |
| --- | --- | --- | --- |
| `import` | 파일 **맨 위** | 다른 파일 도구 데려오기 | **있음** |
| `const` | 함수 **안** | 실행 결과를 꺼내 담기 | **없음** |

- ⚠️ 함수 안에서 `import {…} = useProduct(slug)` = **에러**. 훅 결과는 `const`로 꺼낸다.
- 🍽️ import=주방에서 도구 데려오기 / const=그 도구로 요리한 결과 받기.

---

## 6. ⭐ `export default` vs named + 함수 선언 `=` 없음

```ts
export default function Page() { … }      // 페이지: Next.js가 "default export"를 렌더링 → default
export function CartDrawer() { … }        // 컴포넌트: named (import { CartDrawer })
export const useCart = () => { … }        // 훅: named
```

| | import 법 | 개수 |
| --- | --- | --- |
| **default** (대표 1명) | `import Page from '...'` (아무 이름) | 파일당 1개 |
| **named** (이름표) | `import { useCart } from '...'` (이름 맞춰) | 여러 개 |

- 페이지(`page.tsx`)·레이아웃은 **Next.js 규칙상 default export**(그걸 화면으로 띄움). 훅·컴포넌트는 여기저기서 이름으로 쓰니 named.
- ⚠️ **함수 선언엔 `=` 없음**: `function Page() { }` ✅ / `function Page() = { }` ❌. (`=`는 `const Page = () => {}`처럼 화살표 담을 때만)

---

## 한 줄 정리 모음

1. reduce = 배열 → 값 하나(누적). `get().items`로 배열 꺼내서, `(sum,i)` 2개 매개변수, 초기값 `, 0`.
2. ⭐ 콜백 `return` = **다음 sum**. `sum +`를 꼭 써야 누적(안 쓰면 마지막 값만). 초기값은 1번째 sum.
3. `?? 0` = 타입에 `| null` 있는 칸만(price_usd). `??`≠삼항 `?:`.
4. 불변성 = 원본 안 고치고 복사해 새로 만들어 갈아끼움. React가 **주소**로 변화 감지해서.
5. 기존 배열은 map/filter가 **안 고침**(읽기만), 새 배열 만들고, 옛 건 버려짐(비교용으로 남아있다 GC).
6. `import`(맨 위·from O·도구) ≠ `const`(함수 안·from X·실행 결과). 함수 안 import는 에러.
7. 페이지=`export default`(Next.js가 렌더링), 훅·컴포넌트=named. 함수 선언은 `=` 없음.
