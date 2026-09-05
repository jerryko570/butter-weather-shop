'use client'

import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useProduct } from '@/lib/queries/useProducts'
import { usePurchase } from '@/hooks/usePurchase'
import { usePayment } from '@/hooks/usePayment'
import { useCart } from '@/hooks/useCart'
import { formatKRW } from '@/lib/utils/formatPrice'
import { useEffect, useState } from 'react'
import Text from '@/components/ui/Text/Text'
import { useT } from '@/hooks/useT'
import { localizedName, localizedDescription } from '@/lib/i18n/dictionary'
import { trackEvent } from '@/lib/utils/analytics'

type Tab = 'detail' | 'shipping'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { locale } = useT()
  const { data: product, isLoading, error } = useProduct(slug)

  const purchase = usePurchase()
  const payment = usePayment()
  const { addItem, openCart } = useCart()

  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('detail')

  useEffect(() => {
    if (!product) return
    trackEvent('product_view', {
      product_id: product.id,
      product_name: product.name,
      category: product.category ?? undefined,
      price_krw: product.price_krw,
    })
  }, [product])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center py-20">
        <Text as="h3" className="text-[13px] text-[#aaa]">
          상품을 불러오는 중...
        </Text>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen items-center justify-center py-20">
        <Text as="span" className="text-[13px] text-red-500">
          상품을 찾을 수 없습니다.
        </Text>
      </div>
    )
  }

  const handlePurchase = () => {
    purchase.mutate(
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        price_krw: product.price_krw * quantity,
        price_usd: product.price_usd ? product.price_usd * quantity : null,
      },
      {
        onSuccess: (createdPurchase) => {
          payment.mutate(createdPurchase, {
            onSuccess: () => {
              trackEvent('purchase', {
                product_id: product.id,
                product_name: product.name,
                quantity,
                price_krw: product.price_krw * quantity,
              })
              setShowSuccess(true)
            },
          })
        },
      }
    )
  }

  const handleCloseSuccess = () => {
    setShowSuccess(false)
    router.push('/')
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        slug: product.slug,
        name: product.name,
        price_krw: product.price_krw,
        price_usd: product.price_usd,
        image: product.images?.[0] ?? '',
      })
    }
    openCart()
  }

  const images = product.images?.length ? product.images : []
  const isSoldOut = product.status === 'sold_out' || product.stock <= 0

  return (
    <div>
      <div className="grid grid-cols-1 border-b border-[#e5e5e5] lg:grid-cols-2">
        <div className="border-b border-[#e5e5e5] lg:border-r lg:border-b-0">
          <div className="relative flex aspect-square items-center justify-center bg-[#f5f5f5]">
            {images[selectedImage] ? (
              <Image
                src={images[selectedImage]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="h-32 w-32 rounded-full bg-[#e0dbd2]" />
            )}
          </div>

          {images.length > 1 && (
            <div className="flex flex-wrap gap-2 border-t border-[#e5e5e5] p-4">
              {images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 overflow-hidden bg-[#f5f5f5] transition-opacity ${
                    i === selectedImage
                      ? 'ring-1 ring-[#111]'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={src}
                    alt={`${product.name} ${i + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between p-8 lg:p-12">
          <div className="flex flex-col gap-6">
            <div>
              <Text
                as="span"
                className="mb-2 block text-[10px] tracking-[0.14em] text-[#aaa] uppercase"
              >
                {product.category ?? 'Butter Weather'}
              </Text>
              <Text
                as="h1"
                className="text-[32px] leading-tight font-normal text-[#111]"
              >
                {localizedName(product, locale)}
              </Text>
              {locale === 'ko' && product.name_en && (
                <Text as="p" className="mt-1 text-[13px] text-[#aaa]">
                  {product.name_en}
                </Text>
              )}
              {locale === 'en' && (
                <Text as="p" className="mt-1 text-[13px] text-[#aaa]">
                  {product.name}
                </Text>
              )}
            </div>

            <Text as="p" className="text-[22px] font-medium text-[#111]">
              {formatKRW(product.price_krw)}
            </Text>

            {localizedDescription(product, locale) && (
              <Text
                as="p"
                className="text-[13px] leading-relaxed font-light whitespace-pre-line text-[#777]"
              >
                {localizedDescription(product, locale)}
              </Text>
            )}

            <div className="border-t border-[#e5e5e5]" />

            <div className="flex items-center gap-3">
              <Text
                as="span"
                className="text-[12px] tracking-widest text-[#aaa] uppercase"
              >
                수량
              </Text>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center border border-[#e5e5e5] text-[#555] transition-colors hover:border-[#111]"
              >
                −
              </button>
              <Text
                as="span"
                className="w-6 text-center text-[13px] text-[#111]"
              >
                {quantity}
              </Text>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="flex h-8 w-8 items-center justify-center border border-[#e5e5e5] text-[#555] transition-colors hover:border-[#111]"
              >
                +
              </button>
              <Text as="span" className="text-[11px] text-[#bbb]">
                재고 {product.stock}개
              </Text>
            </div>

            <div className="flex items-baseline justify-between border-t border-[#e5e5e5] pt-4">
              <Text
                as="span"
                className="text-[11px] tracking-widest text-[#aaa] uppercase"
              >
                Total
              </Text>
              <Text as="p" className="text-[20px] font-medium text-[#111]">
                {formatKRW(product.price_krw * quantity)}
              </Text>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isSoldOut}
              className="w-full border border-[#111] py-3.5 text-[11px] tracking-widest text-[#111] uppercase transition-colors hover:bg-[#111] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSoldOut ? 'Sold Out' : 'Add to Cart'}
            </button>

            <button
              type="button"
              onClick={handlePurchase}
              disabled={purchase.isPending || payment.isPending || isSoldOut}
              className="w-full bg-[#111] py-3.5 text-[11px] tracking-widest text-white uppercase transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSoldOut
                ? 'Sold Out'
                : purchase.isPending
                  ? '주문 생성 중...'
                  : payment.isPending
                    ? '결제 진행 중...'
                    : 'Buy It Now'}
            </button>

            {(purchase.isError || payment.isError) && (
              <Text as="span" className="text-[12px] text-red-500">
                {(purchase.error ?? payment.error)?.message}
              </Text>
            )}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-center gap-10 border-b border-[#e5e5e5]">
          {(
            [
              { key: 'detail', label: 'Detail' },
              { key: 'shipping', label: 'Shipping & Returns' },
            ] as { key: Tab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`-mb-px border-b py-5 text-[11px] tracking-widest uppercase transition-colors ${
                activeTab === tab.key
                  ? 'border-[#111] text-[#111]'
                  : 'border-transparent text-[#aaa] hover:text-[#111]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mx-auto max-w-3xl px-4 py-12 lg:py-20">
          {activeTab === 'detail' && (
            <>
              {product.detail_images && product.detail_images.length > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  {product.detail_images.map((src, i) => (
                    <Image
                      key={src}
                      src={src}
                      alt={`${product.name} 상세 이미지 ${i + 1}`}
                      width={768}
                      height={1024}
                      sizes="(max-width: 1024px) 100vw, 768px"
                      className="h-auto w-full"
                    />
                  ))}
                </div>
              ) : localizedDescription(product, locale) ? (
                <Text
                  as="p"
                  className="text-center text-[14px] leading-relaxed whitespace-pre-line text-[#777]"
                >
                  {localizedDescription(product, locale)}
                </Text>
              ) : (
                <Text as="p" className="text-center text-[13px] text-[#bbb]">
                  상세 정보가 준비 중입니다.
                </Text>
              )}
            </>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-8">
              <ShippingBlock
                title="배송 안내"
                rows={[
                  ['배송 방법', '택배'],
                  ['배송비', '3,000원 (50,000원 이상 무료)'],
                  ['배송 기간', '결제 확인 후 2~5일 이내 출고'],
                ]}
              />
              <ShippingBlock
                title="교환 · 반품 안내"
                rows={[
                  ['신청 기간', '상품 수령 후 7일 이내'],
                  ['반품 배송비', '단순 변심 시 왕복 배송비 고객 부담'],
                  ['불가 사유', '착용·사용 흔적이 있거나 포장이 훼손된 경우'],
                ]}
              />
              <Text as="p" className="text-[12px] leading-relaxed text-[#aaa]">
                핸드메이드 특성상 색상·크기에 미세한 차이가 있을 수 있으며, 이는
                교환·반품 사유에 해당하지 않습니다.
              </Text>
            </div>
          )}
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm bg-white p-10 text-center">
            <div className="mb-6 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#f0ede8]">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
            <Text
              as="h2"
              className="mb-2 font-serif text-[22px] font-normal text-[#111]"
            >
              주문 완료
            </Text>
            <Text as="p" className="mb-1 text-[13px] text-[#777]">
              {product.name} × {quantity}
            </Text>
            <Text as="p" className="mb-6 text-[15px] font-medium text-[#111]">
              {formatKRW(product.price_krw * quantity)}
            </Text>
            <Text
              as="p"
              className="mb-8 text-[12px] leading-relaxed text-[#aaa]"
            >
              주문이 정상적으로 접수되었습니다.
              <br />
              감사합니다!
            </Text>
            <button
              type="button"
              onClick={handleCloseSuccess}
              className="w-full bg-[#111] py-3 text-[11px] tracking-widest text-white uppercase transition-colors hover:bg-[#333]"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ShippingBlock({
  title,
  rows,
}: {
  title: string
  rows: [string, string][]
}) {
  return (
    <div>
      <Text
        as="span"
        className="mb-4 block text-[11px] tracking-widest text-[#111] uppercase"
      >
        {title}
      </Text>
      <dl className="divide-y divide-[#f0f0f0] border-t border-[#e5e5e5]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-4 py-3">
            <dt className="w-24 shrink-0 text-[12px] text-[#aaa]">{label}</dt>
            <dd className="text-[12px] leading-relaxed text-[#555]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   ▌ 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   ProductDetailPage — 상품 상세 화면 (nutats 레퍼런스 레이아웃)
   · 이 파일 = 3층 구조의 맨 위층 "화면"
       cartStore(로직) → useCart(전달) → page(화면)  ← 지금 여기
   · 데이터를 만들지 않는다. 아래층에서 꺼내 쓰고, 클릭을 아래로 내려보낼 뿐


   ═════════════════════════════════════════════
   ★★★ 컴포넌트 한 개의 뼈대 — 4단 구조
   ═════════════════════════════════════════════
   1. 재료 준비   : 훅 실행해서 변수에 담기
                    (slug · router · 상품데이터 · 주문도구 · 상태값)
   2. 관문        : 로딩/에러 거르기 → 통과하면 product가 확실히 존재한다
   3. 동작 정의   : 클릭 시 발동할 함수 미리 만들기 (주문 / 담기 / 팝업 닫기)
   4. 화면 그리기 : return ( JSX )
        상단 2단  → 좌: 메인이미지 + 썸네일 갤러리
                    우: 정보블록(이름·가격·수량·합계·주문)
        하단 탭   → DETAIL(상세이미지) · SHIPPING(배송·교환반품 안내)
        성공 팝업

   ★ 이 순서는 강제다 (거꾸로 못 씀)
     · 훅은 항상 컴포넌트 맨 위 (조건문·반복문 안에서 호출 금지)
     · 그래서 "관문(early return)"보다 훅이 먼저 와야 함
     · useEffect도 관문 위에 있어야 함 → 그래서 안에서 if (!product) return 으로 막음


   ═════════════════════════════════════════════
   ★★★ 같은 줄인데 값이 달라진다 — 리렌더가 갱신 방식
   ═════════════════════════════════════════════
   const { data: product, isLoading, error } = useProduct(slug)

   ★ 이 한 줄이 상황에 따라 세 가지 결과를 준다
     🟡 처음   isLoading = true    data = undefined
     🟡 성공   isLoading = false   data = product
     🟡 실패   error = 있음        data = undefined

   ★ 갱신 메커니즘 = 리렌더
     · 값이 "몰래 바뀌는" 게 아니다
     · 데이터가 도착하면 → React Query가 리렌더를 일으키고
       → 컴포넌트 함수가 처음부터 다시 실행되고
       → ★ 이 줄이 다시 실행되면서 새 값을 받는다
     · 그래서 "위에서 아래로 한 번 읽는다"는 감각으로 보면 안 되고,
       "이 함수 전체가 여러 번 다시 돈다"로 봐야 한다

   ★ 🟢 React Query = 데이터를 가져오고 갱신하는 엔진 (+ 리렌더까지)
     · 가져오기(fetch) · 캐시 · 로딩/에러 상태 · 리렌더를 다 맡음
     · 나는 "무엇을 가져올지"만 적고, 결과를 꺼내 쓰기만 함
   · 관문(아래 섹션)이 있는 이유도 이 3상태 때문 — 세 갈래를 먼저 갈라줘야 함


   ═════════════════════════════════════════════
   ★★★ import 지도 — 무엇이 어디서 오나
   ═════════════════════════════════════════════
   next/navigation
     useParams  : 주소에서 값 꺼내기 (읽기)   → /products/[slug] 의 slug
     useRouter  : 페이지 이동                → router.push('/')

   내 훅들 (성격이 다 다름 — 여기가 핵심)
     useProduct   상품 조회      🔵 읽기   서버 O   React Query (useQuery)
     usePurchase  주문 전송      🔴 쓰기   서버 O   React Query (useMutation)
     usePayment   결제창+검증    🔴 쓰기   서버 O   React Query (useMutation)
     useCart      장바구니       🔴 쓰기   서버 X   Zustand (localStorage만)

   그 외
     Text                  공통 타이포 컴포넌트 (as로 태그+스타일 결정)
     formatKRW             가격 포맷팅 (12000 → 12,000원)
     useT / localizedName  현재 언어(locale) + 상품명·설명 현지화
     trackEvent            커스텀 분석 이벤트 (Supabase + PostHog)


   ═════════════════════════════════════════════
   ★★★ 훅을 "실행해서" 담는다 — () 가 붙는 이유
   ═════════════════════════════════════════════
   const purchase = usePurchase()
                              ─┬─
                          실행 O → "실행한 결과(꾸러미)"를 담는다

   · 함수 자체를 담는 게 아니다. 실행해서 나온 꾸러미를 담는 것
   · 꾸러미 안에 들어있는 것들:
       purchase.mutate      실제로 보내는 함수
       purchase.isPending   보내는 중?  → 버튼 비활성화·문구에 사용
       purchase.isError     실패했나?
       purchase.error       실패 이유

   · useProduct는 조회라서 꾸러미 모양이 다름
       const { data: product, isLoading, error } = useProduct(slug)
                    ─────┬─────
              data를 product라는 이름으로 바꿔 받음 (구조분해 + 이름 변경)

   · useCart는 내가 필요한 것만 뽑아 씀
       const { addItem, openCart } = useCart()


   ═════════════════════════════════════════════
   ★★★ 괄호 있고 없고 — 함수 자체 vs 실행 결과
   ═════════════════════════════════════════════
   const handleAddToCart = () => { … }
   ───────────┬──────────
     변수에 담기는 건 "함수 자체" (아직 실행 안 됨)

       handleAddToCart     괄호 X → 함수 그 자체 (건네주는 용)
       handleAddToCart()   괄호 O → 지금 실행해서 그 결과를 씀

   ★ 그래서 버튼은 괄호 없이 넘긴다
       onClick={handleAddToCart}     ○ "나중에 눌리면 실행해"
       onClick={handleAddToCart()}   ✗ 렌더될 때 즉시 실행돼버림
     · 이건 cartStore의 "콜백은 내가 넣고, 실행은 남이" 와 같은 이야기
     · 넘길 땐 괄호 없이, 지금 값이 필요할 때만 괄호

   · 반대로 훅은 지금 결과가 필요하니까 괄호를 붙인다
       const purchase = usePurchase()   ← 실행 결과(꾸러미)를 담음


   ═════════════════════════════════════════════
   ★★★ 로컬 상태 4개 — 왜 이것들만 useState인가
   ═════════════════════════════════════════════
   quantity       사용자가 고른 수량      🟢 기억해야 함 (계산 불가)
   showSuccess    성공 팝업 열림?         🟢 기억해야 함
   selectedImage  보고 있는 이미지 index  🟢 기억해야 함
   activeTab      지금 어느 탭?           🟢 기억해야 함

   ★ 상태가 아닌 것 (계산으로 뽑음)
       const images    = product.images?.length ? product.images : []
       const isSoldOut = product.status === 'sold_out' || product.stock <= 0
       합계            = formatKRW(product.price_krw * quantity)
     → product와 quantity만 있으면 언제든 계산 가능 → 상태로 두지 않음
     → cartStore의 판정 규칙과 같음:
        ① 사라지면 화면 못 그리나? → 상태 후보
        ② 다른 값으로 계산되나?     → 상태 아님

   ★ 어디에 둘지도 같은 기준
       quantity·activeTab 같은 "이 화면에서만 쓰는 것" → useState (로컬)
       장바구니처럼 "여러 화면이 같이 보는 것"          → Zustand (전역)
       주문·결제처럼 "돈·영구 기록"                     → 서버 DB


   ═════════════════════════════════════════════
   ★★★ 2. 관문 (early return) — 통과 = product 보장
   ═════════════════════════════════════════════
   if (isLoading) return <로딩 화면>
   if (error || !product) return <에러 화면>
   ────────────────────────────────────────
   여기부터 아래는 product가 "확실히 있다"고 놓고 쓸 수 있다
   → product?.name 처럼 물음표를 계속 붙일 필요가 없어짐
   → TypeScript도 이걸 알아채서 undefined 경고를 안 냄
   → 위의 🟡 3상태 중 "성공"만 아래로 통과시키는 문지기

   ★ min-h-screen을 왜 붙였나 — CLS(레이아웃 점프) 방지
     안 붙이면: 로딩 중엔 화면이 짧음 → 데이터 도착하면 갑자기 길어짐
                → 푸터가 아래로 툭 점프
     붙이면  : 화면 높이만큼 자리를 미리 예약 → 데이터가 와도 안 흔들림


   ═════════════════════════════════════════════
   ★★★ 3-A. 주문 흐름 — mutate 안에 mutate (중첩)
   ═════════════════════════════════════════════
   handlePurchase()
     ① purchase.mutate(주문내용, { onSuccess: … })
          → 서버에 주문을 먼저 만든다 (payment_id 발급, 상태 pending)
     ② onSuccess(createdPurchase) → payment.mutate(그 주문, { onSuccess: … })
          → 만들어진 주문으로 PortOne 결제창을 띄운다
     ③ 결제창 통과 + 서버 검증까지 끝나야 → trackEvent('purchase')
                                          → setShowSuccess(true)

   ★ 왜 중첩인가 = 순서가 강제되기 때문
     주문이 있어야 결제할 수 있다 → ①이 끝나야 ②를 시작할 수 있음
     그래서 ②를 ①의 onSuccess 안에 넣는다 (콜백 안의 콜백)

   ★ onSuccess(createdPurchase) 의 createdPurchase
     내가 넣는 게 아니라 React Query가 넣어준다 (①의 결과물)
     → cartStore의 (set, get)과 같은 구조: "엔진이 채워주는 매개변수"
     → 콜백은 내가 넣고, 매개변수는 그 엔진이 채운다

   ★ 진짜 성공은 ③에서만 — 결제창을 띄운 시점이 아니라
     서버 검증까지 통과한 뒤에 성공 팝업을 띄운다 (돈은 서버가 판단)


   ═════════════════════════════════════════════
   ★★★ 3-B. 장바구니 담기 — 버튼부터 스토어까지 연결
   ═════════════════════════════════════════════
   handleAddToCart = 버튼을 누르면 실행되는 함수
     · for문으로 선택 수량(quantity)만큼 반복
     · 반복마다 addItem({ … }) 호출 — 이 { } 객체를 인자로 넣음
     · { } 안에는 supabase products의 컬럼 중 필요한 것만 추린 것
     · 반복이 끝나면 openCart() → 패널 열기

   ★ 클릭 한 번이 타고 가는 길 (page → useCart → cartStore)
     1. <button onClick={handleAddToCart}>       ← 화면
     2. handleAddToCart 실행                     ← 이 파일
     3. addItem({ id, slug, name, … }) 호출      ← 여기서 "객체가 생성"됨
     4. cartStore.ts 의  addItem: (item) => set(…)
                                   ─┬─
                          3번에서 넘긴 객체가 여기 item 자리에 꽂힘

   ★★ 🟢 page의 addItem = cartStore의 addItem = 같은 함수다
       cartStore  addItem: (item) => set(…)   ← 정의는 여기 딱 하나
       useCart    그 함수를 꺼내서 넘겨줌      ← 전달만 함
       page       const { addItem } = useCart()
                  → 새로 만든 게 아니라 "받은 그 함수"를 부르는 것
     · 그래서 page에서 addItem(…)을 부르면 cartStore의 몸통이 그대로 실행된다
     · 복사본이 아니라 같은 함수를 가리키는 것 (참조)

   ★ { } 의 방향 — 나오는 게 아니라 들어간다
       addItem({ id, slug, … })
               └───────┬──────┘
         이 객체는 리턴되는 값이 아니라 "인자로 들어가는" 값
       → cartStore의 addItem: (item) 자리로 주입됨
       → 즉 화살표는 page ──({…})──> cartStore 방향

   ★★ 이 데이터는 네트워크를 타지 않는다
     · supabase에서 받아온 product를 로컬 장바구니로 "복사"하는 것
     · 목적지 = zustand 스토어(브라우저 메모리) + persist의 localStorage
     · 서버에 다시 요청하거나 저장하지 않음
         받아올 때만 네트워크 O (useProduct)
         담을 때는  네트워크 X (addItem)


   ═════════════════════════════════════════════
   ★★★ for문 해부 — 제어부 ( ) 와 몸통 { }
   ═════════════════════════════════════════════
   for (let i = 0; i < quantity; i++) { … }
       └────────────┬───────────┘  └─┬─┘
          제어부: 몇 번 돌지          몸통: 뭘 반복할지
                                     (코드블록)

   ▸ 제어부 ( ) — 세 부분이 세미콜론으로 나뉜다
       let i = 0      시작값     ← 카운터를 0부터
       i < quantity   계속조건   ← 참인 동안만 계속
       i++            매번증가   ← 한 바퀴 끝날 때마다 +1
     · i = 카운터 (0, 1, 2 … 로 올라감) / quantity = 고정된 목표 개수
     · i가 quantity에 닿는 순간 반복 종료
     · ★ i 자체는 안 쓴다 — 그냥 "몇 번 돌지" 세는 용도

   ▸ 몸통 { } — 이 안의 코드가 quantity번 반복 실행된다
       → 여기 들어있는 게 addItem({ … }) 호출 한 줄
       → 3개 골랐으면 addItem이 3번 불린다
       → addItem은 한 번에 1개씩 담는 설계라서 (이미 있으면 quantity + 1)

   ★★ 같은 { } 기호지만 뜻이 완전히 다르다 — 이 줄에 둘 다 나옴
       🟢 코드블록 { }   실행 문장들 (찾아라·더해라·바꿔라)  ===> 동작 = 동사
             for (…) { … }
       🟢 객체 { }      키 : 값 나열                        ===> 데이터 = 명사
             addItem({ id: …, name: … })
     · 코드블록의 { }는 실행되는 것, 객체의 { }는 넘겨지는 것
     · cartStore 메모의 "() => { … } vs () => ({ … })" 와 같은 구분
       (중괄호만 = 코드블록 / 소괄호로 감싸면 = 객체)

   · openCart()는 몸통 밖에 있다 → 반복이 다 끝난 뒤 딱 한 번 실행


   ═════════════════════════════════════════════
   ★ 담기에서 넘기는 값 — 주의할 것
   ═════════════════════════════════════════════
   ★ 점 표기법으로 필요한 것만 꺼낸다
       product      = 객체(object)
       product.id   = 그 객체의 속성(프로퍼티)을 꺼내는 것
       id           = 속성(프로퍼티) 이름
     · products 테이블의 컬럼 전부가 아니라, 장바구니에 필요한 것만 추림

   ★ 값별 주의점
       price_krw: product.price_krw        ★ 단가(개당)를 넘긴다
         → 합계는 스토어가 quantity를 곱해서 계산 (totalKrw)
         → 여기서 미리 곱해 넘기면 이중 계산됨
       image: product.images?.[0] ?? ''    배열에서 대표 1장만
         → CartItem.image는 단수(string)
         → ★ 없을 때 undefined 대신 ''(빈 문자열)을 넣는 게 안전
           (문자열 자리에 undefined가 들어가면 이미지 렌더에서 터질 수 있음)
       slug도 같이 담는 이유 = 장바구니에서 상품 페이지로 되돌아가는 링크용
     · ?. 은 "있으면 꺼내고 없으면 undefined" / ?? 는 "그게 없으면 이걸로"

   ★ 주문(Buy It Now)과 정반대 성격
       주문   : 서버 O · 실패 가능 · isPending 필요 · 돈
       담기   : 서버 X · 실패 없음 · 즉시 완료 · localStorage 백업뿐
     → 그래서 담기 버튼엔 로딩 문구도, 에러 표시도 없다


   ═════════════════════════════════════════════
   ★ useEffect — 상품이 로드되면 조회 이벤트
   ═════════════════════════════════════════════
   useEffect(() => {
     if (!product) return          ← 아직 로딩 중이면 아무것도 안 함
     trackEvent('product_view', {…})
   }, [product])                   ← product가 바뀔 때만 실행

   · PostHog 퍼널: pageview → product_view → purchase
   · 훅은 조건문 안에 못 쓰니까, 훅은 위에 두고 "안에서" 막는 형태
   · 의존성 배열 [product] = 이 값이 달라질 때만 다시 실행
   · 컴포넌트는 리렌더로 여러 번 도는데, 이 배열이 "매번 말고 이때만"을 정해줌


   ═════════════════════════════════════════════
   4. 화면 구조 지도 (JSX)
   ═════════════════════════════════════════════
   <div>
     ├ 상단 2단 grid (lg:grid-cols-2)
     │   ├ 좌: 갤러리
     │   │    ├ 메인 이미지 (aspect-square, images[selectedImage])
     │   │    └ 썸네일 목록 — 이미지가 2장 이상일 때만 표시
     │   │         · 클릭 → setSelectedImage(i)
     │   │         · 선택된 것만 ring-1, 나머지는 opacity-60
     │   └ 우: 정보블록
     │        ├ 카테고리 (없으면 'Butter Weather')
     │        ├ 이름 — localizedName(product, locale)
     │        │    · 보조 이름: ko 화면이면 영문을, en 화면이면 국문을 부제로
     │        ├ 가격 (단가)
     │        ├ 설명 — localizedDescription (있을 때만)
     │        ├ 수량 선택  − / 숫자 / +
     │        │    · − 는 Math.max(1, q-1)        → 1 밑으로 안 내려감
     │        │    · + 는 Math.min(stock, q+1)    → 재고 이상 못 올림
     │        ├ Total = 단가 × quantity (계산값)
     │        └ 버튼 2개 + 에러 메시지
     │             Add to Cart : 아웃라인(2차) — 시각 위계 낮춤
     │             Buy It Now  : 검정 채움(1차)
     ├ 하단 탭
     │   ├ 탭 네비 (detail / shipping) — activeTab으로 스타일 분기
     │   └ 탭 내용
     │        detail   : detail_images 있으면 이미지들
     │                   없으면 설명 텍스트, 그것도 없으면 "준비 중"
     │        shipping : ShippingBlock 2개 + 핸드메이드 안내
     └ 성공 팝업 (showSuccess일 때만) — fixed inset-0, z-100

   ★ 버튼 문구·비활성화가 상태를 그대로 반영한다
       disabled = purchase.isPending || payment.isPending || isSoldOut
       문구     = 품절? → 'Sold Out'
                  주문 보내는 중? → '주문 생성 중...'
                  결제 중? → '결제 진행 중...'
                  아니면 → 'Buy It Now'
     → 별도 상태를 만들지 않고 훅이 주는 isPending을 그대로 씀 (계산값)

   ★ 조건부 렌더 3가지 패턴이 다 나온다
       {조건 && <A/>}                 있을 때만 그림 (썸네일, 에러, 팝업)
       {조건 ? <A/> : <B/>}           둘 중 하나 (메인 이미지 / 회색 원)
       {A ? … : B ? … : <C/>}         3단 폴백 (detail 탭)


   ═════════════════════════════════════════════
   ★ ShippingBlock — 파일 하단의 작은 컴포넌트
   ═════════════════════════════════════════════
   function ShippingBlock({ title, rows }: { title: string; rows: [string, string][] })

   · rows: [string, string][] = [라벨, 값] 쌍의 배열 (튜플 배열)
   · 배송 안내와 교환·반품 안내가 모양이 같아서 하나로 묶음
   · dl / dt / dd = 정의 목록 태그 (라벨-값 구조에 맞는 시맨틱 태그)
   · export 안 함 → 이 파일 안에서만 쓰는 부품


   ─────────────────────────────────────────────
   5. 헷갈릴 때 메모
   ─────────────────────────────────────────────
   · 컴포넌트 4단: 재료 준비 → 관문 → 동작 정의 → 화면 그리기
     훅은 무조건 맨 위 (조건문 안 X) → 그래서 관문이 훅보다 아래

   · 🟡 useProduct 3상태: 처음(로딩) / 성공(data) / 실패(error)
       갱신은 리렌더로 — 컴포넌트가 다시 실행되며 그 줄이 새 값을 받음
       React Query = 가져오고 갱신하는 엔진 (+리렌더)
       관문은 이 3상태에서 "성공"만 통과시키는 문지기

   · 괄호 있고 없고
       handleAddToCart    함수 자체 (넘기는 용) → onClick={handleAddToCart}
       handleAddToCart()  지금 실행해서 결과 사용
       훅은 결과가 필요해서 괄호 O — const purchase = usePurchase()

   · 훅은 실행해서() 담는다 = 함수가 아니라 "실행 결과 꾸러미"
       purchase.mutate / isPending / isError / error

   · 서버 가는 것 vs 안 가는 것
       useProduct(조회) · usePurchase(주문) · usePayment(결제) → 서버 O
       useCart(담기) → 서버 X, Zustand + localStorage
       담기는 받아온 product를 로컬로 "복사"하는 것뿐

   · 관문 통과 후엔 product가 보장됨 → 물음표(?.) 안 붙여도 됨
     min-h-screen = 로딩 중 자리 예약 → 푸터 점프(CLS) 방지

   · 주문은 중첩 mutate: 주문 생성 ① → 결제창+검증 ② → 성공 팝업 ③
     onSuccess의 인자(createdPurchase)는 React Query가 채워줌
     진짜 성공은 서버 검증 통과 후 (돈은 서버가 판단)

   · 담기 경로: onClick → handleAddToCart → addItem({…}) → store의 (item)
       🟢 page의 addItem = cartStore의 addItem = 같은 함수 (참조를 받아 부름)
       { }는 리턴이 아니라 "인자로 들어가는" 값 → item 자리로 주입
       객체는 클릭하는 순간 생성됨

   · for (제어부) { 몸통 }
       제어부 = 몇 번 돌지 (시작값 / 계속조건 / 매번증가)
       몸통   = 뭘 반복할지 → 이 안의 코드가 quantity번 실행
       i는 카운터일 뿐 안 씀 / openCart()는 몸통 밖 → 끝나고 1번

   · { } 두 종류 구분
       코드블록 { } = 실행 문장 (찾아라·바꿔라) → 동작 = 동사
       객체 { }     = 키:값 나열               → 데이터 = 명사

   · 점 표기법: product = 객체 / product.id = 속성 꺼내기 / id = 속성 이름
       필요한 컬럼만 골라 담는다

   · price_krw는 단가로 넘긴다 — 합계는 스토어가 곱함 (여기서 곱하면 중복)
     image는 images[0] 한 장만, 없으면 '' (undefined보다 안전)
     ?. = 있으면 꺼냄 / ?? = 없으면 이걸로

   · 상태 판정은 cartStore와 동일
       기억해야 하나? → useState / 계산되나? → 그냥 변수
       images · isSoldOut · Total은 전부 계산값
       이 화면만 쓰면 useState / 여러 화면이 보면 Zustand / 돈이면 서버

   · useEffect는 [product] 의존성 — 상품 로드되면 1회 발생
     훅을 조건문에 못 넣으니 안에서 if (!product) return 으로 막음
     리렌더는 여러 번 도니까, 의존성 배열이 "이때만"을 정해줌

   · 조건부 렌더: {조건 && } / {조건 ? : } / 3단 폴백
   ════════════════════════════════════════════════════════════════ */
