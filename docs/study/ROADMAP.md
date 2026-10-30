# 📍 Butter Weather Shop — 스터디 로드맵

> 최종 목표: **깊이 있는 개발자 → 전체 흐름을 보는 아키텍트 + 솔로빌더.** Vercel → AWS까지 다루는 엔지니어.
> 공부 방식(유지): 느려도 깊게, 타이핑 병행, "왜?"를 끝까지 파서 내 것으로. 백지 재현 + 실제 빌드.
> 디버깅·성능은 **별도 챕터가 아니라 매 단계에 가로로 관통**시킨다.

---

## 0. 현황 체크 (이미지 체크리스트 기준)

| 영역 | 항목 | 상태 | 비고 |
| --- | --- | --- | --- |
| **아키텍처 설계** | 폴더 구조 설계 | ✅ | route group, (shop)/admin, lib/store/queries |
| | 컴포넌트 분리 | 🔶 | Text·CartDrawer·제공/소비 레이어 이해, 더 쌓을 것 |
| | 상태관리 전략(Zustand) | ✅ | **깊게 마스터**. Redux/Context 비교는 선택 |
| | API 계층 분리 | ✅(개념) | useCart 창구·supabase client/server·Route Handler 역할 |
| **비동기 데이터** | React Query | ✅ | useQuery/useInfiniteQuery/queryFn/queryKey/staleTime |
| | 캐싱 전략 | 🔶 | staleTime·queryKey 이해, invalidation은 아직 |
| | 낙관적 업데이트 | ❌ | — |
| | 무한스크롤·페이지네이션 | 🔶 | 개념(getNextPageParam)만, UI 구현 안 함 |
| **TypeScript** | Utility Types | 🔶 | Omit 이해, Pick/Partial/Record 더 |
| | 제네릭 | 🔶 | `create<CartStore>` 봤지만 직접 설계 안 함 |
| | 타입 추론 / 설계 | 🔶 | CartItem/CartStore 설계 경험, 더 |
| **성능 최적화** | 전체 | ❌ | memo/useMemo/useCallback·코드분할·lazy·번들 |
| **테스트** | 전체 | ❌ | Jest·RTL·E2E |
| **(이미지 밖)** | 디버깅 | ❌ | ← 매 단계에 추가 |
| | 배포·인프라(AWS) | ❌ | ← 후반 |

**남은 큰 덩어리:** 성능 최적화(전체) · 테스트(전체) · 낙관적 업데이트 · TS 심화 · 디버깅 · AWS/인프라

---

## 🗺️ 로드맵 (프로젝트 기능 = 배우는 개념)

> 원칙: **기능을 하나 만들면서 체크리스트 항목을 묶어서 배운다.** 억지 개념 공부 X, 실제 샵 기능으로.

### Phase 1 — 체크아웃 + 결제 (돈이 흐르는 길) 💳
- **만들 것:** 주문 폼 → PortOne/Toss 결제 → `orders`/`purchases` 기록 → 웹훅 검증
- **배우는 개념:** 폼 다루기(제어 컴포넌트) · React Query **`useMutation`**(쓰기) · **낙관적 업데이트** · **API 계층**(Route Handler, 서버 비밀키) · 캐시 **invalidation**(결제 후 갱신)
- **디버깅:** Network 탭으로 요청/응답 추적 · 웹훅 로그 읽기 · RQ DevTools로 mutation 상태
- **체크리스트 커버:** 낙관적 업데이트 ✅ · 캐싱 ✅ · API 계층 심화 ✅
- ※ 결제는 "직접 짜는 게 아니라 검증된 PG 붙이기" — 보안·환불 리스크 때문

### Phase 2 — 상품 목록 + 무한 스크롤 (실제 UI) 📜
- **만들 것:** 목록 페이지, `useInfiniteQuery`로 무한스크롤, 카테고리 필터
- **배우는 개념:** 무한스크롤 **실제 구현**(IntersectionObserver) · **캐싱 전략**(queryKey 설계) · 컴포넌트 분리(카드/그리드/필터)
- **디버깅:** RQ DevTools로 캐시·페이지 상태 · 리렌더 추적
- **체크리스트 커버:** 무한스크롤 ✅ · 캐싱 ✅ · 컴포넌트 분리 ✅

### Phase 3 — ⭐ 성능 최적화 패스 (mid → senior 분기점) 🚀
- **만들 것:** 만든 화면들을 측정하고 최적화
- **배우는 개념:**
  - `React.memo` / `useMemo` / `useCallback` — **언제 쓰고, 언제 안 쓰나(남용 경계)**
  - 리렌더 원인 찾기 (왜 다시 그려지나)
  - 코드 스플리팅(`dynamic import`) · Lazy Loading(이미지·컴포넌트) · 번들 크기 분석
- **디버깅/측정:** React DevTools **Profiler**로 리렌더 측정 · Lighthouse · 번들 analyzer
- **핵심 사고:** **"측정 먼저, 최적화 나중"** — 추측으로 memo 떡칠 ❌, 증거(Profiler)로. ← 주니어 ↔ 시니어 차이
- **체크리스트 커버:** 성능 최적화 전체 ✅

### Phase 4 — 어드민 CRUD (쓰기 심화) 🛠️
- **만들 것:** 상품 등록/수정/삭제 + 이미지 업로드, `/admin` 보호(미들웨어/proxy)
- **배우는 개념:** mutation 심화 · 폼 검증 · 이미지 업로드(Storage) · Auth·RLS 흐름 · 낙관적 업데이트 재활용
- **디버깅:** RLS 디버깅("코드 맞는데 데이터 안 나옴" → 정책 의심) · auth 흐름 추적
- **체크리스트 커버:** API 계층 ✅ · 타입 설계 ✅

### Phase 5 — TypeScript 심화 🧩
- **만들 것:** 지금까지 코드의 타입을 리팩토링
- **배우는 개념:** 제네릭 **직접 만들기** · Utility Types(Pick/Omit/Partial/Record/ReturnType) · 타입 추론 활용 · API 응답 타입 설계(선택: Zod로 런타임 검증)
- **디버깅:** 타입 에러 읽는 법(“A인데 B 왔다”) · hover로 추론 확인
- **체크리스트 커버:** TypeScript 전체 ✅

### Phase 6 — 테스트 🧪
- **만들 것:** 핵심 로직·플로우 테스트
- **배우는 개념:** **Jest**(단위 — cartStore의 addItem/reduce 로직 테스트 = 네가 백지로 이해한 걸 코드로 보증) · **RTL**(컴포넌트 — CartDrawer 렌더/클릭) · **E2E**(Playwright — 담기→결제 전체 플로우)
- **왜:** 테스트가 곧 "내 이해가 맞나" 자동 검증 + 리팩토링 안전망
- **체크리스트 커버:** 테스트 전체 ✅

### Phase 7 — 배포·인프라 (Vercel → AWS) ☁️
- **배우는 개념:**
  1. Vercel이 **실제로 뭘 하나** 이해(빌드·CDN·서버리스 함수·환경변수)
  2. Supabase가 하는 일 분해(Postgres·RLS·Storage·Auth = 매니지드 백엔드)
  3. AWS 개념 점진적으로 — S3(스토리지)·CloudFront(CDN)·Lambda(서버리스)·RDS(DB) = "Vercel/Supabase가 그 위에서 돌던 것들"
  4. 직접 배포 실습(정적 → 서버 → DB 순)
- **아키텍트 사고:** 전체 흐름(브라우저→CDN→서버→DB) · 비용/확장/보안 트레이드오프

---

## 🔍 디버깅 (매 단계 관통 — 따로 안 빼고 섞어서)

- **브라우저 DevTools:** Console(에러·로그) · Network(요청/응답·상태코드·payload) · Elements(DOM·CSS)
- **React DevTools:** Components(props·state 들여다보기) · Profiler(리렌더 측정)
- **React Query DevTools:** 캐시·쿼리 상태·리페치 추적
- **방법론:** 에러 메시지 **끝까지 읽기**(대충 넘기지 말기) · **이분 탐색**(범위 반씩 좁히기) · `console.log`/중단점 전략 · "최근 바뀐 것부터 의심"
- **원칙:** 추측 금지 — **증거(로그·Network·Profiler)로** 범위를 좁힌다

---

## ⚡ 성능·아키텍처 사고 (mid → senior)

- **측정 먼저:** 느낌 말고 Profiler/Lighthouse 수치로. "추측 최적화"는 시니어가 제일 싫어함
- **트레이드오프:** 모든 결정엔 비용이 있다 — "이렇게 하면 뭐가 좋고 뭐가 나빠?"를 항상
- **남용 경계:** memo·useMemo 떡칠 ❌ (오히려 복잡도↑). 필요한 곳만
- **"다르게 하면?":** 한 기능 만들 때마다 대안 1개 생각 = 아키텍트 근육

---

## 🎯 "나답게 깊게"로 시니어 가는 공부법

1. **기능마다 3단계:** ① 이해(읽기) → ② 백지 재현(타이핑) → ③ "왜 이렇게? 다르게 하면?"(설계 사고)
2. **타이핑 드릴 계속:** 같은 함정(`({})`·단복수·import/const) 반복으로 손에 박기 — 지금처럼
3. **디버깅을 두려워 말기:** 에러 = 배울 기회. 범위 좁히는 습관이 시니어의 핵심
4. **넓이도 조금씩:** 한 기능 깊게 + 가끔 새 패턴 얕게(폼·auth·결제) = 깊이+넓이 균형
5. **아키텍트 사고:** "이 결정의 비용은?" "전체 흐름에서 여기가 어디?"를 계속 물으면 자연스럽게 위로 올라감

---

## ✅ 진행 체크 (업데이트하며 쓰기)

- [x] Phase 0 — 토대: products 스키마·RLS·Supabase·cartStore(Zustand)·useCart·CartDrawer·디자인 토큰
- [ ] Phase 1 — 체크아웃 + 결제 (mutation·낙관적 업데이트·API 계층)
- [ ] Phase 2 — 상품 목록 + 무한스크롤
- [ ] Phase 3 — 성능 최적화 패스 ⭐
- [ ] Phase 4 — 어드민 CRUD
- [ ] Phase 5 — TypeScript 심화
- [ ] Phase 6 — 테스트
- [ ] Phase 7 — 배포·인프라 (Vercel → AWS)
