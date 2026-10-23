# 24. Next.js App Router — 폴더 구조 = 컴포넌트 트리(뿌리) + layout vs page + 전역 컴포넌트(CartDrawer)

> 한 줄: **Next.js는 "폴더 구조 = 컴포넌트 뿌리(트리)"다. `layout.tsx`는 그 폴더 아래 모든 `page`를 감싼다. `{children}`은 페이지가 갈아끼워지는 "구멍"이고, 그 밖에 둔 컴포넌트(CartDrawer)는 모든 페이지에 떠 있는 "전역"이 된다. 컴포넌트 뿌리를 알려면 "어느 폴더의 layout에서 렌더됐나"를 보면 된다.**
> 창구 훅 [[23-usecart-abstraction-boundary]] · 스토어 [[09-store-anatomy]]

---

## 1. ⭐ 폴더 구조 = 컴포넌트 트리 (손으로 중첩 안 써도 자동)

Next.js App Router는 **파일 위치로 트리를 자동 생성**한다. 폴더 중첩 = 컴포넌트 중첩.

```
폴더:                              트리(뿌리):
app/layout.tsx            →        <RootLayout>        🌳 최상위 (<html><body>)
app/(shop)/layout.tsx     →          <ShopLayout>      ← 여기 CartDrawer
app/(shop)/.../page.tsx   →            <Page/>         ← {children} 자리에 들어감
                                     </ShopLayout>
                                   </RootLayout>
```

규칙 하나: **`layout.tsx`는 "그 폴더 아래 모든 page"를 감싼다.**

### 이 앱의 실제 뿌리 구조

- `app/layout.tsx` = **최상위 뿌리** — 앱 전체를 감쌈 (`<html>`, `<body>`)
- `app/(shop)/layout.tsx` = (shop) 폴더 아래 **모든 page**를 감쌈 → 여기에 CartDrawer
- `app/(shop)/products/[slug]/page.tsx` = 그중 **한 페이지**(상품 상세)

---

## 2. ⭐ `{children}` = 페이지가 들어가는 "구멍" (여는 스위치 아님)

```tsx
// (shop)/layout.tsx
<main>{children}</main>   // ← 구멍: 홈/상품/검색... 페이지마다 갈아끼움 (바뀜 🔄)
<CartDrawer />            // ← 구멍 "밖": layout에 직접 (항상 있음 🔒)
```

- `{children}` = 지금 보는 **그 페이지(page.tsx)가 들어가는 자리.** 페이지마다 교체됨.
- `{children}`은 "여는 스위치"가 아니라 **그냥 구멍**이다.

| | `{children}` 자리 | `{children}` 밖 (CartDrawer) |
| --- | --- | --- |
| 뭐냐 | 페이지가 들어가는 구멍 | layout에 직접 박은 컴포넌트 |
| 페이지 바뀌면 | 내용 교체됨 🔄 | 안 바뀜, 항상 떠있음 🔒 |

---

## 3. ⭐ layout vs page — "모든 화면 공통 틀" vs "그 화면"

| | page.tsx에 넣으면 | layout.tsx에 넣으면 |
| --- | --- | --- |
| 어디서 보이나 | **그 페이지에서만** | **그 폴더 아래 모든 페이지** |
| 페이지 이동하면 | 사라짐/다시 생성 | **유지됨** |

- 장바구니 서랍처럼 **어디서나 떠야 하는 것** → layout에 (전역 오버레이).
- 그 페이지에서만 필요한 것 → page에.

### CartDrawer가 전역으로 되는 조합

- **전역 컴포넌트**(layout의 `{children}` 밖) = 모든 페이지에 **떠 있음**
- **전역 상태**(zustand `isOpen`) = 모든 페이지가 **공유**
- → 어느 페이지의 버튼을 눌러 `openCart()` 해도 같은 isOpen=true → 그 하나의 CartDrawer가 열림.

> "떠 있게" 하는 건 **layout**, "열고 닫는" 건 **zustand isOpen**. `{children}`은 무관.

---

## 4. ⭐ 컴포넌트 "뿌리" 추적법 3가지

| 방법 | 어떻게 |
| --- | --- |
| **폴더 구조** | `layout.tsx` = 그 폴더 아래 모든 page 감쌈. CartDrawer가 `(shop)/layout`에 → (shop) 전체에 적용 |
| **검색** | `<CartDrawer`(꺾쇠)로 전체검색(Cmd+Shift+F) → "박히는 곳" 나옴. `import`(데려오기) vs `<...>`(실제 박기) 구분 |
| **React DevTools** | 브라우저 확장. Components 탭에서 실제 마운트된 트리를 눈으로 확인 (가장 직관적) |

> "CartDrawer 뿌리가 어디냐" = "CartDrawer를 렌더한 layout이 어느 폴더에 있냐". 폴더 위치 = 적용 범위.

---

## 한 줄 정리 모음

1. Next.js = **폴더 구조가 곧 컴포넌트 뿌리(트리)**. 손으로 중첩 안 써도 자동.
2. `layout.tsx` = 그 폴더 아래 **모든 page를 감싸는 틀**. 중첩되면 바깥 layout이 안쪽을 감쌈.
3. `{children}` = 페이지가 **갈아끼워지는 구멍**(여는 스위치 아님). 그 밖에 둔 건 **전역**.
4. 어디서나 떠야 하는 것(장바구니·모달·토스트) → **layout**에. 그 화면만 → **page**에.
5. CartDrawer 전역 = **layout(children 밖) + zustand isOpen(전역 상태)** 조합.
6. 뿌리 추적 = 폴더 구조 / `<컴포넌트`(꺾쇠) 검색 / React DevTools.
