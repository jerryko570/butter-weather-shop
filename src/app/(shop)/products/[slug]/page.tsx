/**
 * ProductDetailPage — 상품 상세 화면 (nutats 레퍼런스 레이아웃)
 *
 * 1. 재료 준비  : 훅 실행해서 변수에 담기 (slug · router · 상품데이터 · 주문도구 · 상태값)
 * 2. 관문       : 로딩/에러 거르기 → 통과하면 product가 확실히 존재한다
 * 3. 동작 정의  : 클릭 시 발동할 함수 미리 만들기 (주문 전송 / 팝업 닫기)
 * 4. 화면 그리기:
 *      상단 2단  → 좌: 메인이미지 + 썸네일 갤러리 / 우: 정보블록(이름·가격·수량·주문)
 *      하단 탭   → DETAIL(상세이미지) · SHIPPING(배송·교환반품 안내)
 *      성공 팝업
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
// useParams: 주소에서 값 꺼내기(읽기) / useRouter: 페이지 이동
import Image from 'next/image'
import { useProduct } from '@/lib/queries/useProducts' // 상품 조회 (읽기 전용)
import { usePurchase } from '@/hooks/usePurchase' // 주문 전송 (쓰기 전용, 함수 자체를 import)
import { usePayment } from '@/hooks/usePayment' // PortOne 결제창 + 서버 검증
import { formatKRW } from '@/lib/utils/formatPrice' // 가격 포맷팅
import { useEffect, useState } from 'react'
import Text from '@/components/ui/Text/Text' // 공통 타이포 컴포넌트 (as로 태그+스타일 결정)
import { useT } from '@/hooks/useT'
import { localizedName, localizedDescription } from '@/lib/i18n/dictionary'
import { trackEvent } from '@/lib/utils/analytics' // 커스텀 분석 이벤트 (Supabase + PostHog)

type Tab = 'detail' | 'shipping'

export default function ProductDetailPage() {
  // 1. 재료 준비
  const { slug } = useParams<{ slug: string }>() // 주소에서 어떤 상품인지(slug) 꺼내기
  const router = useRouter() // router.push('/')로 페이지 이동
  const { locale } = useT() // 현재 언어 (상품명·설명 현지화)
  const { data: product, isLoading, error } = useProduct(slug) // slug로 상품 조회 (useQuery 꾸러미)

  const purchase = usePurchase() // 주문 도구 꾸러미. ()로 "실행한 결과"를 담는다 (함수 자체 X)
  const payment = usePayment() // 결제 도구 꾸러미. 주문 생성 후 PortOne 결제창을 띄운다

  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0) // 갤러리에서 보고 있는 이미지 인덱스
  const [activeTab, setActiveTab] = useState<Tab>('detail') // 하단 탭

  // 상품 상세 조회 이벤트 — 상품이 로드되면 발생 (PostHog 퍼널: pageview → product_view → purchase)
  useEffect(() => {
    if (!product) return
    trackEvent('product_view', {
      product_id: product.id,
      product_name: product.name,
      category: product.category ?? undefined,
      price_krw: product.price_krw,
    })
  }, [product])

  // 2. 관문 — 여기서 거르면 아래부터는 product가 있다는 게 보장됨
  // min-h-screen으로 화면 높이만큼 자리를 미리 예약한다.
  // 이렇게 안 하면 로딩 중엔 키가 작다가 데이터가 뜰 때 페이지가 길어지면서
  // 푸터가 아래로 점프(CLS)한다.
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

  // 3. 동작 정의
  // 주문 버튼 클릭 → ① 주문 생성(pending) → ② PortOne 결제창 + 서버 검증 → ③ 검증 통과 시 성공 팝업
  const handlePurchase = () => {
    // ① 주문을 먼저 서버에 만든다 (payment_id 발급, 상태 pending)
    purchase.mutate(
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        price_krw: product.price_krw * quantity,
        price_usd: product.price_usd ? product.price_usd * quantity : null,
      },
      {
        // ② 주문이 만들어지면 그 주문(payment_id 포함)으로 결제창을 띄운다
        onSuccess: (createdPurchase) => {
          payment.mutate(createdPurchase, {
            // ③ 결제창 통과 + 서버 검증까지 끝나야 진짜 성공
            onSuccess: () => {
              // 결제 검증 통과 → 전환 이벤트 (PostHog 퍼널 마지막 단계)
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

  // 성공 팝업 닫고 홈으로 → 주문 사이클 마무리
  const handleCloseSuccess = () => {
    setShowSuccess(false)
    router.push('/')
  }

  const images = product.images?.length ? product.images : []
  const isSoldOut = product.status === 'sold_out' || product.stock <= 0

  // 4. 화면 그리기
  return (
    <div>
      {/* ── 상단 2단: 좌 갤러리 / 우 정보블록 ── */}
      <div className="grid grid-cols-1 border-b border-[#e5e5e5] lg:grid-cols-2">
        {/* 좌: 메인 이미지 + 썸네일 갤러리 */}
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

          {/* 썸네일 — 이미지가 2장 이상일 때만 */}
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

        {/* 우: 정보블록 */}
        <div className="flex flex-col justify-between p-8 lg:p-12">
          <div className="flex flex-col gap-6">
            <div>
              <Text
                as="span"
                className="mb-2 block text-[10px] tracking-[0.14em] text-[#aaa] uppercase"
              >
                {product.category ?? 'Butter Weather'}
              </Text>
              {/* 제품 이름 — 현재 언어 우선 */}
              <Text
                as="h1"
                className="text-[32px] leading-tight font-normal text-[#111]"
              >
                {localizedName(product, locale)}
              </Text>
              {/* 보조 이름 — 한국어 화면일 땐 영문을, 영문 화면일 땐 국문을 부제로 */}
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

            {/* 제품 가격 */}
            <Text as="p" className="text-[22px] font-medium text-[#111]">
              {formatKRW(product.price_krw)}
            </Text>

            {/* 제품 상세 — 현재 언어 우선 */}
            {localizedDescription(product, locale) && (
              <Text
                as="p"
                className="text-[13px] leading-relaxed font-light whitespace-pre-line text-[#777]"
              >
                {localizedDescription(product, locale)}
              </Text>
            )}

            <div className="border-t border-[#e5e5e5]" />

            {/* 수량 선택 */}
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

            {/* 합계 */}
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

          {/* 주문 버튼 + 에러 메시지 */}
          <div className="mt-8 flex flex-col gap-3">
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

            {/* 주문 생성 실패 또는 결제 실패·취소 메시지 */}
            {(purchase.isError || payment.isError) && (
              <Text as="span" className="text-[12px] text-red-500">
                {(purchase.error ?? payment.error)?.message}
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* ── 하단 탭 섹션: DETAIL / SHIPPING ── */}
      <div>
        {/* 탭 네비 */}
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

        {/* 탭 내용 */}
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

      {/* 주문 성공 팝업 */}
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

// ── 배송/교환 안내 블록 (라벨-값 행 묶음) ──
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
