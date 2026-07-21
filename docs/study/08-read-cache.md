# 08. 읽기 슬라이스 + 캐시 — useQuery / queryKey / staleTime / RQ 내부

> 한 줄: **읽기(상품)는 통로① 직통(route·fetch 없음)·자동 실행·캐시가 특징. queryFn의 throw/return을 React Query가 내부 try/catch로 잡아 꾸러미(data/isError)로 만들고 → 리렌더 → page가 새 값을 받는다.**
> 짝: [[00-flow-map]](읽기/쓰기 대칭) · [[06-route-handler]](쓰기 슬라이스, 같은 뼈대) · 색인 [[README]]

---

## 🍔 한 장 그림

```
[slug]/page.tsx:21  const { data:product, isLoading, error } = useProduct(slug)   ← 자동(진입)
      ↓ (훅 호출)
useProducts.ts  useQuery({ queryKey, queryFn, staleTime })   ← queryFn "등록"(배선)
      ↓
React Query (라이브러리 내부, 안 보임)
   ① queryKey로 캐시 확인 → ② staleTime으로 fresh?stale? → ③ fresh면 캐시 / stale면 queryFn
   try { await queryFn() } catch(err) { ... }   ← throw/return을 여기서 잡음
      ↓ 꾸러미 갱신(data or error) + 리렌더
page.tsx:21  새 꾸러미 받음 → 화면
```

---

## 1. ⭐ 읽기(통로①) vs 쓰기(통로②) — 정거장부터 다름

```
✍️ 쓰기(주문):  page → hook → fetch → route.ts → service → supabase   (통로②, 6정거장)
📖 읽기(상품):  page → hook ─────────────────────────→ supabase   (통로①, 3정거장, 직통!)
```
- 증거 = `import` 한 줄:
  - 읽기 `import { createClient } from '@/lib/supabase/client'` 🌐 브라우저용(직통)
  - 쓰기 `... '@/lib/supabase/server'` 🖥️ 서버용(route.ts 안)
- 왜 직통 안전? 공개 상품 읽기는 데이터 안 변하고 RLS가 `is_active=true`만 내줌 → 위험 없음.

## 2. `createClient()` = 열쇠 ❌ → "도구(리모컨) 조립" ⭕
- `const supabase = createClient()` = supabase에 말 걸 **도구**. anon key는 그 도구 **안의 부품**.
- 아직 DB 안 감 — 실제 왕복은 `.select()`에 `await` 붙을 때. (리모컨 만들기 vs 작동)
- ⚠️ **읽기엔 `await` 없음** (anon key만 조립, 즉시) / 쓰기는 `await createClient()` (안에서 `await cookies()`로 신분 읽음).

## 3. `useQuery({ ... })`는 "실행"이 아니라 "설정표 건네기"
- `{ queryKey, queryFn, staleTime }` = **객체(옵션)** → **순서 없음.** 위→아래 실행 아님.
- 셋 다 RQ에게 넘기는 **재료(설정)**. `queryFn`도 여기선 실행 X → RQ가 필요할 때 부름(등록=배선).
- "순서"는 옵션이 아니라 **React Query 내부 코드**에 있음 (레시피 카드 재료 나열 ≠ 요리사가 쓰는 순서).

## 4. ⭐ `queryKey` = 캐시 라벨 + 캐시는 "칸이 쌓이는 보관함"

```ts
queryKey: ['product', slug]   // 'product'=종류(고정) / slug=어느 것
```
- **slug를 넣는 이유** = 라벨이 데이터를 특정. 안 넣으면 모든 상품이 한 칸 → A 봤다가 B 들어가도 A가 뜸(버그).
- ★ **다른 slug = 바꿔치기 ❌ = 별개의 새 칸(공존)**:
  ```
  ['product','keyring']     → {…}   ← 이 칸
  ['product','butter-drop'] → {…}   ← 새 칸 (keyring 칸 안 지움, 옆에 남음)
  ```
- 그래서 **재방문이 즉시** — 칸이 안 지워지고 남아있어서. (바꿔치기면 다시 DB 가야 함)
- "바꿔치기(내용 갱신)"는 **같은 slug** 재요청일 때만.

## 5. ⭐ `staleTime` = "queryFn 돌릴지" 정하는 문지기 (확인이 먼저)

```
재방문 → RQ가 먼저 그 칸 나이 확인 (staleTime = 1000*60*10 = 10분)
   fresh (10분 안)  → 캐시 그대로 즉시 ⚡ (queryFn 실행 X, DB 안 감)   ← 대부분 이 경우
   stale (10분 지남) → 캐시 먼저 보여주고 + 백그라운드 갱신
```
- ★ **순서: staleTime 확인 → (fresh면 queryFn 스킵 / stale이면 queryFn).** "가고 나서 확인"이 아니라 "확인하고 갈지 정함".
- 재방문 = 무조건 갱신 ❌ → fresh면 "그대로 재사용". 그래서 빠름.

## 6. queryFn의 두 출구 — 쓰기 `createPurchase`와 글자까지 동일

```ts
const { data, error } = await supabase...   // supabase가 한 덩어리로 포장 → queryFn이 구조분해(개봉)
if (error) throw error                       // 🚨 비상구: 실패면 던짐 (여기서 끝, 아래 못 감)
return data as Product                       // 🚪 정문: 성공이면 반환
```
- `error` 있냐 없냐가 **갈림길** — 하나만 나감(뿌리는 게 아님).
- supabase는 성공이면 `{data, error:null}` / 실패면 `{data:null, error}` — 한쪽만 채움.
- 두 구간 구분: **① supabase→queryFn = 네트워크 O(통로①) / ② queryFn→RQ = 네트워크 X(부른 쪽으로 return/throw).**

## 7. ⭐⭐ throw/return은 어디로? → React Query (부른 쪽), 그 안에 try/catch가 있다

- `queryFn`을 실행한 건 **React Query**(라이브러리 내부, 안 보임). → return/throw는 **RQ로** 감.
- **try/catch가 RQ 내부에 있음** (그래서 내 코드엔 안 보임 = RQ 쓰는 이유):
  ```ts
  // [React Query 내부 — node_modules, 안 보임]
  try {
    const result = await queryFn()   // 성공: return data → result
    // → data칸 + 캐시 갱신, isLoading=false
  } catch (err) {                     // 실패: throw error → err
    // → error칸, isError=true
  }
  ```
- ✅ 너 이미 [[06-route-handler]] 섹션20에서 useMutation에 대해 이걸 적었음 — useQuery도 동일.

## 8. ⭐ 갱신 방식 = 변수 직접 수정 ❌ → 리렌더 ⭕

```
throw/return → RQ가 꾸러미 상태 갱신(data or error) → ★ 컴포넌트 리렌더 트리거
   → page.tsx:21 그 줄이 "다시 실행" → 새 꾸러미 받음 → 화면 바뀜
```
- RQ가 page:21 변수에 손 뻗어 바꾸는 게 아님. **상태 갱신 → 리렌더 → 그 줄 재실행 → 새 값.** (useState와 동일 원리)
- 꾸러미는 시간에 따라 3모습: `{isLoading:true}` → 성공 `{data:product}` / 실패 `{error}`. 각 변화마다 리렌더.

## 9. "data칸/캐시가 어디야?" — 안 보이는 것 vs 보이는 것

| | 어디 | 코드에 보임? |
| --- | --- | --- |
| React Query (부른 쪽·try/catch) | 라이브러리 내부 | ❌ |
| 캐시 | RQ 내부 메모리 (queryKey 라벨) | ❌ (라벨만 보임) |
| `data` 칸 | 꾸러미 → **page.tsx:21 `const {data:product}`** | ✅ (받는 쪽) |

- **React Query ≠ page.tsx:21.** RQ는 안 보이는 요리사, page:21은 접시 받는 손님.
- `return data`의 여정: queryFn → **RQ(캐시+data칸에 담음)** → useProduct가 꾸러미 반환 → page:21에서 꺼내 화면.

## 10. 성공 ↔ 실패 완전 대칭

| | queryFn | RQ 내부 | 꾸러미 | page:21 |
| --- | --- | --- | --- | --- |
| 성공 | `return data` | try 완료 | data + **캐시** + isLoading=false | `data`(=product) |
| 실패 | `throw error` | catch | error + isError | `error` → 빨간 글씨 |
- 둘 다 RQ 내부 거쳐 꾸러미 갱신 + 리렌더. 차이는 성공만 **캐시 저장**.

---

## 🔑 오늘의 핵심 한 줄
**읽기는 통로①(직통)·자동·캐시. `useQuery({queryKey,queryFn,staleTime})`는 설정표를 RQ에 건네는 것(순서는 RQ 내부에 있음). RQ가 queryKey로 캐시 확인 → staleTime으로 fresh면 queryFn 스킵. queryFn의 throw/return은 RQ 내부 try/catch가 잡아 꾸러미(isError/data+캐시)로 만들고 → 리렌더 → page가 새 값을 받는다. 쓰기와 같은 뼈대, 통로만 짧다.**

---

## ▶ 다음에 여기서 시작
- ✅ 읽기 슬라이스 + 캐시 완주. 낙관적 업데이트의 전제(캐시) 확보.
- ▶ **다음 = Zustand** (`useCart`/`cartStore`) — 서버 안 가는 **순수 클라이언트 전역 상태**(통로 어느 쪽도 아님). React Query(서버 상태) / useState(컴포넌트 로컬)와 대비.
- 그다음 후보: **낙관적 업데이트**(캐시 직접 조작, 어드민 수정에), **무한스크롤**(`useInfiniteQuery`·pageParam·getNextPageParam).
