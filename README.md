# 🧈 Butter Weather Shop

> 디자이너가 만드는 디자인 편집샵 — 키링, 비즈 악세사리부터 브랜드 굿즈까지

## 소개

14년차 UX 디자이너가 직접 설계하고 개발하는 디자인 편집샵입니다.
상품 기획부터 UX 설계, 프론트엔드 개발, 결제 시스템, 데이터 분석까지
비즈니스 전 과정을 직접 구축하는 과정을 담았습니다.

🛍️ [스마트스토어](https://smartstore.naver.com/butterweather) | 🌐 배포 예정

---

## 기술 스택

| 분류            | 기술                                   |
| --------------- | -------------------------------------- |
| Framework       | Next.js 16 (App Router)                |
| Language        | TypeScript                             |
| Styling         | Tailwind CSS v4                        |
| 서버 상태       | TanStack Query                         |
| 클라이언트 상태 | Zustand                                |
| Animation       | Framer Motion                          |
| Backend / DB    | Supabase (PostgreSQL + Auth + Storage) |
| 결제 (국내)     | Toss Payments                          |
| 결제 (해외)     | Stripe                                 |
| Deploy          | Vercel                                 |

---

## 프로젝트 구조

```
src/
├── app/
│   ├── styles/theme.css       # 브랜드 디자인 토큰
│   ├── (shop)/                # 쇼핑 라우트 그룹
│   │   ├── page.tsx           # 홈
│   │   ├── products/          # 상품 목록 / 상세
│   │   ├── cart/              # 장바구니
│   │   └── checkout/          # 결제
│   ├── (auth)/                # 로그인 / 콜백
│   └── api/                   # Route Handlers (결제, 주문, 웹훅)
├── components/                # UI 컴포넌트
├── lib/
│   ├── supabase/              # client / server 분리
│   ├── queries/               # TanStack Query hooks
│   ├── store/                 # Zustand 전역 상태
│   └── utils/                 # cn, formatPrice, analytics
├── hooks/                     # 커스텀 훅
├── types/                     # TypeScript 타입 정의
└── middleware.ts              # 인증 보호 라우트
```

---

## 주요 학습 포인트

- **API 설계** — Supabase RLS + Next.js Route Handlers
- **서버/클라이언트 상태 분리** — TanStack Query + Zustand
- **결제 연동** — Toss Payments (국내) + Stripe Webhook (해외)
- **트래픽 대응** — ISR / SSR / CSR 전략 비교 실험
- **에러 처리** — 결제 실패, 네트워크 오류, 낙관적 업데이트 롤백
- **성능 최적화** — next/image, LCP 측정, 무한스크롤
- **데이터 분석** — 커스텀 analytics_events 테이블로 직접 퍼널 분석

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

---

## 커밋 컨벤션

| 타입        | 설명             |
| ----------- | ---------------- |
| ⚙️ Chore    | 설정, 환경 변경  |
| ✨ Feature  | 새 기능 추가     |
| ♻️ Refactor | 코드 구조 개선   |
| 🐛 Fix      | 버그 수정        |
| 📝 Docs     | 문서 작업        |
| 🎨 Style    | UI / 스타일 변경 |
| 🧪 Test     | 테스트 추가      |

---

## 시작하기

```bash
# 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local에 Supabase, Toss, Stripe 키 입력

# 개발 서버
npm run dev
```

---

## 로드맵

- [x] 프로젝트 초기 세팅
- [ ] 상품 목록 / 상세 페이지
- [ ] 장바구니 (Zustand persist)
- [ ] Toss Payments 결제 연동
- [ ] Stripe 해외 결제 연동
- [ ] 커스텀 분석 대시보드
- [ ] 다국어 지원 (KO / EN)
- [ ] Vercel 배포

---

## About

- 🧈 브랜드: Butter Weather
- 📦 현재 판매: 키링, 비즈 악세사리
- 🎯 목표: 디자인 기반 라이프스타일 브랜드
- ✉️ [email.jerry.narae@gmail.com](mailto:email.jerry.narae@gmail.com)
