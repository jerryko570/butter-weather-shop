# 🧈 Butter Weather Shop

> 디자이너가 만드는 디자인 편집샵 — 키링, 비즈 악세사리부터 브랜드 굿즈까지

## 소개

12년차 프로덕트 디자이너가 Supabase DB 스키마와 아키텍처를 직접 설계하고, 디자인 컴포넌트부터 프론트엔드·결제·데이터 분석까지 구축하는 글로벌 디자인 편집샵입니다.
상품 기획 · UX 설계 · 프론트엔드 개발 · 결제 시스템 · 데이터 분석까지 비즈니스 전 과정을 직접 만드는 과정을 담았습니다.

**한국 먼저 → 미국·중국 확장**을 목표로, 사이트는 처음부터 다국가 대응 구조로 짓되 마케팅은 한 시장씩 순차로 진행합니다.

---

## 기술 스택

| 분류            | 기술                                               |
| --------------- | -------------------------------------------------- |
| Framework       | Next.js 16 (App Router, Turbopack)                 |
| Language        | TypeScript                                         |
| Styling         | Tailwind CSS v4 + CVA                              |
| 서버 상태       | TanStack Query                                     |
| 클라이언트 상태 | Zustand                                            |
| Animation       | Framer Motion                                      |
| Backend / DB    | Supabase (PostgreSQL + Auth + Storage)             |
| 결제            | PortOne (국내 카드·카카오페이·네이버페이 / 해외 PSP 확장) |
| 다국어          | 가벼운 KR / EN 토글 (클라이언트 i18n)              |
| Deploy          | Vercel                                             |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── styles/theme.css        # 브랜드 디자인 토큰
│   ├── (shop)/                 # 손님용 쇼핑 라우트 (좌측 사이드바 레이아웃)
│   │   ├── page.tsx            # 홈
│   │   ├── about/             # 브랜드 소개
│   │   └── products/          # 상품 목록 / 상세([slug])
│   ├── admin/                  # 어드민 (proxy로 보호)
│   │   ├── login/             # 관리자 로그인
│   │   └── products/          # 상품 CRUD (new · [id]/edit)
│   └── api/                    # Route Handlers
│       ├── payments/          # 결제 complete · cancel
│       └── purchases/         # 주문 기록
├── components/
│   ├── layout/                 # Sidebar · Header(모바일) · Footer
│   ├── admin/                  # ProductForm · AdminNav
│   └── ui/                     # Text 등 공통 컴포넌트 (CVA)
├── lib/
│   ├── supabase/               # client / server 분리
│   ├── queries/                # TanStack Query 훅 (useProducts · useAdminProducts)
│   ├── i18n/                   # 다국어 사전 (dictionary)
│   ├── portone/                # 결제 설정
│   └── utils/                  # cn · formatPrice · analytics
├── store/                      # Zustand (cart · ui · locale)
├── hooks/                      # usePurchase · usePayment · useT 등
├── services/                   # payment · purchase 서비스
├── types/                      # TypeScript 타입 정의
└── proxy.ts                    # 인증 보호 라우트 (Next.js 16)
```

---

## 주요 학습 포인트

- **데이터 흐름 설계** — 어드민(write)과 사이트(read)가 같은 Supabase DB를 공유, 별도 API 없이 `supabase-js` + RLS로 연결
- **API 설계** — Supabase RLS + Next.js Route Handlers (시크릿 키가 필요한 결제·주문만 서버)
- **서버/클라이언트 상태 분리** — TanStack Query(서버) + Zustand(클라이언트)
- **결제 연동** — PortOne 결제 / 검증 / 취소 플로우, 중복 결제 방지(idempotency)
- **다국어** — 가벼운 클라이언트 토글로 KR/EN 전환, 상품명·설명 자동 현지화
- **성능 최적화** — next/image, 무한 스크롤(IntersectionObserver)
- **데이터 분석** — 커스텀 `analytics_events` 테이블로 직접 퍼널 분석

---

## 디자인 시스템

### 컬러

- **Butter** `#F5C842` — 메인 브랜드 컬러
- **Sky** `#A8D8EA` — 서브 포인트
- **Cloud** `#F7F7F7` — 배경
- **Ink** `#1A1A1A` — 기본 텍스트

### 폰트

- **Pretendard** — 국문 UI 전반
- **Inter** — 영문 / 숫자

### 레이아웃

- 데스크톱: 좌측 세로 사이드바 + 우측 콘텐츠
- 모바일: 상단바 + 햄버거 메뉴 (반응형)

---

## 커밋 컨벤션

| 타입        | 설명             |
| ----------- | ---------------- |
| ✨ Feature  | 새 기능 추가     |
| ♻️ Refactor | 코드 구조 개선   |
| 🐛 Fix      | 버그 수정        |
| ⚙️ Chore    | 설정, 환경 변경  |
| 🖼️ Assets   | 에셋 / 데이터    |
| 🎨 Style    | UI / 스타일 변경 |
| 📝 Docs     | 문서 작업        |

형식: `<emoji><Type>: <설명>` · PR 제목: `[<emoji><Type>/<issue>] <title>`

---

## 시작하기

```bash
# 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local에 Supabase · PortOne 키 입력

# 개발 서버
npm run dev
```

---

## 로드맵

### 완료

- [x] 프로젝트 초기 세팅 (컨벤션 · 린트 · 디자인 토큰)
- [x] Supabase 스키마 · RLS · Storage
- [x] 어드민 — 로그인 · 상품 CRUD · 이미지 업로드
- [x] 상품 목록 / 상세 페이지 (썸네일 갤러리 · 상세 탭)
- [x] nutats 레이아웃 — 좌측 사이드바 · 모바일 반응형
- [x] 다국어 KR / EN 토글
- [x] PostHog 분석 연동 (페이지뷰 · product_view · purchase)
- [x] PortOne 결제 모듈 (결제창 · 서버 검증 · 취소 API) — ⚠️ 코드는 완성, 주문 버튼 연결만 남음

### 다음 (우선순위 순)

- [ ] 🐛 결제 배선 — 주문 버튼에 PortOne 결제창 연결 (현재 주문 레코드만 만들고 미결제 상태로 성공 팝업)
- [ ] 회원가입 / 로그인 — Google OAuth (Supabase Auth)
- [ ] 마이페이지 — 주문 · 결제 내역 + 결제 취소(환불) (회원가입 선행 필요: 주문을 사용자에 연결)
- [ ] 장바구니 → 체크아웃 정식 흐름
- [ ] Vercel 배포

### 이후 (글로벌 확장)

- [ ] 해외 결제 PSP 확장 (미국 · 중국)
- [ ] 커스텀 분석 대시보드

---

## About

- 🧈 브랜드: Butter Weather
- 📦 현재 판매: 키링, 비즈 악세사리
- 🎯 목표: 디자인 기반 라이프스타일 브랜드 (한국 → 글로벌)
- ✉️ [email.jerry.narae@gmail.com](mailto:email.jerry.narae@gmail.com)
