# 🗺️ 스터디 로드맵 — Butter Weather Shop

> 지금까지 배운 걸 한눈에 보는 색인. 새 주제 들어가기 전/복습할 때 여기부터 연다.
> 마스터 흐름은 [[00-flow-map]] · 공부 방법은 [[07-study-direction]].

---

## 큰 그림 — "주문/결제 쓰기 흐름"을 끝까지 관통했다

```
[화면] 버튼 클릭 → [훅] fetch → [서버 route] 검증 → [service] DB저장 → [DB/RLS]
                                                                          ↓
[화면] 빨간글씨/팝업 ← [React Query] 판정 ← [훅] res ← ─── 왕복(응답) ───┘
```

---

## 1단계 — 기초 (DB를 혼자 읽기) 📄

| 문서 | 주제 | 한 줄 |
| --- | --- | --- |
| [[01-db-schema]] | DB 스키마 & 제약 | 설계도(스키마)가 진실의 기준(source of truth) |
| [[02-insert]] | INSERT | "어디에(from)" + "무엇을(insert)" 구조 |
| [[03-rls]] | RLS (행 단위 보안) | 문지기. `using`(기존 행) vs `with check`(새 값) |
| [[04-join]] | JOIN + 데이터 흐름 | fk 따라 붙여오기 `.select('*, 테이블(칸들)')` |

## 2단계 — 흐름 (데이터가 오가는 길) 🔄

| 문서 | 주제 | 한 줄 |
| --- | --- | --- |
| [[00-flow-map]] | 마스터 흐름 지도 | **"읽기냐 쓰기냐 / 통로①이냐 ②냐"** 두 질문 |
| [[05-mutation]] | useMutation (쓰기 훅) | `mutationFn`=배선 / `mutate()`=방아쇠 |
| [[06-route-handler]] | Route Handler (통로②) | fetch(손님) ↔ POST(가게), 포장↔풀기 |
| [[08-read-cache]] | 읽기 슬라이스 + 캐시 | 통로①·자동·캐시(queryKey/staleTime)·RQ 내부 try/catch·리렌더 |

## 3단계 — 방법론 (어떻게 공부할까) 🧭

| 문서 | 주제 |
| --- | --- |
| [[07-study-direction]] | 층별❌ → 동작 하나를 위→아래 관통(수직 슬라이스)✅ / 방아쇠(사용자=수동 / 자동)로 시작점 판단 |

---

## ⭐ 반복해서 나온 핵심 패턴 (진짜 자산)

개별 지식보다 이 "반복되는 원리"가 남는다. 다음 슬라이스에서도 그대로 반복됨.

1. **`const 변수 = 함수(인자)`** → 변수엔 **나온 값(결과)**이 담김 (인자 아님)
   - `usePurchase()`=연장통 · `crypto.randomUUID()`=문자열 · `createPurchase()`=주문
2. **포장 ↔ 풀기** — 네트워크는 문자만 감 → `stringify`(포장) ↔ `.json()`(풀기), 왕복이면 2세트
3. **`await` = "느린 일(바깥 다녀오기) 기다려"** — 네트워크·DB·쿠키
4. **`throw`/`return`은 "나를 부른 쪽"으로 간다** — 정문(return) / 비상구(throw)
   - service→route의 catch · postPurchase→React Query의 isError
5. **배선 → 발사 → 주입**
   - 배선(`useMutation`) → 발사(`mutate(인자1)`) → RQ가 결과를 콜백에 **주입**(`onSuccess(createdPurchase)`)
6. **주입(injection)** — 매개변수 = "받는 손", 프레임워크가 채움
   - Next.js→`request` · React Query→`createdPurchase`
7. **상태의 주인 구분** — `useState`(내 것: showSuccess) ≠ React Query 상태(isError/isSuccess)
8. **보안 2겹** — route 검증(양식) + RLS(권한). service role은 검증 끝난 작업만 우회

---

## ✅ 완주한 것 / ▶ 다음

**완주:**
- 주문 쓰기 슬라이스 양방향 ([[06-route-handler]]): 성공→onSuccess→결제→팝업 / 실패→isError→빨간글씨
- 읽기 슬라이스 + 캐시 ([[08-read-cache]]): 통로①·자동·queryKey/staleTime·RQ 내부 try/catch·리렌더

**▶ 다음 슬라이스 후보:**
- **Zustand** — `useCart`/`cartStore`, 서버 안 가는 순수 클라이언트 전역 상태 (통로 어느 쪽도 아닌 새 패턴)
  - 🔸 선행 워밍업 진행 중: [[09-immutable-warmup]] (불변+spread 완료 / map·filter·find·reduce 다음)
- **결제 검증** — `usePayment` → `/api/payments/complete` → `markPurchasePaid`(**service role 우회**)
- **낙관적 업데이트** — 캐시 직접 조작 (읽기+캐시 배웠으니 이제 가능). 어드민 상품 수정에.

---

## 🔑 새 코드 볼 때 던지는 3질문 (07에서)

1. 이 동작, **내가 뭘 눌러서** 시작돼? 아니면 **화면 뜨면 저절로**?
2. 그래서 **읽기(DB출발)** 야 **쓰기(UI출발)** 야?
3. 통로 **①(supabase 직통)** 이야 **②(route handler)** 야?
