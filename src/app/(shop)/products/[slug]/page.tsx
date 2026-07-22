'use client'

import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useProduct } from '@/lib/queries/useProducts'
import { usePurchase } from '@/hooks/usePurchase'
import { usePayment } from '@/hooks/usePayment'
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
  // 성공이든 실패든 → RQ 내부(try/catch) → 꾸러미 갱신 → 리렌더 → page가 새 값 받음. 같은 파이프.
  // RQ가 컴포넌트 리랜더 트리거
  // React Query  throw를 "잡아서" → isError=true, error=Error 로 번역 -> 리랜더링 -> page.tsx (UI)
  // postPurchase가 throw -> reactQuery가 catch -> 상태로 번역

  const purchase = usePurchase()
  const payment = usePayment()

  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [activeTab, setActiveTab] = useState<Tab>('detail')

  // 분석로그 콜백함수: 랜더 끝난 뒤 특정 값 바뀌면 실행할 부수효과
  // 분석로그, api호출, 타이머, 구독 -> PostHog : 이 상품 봤다 기록
  // product 바뀔 때만 실행 -> 본문에 직접 안쓰고 useEffect를 사용하는 이유

  // 콜백: 등록만 해두면 프레임워크가 부름 (RQ/React) -> 부르는 주체가 자동으로 부르는 것 (함수 수동)
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
    // 배선 (setup) - 딱 한번 -> usePurchase.ts 안에서 -> useMutation({}) :  mutate에 postPurchase 연결
    // 사용자 데이터 (재료) -> postPurchase - DB로 감
    purchase.mutate(
      {
        product_id: product.id,
        product_name: product.name,
        quantity,
        price_krw: product.price_krw * quantity,
        price_usd: product.price_usd ? product.price_usd * quantity : null,
      },

      // 인자 2는 전송 X | 브라우저에 가만히 대기하고 인자 1 처리가 성공하면 그때 실행됨
      // 1. mutate(인자1,인자2) 호출 -> RQ가 인자 1을 postPurchase에 넣어 실행
      // 2. postPurchase  fetch -> DB return res.json() <- 이 반환값 = createdPurchase
      // 3. RQ가 그 반환값을 받음 (성공 판정)
      // 4. RQ: 인자 2에 onSuccess (반환값) 실행
      // 결론: postPurchase가 처리 끝내고 return한 결과 -> RQ가 그걸 onSuccess의 매개변수 (createdPurchase)에 주입
      {
        onSuccess: (createdPurchase) => {
          payment.mutate(createdPurchase, {
            // mutate(데이터, {onSuccess})
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

  // 이미지 가공 준비 단계 (product 값을 꺼내 새 변수에 담아두는 줄 -> 이따 JSX에서 쓸 재료를 미리 다듬어 둔 것)
  // 요리 전 도마 위에서 재료 손질 단계
  // A.B -> A가 확실히 있을 때만 안전
  // A?.B -> A가 없어도 안전. 없으면 undefined (조건판단 중간값 -> 나왔다 사라짐 -> [] 바뀜)
  const images = product.images?.length ? product.images : []
  const isSoldOut = product.status === 'sold_out' || product.stock <= 0
  //                      ㄴ 관리자가 수동으로                    ㄴ 재고가 자동으로 바닥남

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
   ▌ 코드 + 주석 ─ 설명 달린 학습용 (실행 X, 읽기용)
   ════════════════════════════════════════════════════════════════

   ProductDetailPage — 상품 상세 화면 (nutats 레퍼런스 레이아웃)

   1. 재료 준비   : 훅 실행해서 변수에 담기 (slug·router·상품데이터·주문도구·상태값)
   2. 관문        : 로딩/에러 거르기 → 통과하면 product가 확실히 존재
   3. 동작 정의   : 클릭 시 발동할 함수 미리 만들기 (주문 전송 / 팝업 닫기)
   4. 화면 그리기 :
        상단 2단  → 좌: 메인이미지 + 썸네일 갤러리 / 우: 정보블록(이름·가격·수량·주문)
        하단 탭   → DETAIL(상세이미지) · SHIPPING(배송·교환반품 안내)
        성공 팝업


   ─────────────────────────────────────────────
   ★ 이 파일을 관통하는 핵심: 배선(wiring) vs 실행(trigger)
   ─────────────────────────────────────────────
     usePurchase() / usePayment() 호출  →  "배선"  (postPurchase를 mutate에 연결. 여기서 끝)
     purchase.mutate(데이터)            →  "실행"  (배선된 postPurchase를 방아쇠처럼 당김)
     ※ mutate는 useMutation을 "다시 실행"하는 게 절대 아님. 이미 연결된 함수를 부를 뿐.


   ─────────────────────────────────────────────
   ★ 구조분해 O vs X — 읽기는 쪼개고, 쓰기는 통째로
   ─────────────────────────────────────────────
   const { data: product, … } = useProduct(slug)   ← 읽기: 구조분해 O (바로 쪼개 씀)
     · 지금 당장 값(product)이 필요 → { }로 꺼내 바로 사용

   const purchase = usePurchase()                   ← 쓰기: 구조분해 X (통째로 둠)
     · 안 쪼개고 통째로 purchase에 둠
     · 왜? 나중에 purchase.mutate / purchase.isPending / purchase.isError 처럼
       "점(.)으로 꺼내" 여러 개를 두루 쓰기 위함
     · 덤: 이름 충돌 회피 (purchase.mutate vs payment.mutate — 각자 상자에 담아 구분)

   → 값 하나만 바로 쓸 거면 구조분해 / 도구 여러 개를 점으로 꺼내 쓸 거면 통째로


   ─────────────────────────────────────────────
   import 구역 (누가 뭘 하는지)
   ─────────────────────────────────────────────
   useParams   : 주소에서 값 꺼내기(읽기)  /  useRouter : 페이지 이동
   useProduct  : 상품 조회 (읽기 전용, useQuery)
   usePurchase : 주문 전송 (쓰기 전용, useMutation — 함수 자체를 import)
   usePayment  : PortOne 결제창 + 서버 검증
   formatKRW   : 가격 포맷팅
   Text        : 공통 타이포 컴포넌트 (as로 태그+스타일 결정)
   localizedName / localizedDescription : 현재 언어에 맞는 이름·설명 고르기
   trackEvent  : 커스텀 분석 이벤트 (Supabase + PostHog)


   ─────────────────────────────────────────────
   1. 재료 준비 (훅 → 변수)
   ─────────────────────────────────────────────
   const { slug } = useParams<{ slug: string }>()
   // · 주소에서 어떤 상품인지(slug) 꺼냄

   const router = useRouter()          // router.push('/')로 페이지 이동
   const { locale } = useT()           // 현재 언어 (상품명·설명 현지화)
   const { data: product, isLoading, error } = useProduct(slug)   // 읽기 → 구조분해 O
   // · supabase의 return data → React Query가 queryFn 결과를 받아 꾸러미 data 칸에 담음(배달부)
   // · page가 그 data를 꺼내 → product로 이름 바꿔(별칭) 씀

   const purchase = usePurchase()      // 쓰기 → 구조분해 X (통째로)
   // · 주문 도구 꾸러미. "지금 도구를 받아야 하니까" ()로 실행 → 결과를 담는다 (함수 자체 X)
   // · ★ 이 호출 = useMutation이 postPurchase를 mutate에 "배선(연결)"하는 지점 → 여기서 배선 끝
   // · 통째로 두는 이유 = purchase.mutate / .isPending 처럼 점으로 꺼내 쓰려고 (+이름 충돌 회피)
   const payment = usePayment()
   // · 결제 도구 꾸러미. 주문 생성 후 PortOne 결제창을 띄운다

   const [quantity, setQuantity] = useState(1)
   const [showSuccess, setShowSuccess] = useState(false)
   const [selectedImage, setSelectedImage] = useState(0)   // 갤러리에서 보는 이미지 인덱스
   const [activeTab, setActiveTab] = useState<Tab>('detail') // 하단 탭

   useEffect(() => {
     if (!product) return
     trackEvent('product_view', { ...product 정보 })
   }, [product])
   // · trackEvent() = 사용자 "행동"을 분석에 기록하는 함수
   //     'product_view'   = 무슨 행동인지 (이 상품 상세를 봤다)  → 퍼널 분석용
   //     { product_id … } = 그 행동의 상세 정보(누가·무엇을·얼마)
   // · 상품이 로드되면 발생 (PostHog 퍼널: pageview → product_view → purchase)
   // · [product] 의존성 → product가 생기거나 바뀔 때만 실행


   ─────────────────────────────────────────────
   2. 관문 (로딩/에러 거르기)
   ─────────────────────────────────────────────
   if (isLoading) return <로딩 화면 min-h-screen>
   if (error || !product) return <에러 화면 min-h-screen>
   // ★ 여기서 걸러지면 아래부터는 product가 "확실히 있다"고 보장됨
   //   (그래서 이후 product.xxx 를 옵셔널 체이닝 없이 써도 안전)
   //
   // ★ 왜 min-h-screen?
   //   화면 높이만큼 자리를 미리 예약. 안 그러면 로딩 땐 키가 작다가
   //   데이터 뜰 때 페이지가 길어지며 푸터가 아래로 점프(CLS)한다.


   ─────────────────────────────────────────────
   3. 동작 정의 (클릭 시 발동할 함수)
   ─────────────────────────────────────────────
   const handlePurchase = () => {           // 주문 버튼 클릭 핸들러
     purchase.mutate(주문데이터, {           // ★ 배선된 postPurchase를 "실행"(방아쇠). 재-배선 아님
     //  ↑ purchase(상자) . mutate(도구 꺼냄) ()(실행)
       onSuccess: (createdPurchase) => {     // ① 주문 생성 성공(payment_id 발급, 상태 pending)
         payment.mutate(createdPurchase, {   // ② 그 주문으로 PortOne 결제창 + 서버 검증
           onSuccess: () => {                // ③ 결제창 통과 + 검증까지 끝나야 "진짜 성공"
             trackEvent('purchase', {...})   //    전환 이벤트 (퍼널 마지막 단계)
             setShowSuccess(true)            //    성공 팝업 띄우기
           },
         })
       },
     })
   }
   // ★ 3단 중첩 흐름: 주문 생성 → 결제·검증 → 성공 팝업
   //   각 단계의 onSuccess가 다음 단계를 "연쇄"로 부른다 (앞이 성공해야 뒤가 실행)
   //   price_usd 는 값 있으면 quantity 곱, 없으면 null
   //
   // ★ createdPurchase 값은 어디서 오나? (usePurchase.ts와 연결)
   //   1) postPurchase 안 return res.json()  → 서버가 만든 주문 데이터를 반환
   //   2) React Query가 "성공"으로 판단 (isSuccess = true, data 채움)
   //   3) 그 반환값을 인자로 onSuccess(반환값) 실행
   //   4) 그 반환값이 여기 onSuccess의 createdPurchase 로 들어옴 (RQ가 자동 연결)
   //   5) 그걸 payment.mutate(createdPurchase) 로 넘겨 결제창으로 이어짐
   //   → 즉 "우리가 직접 대입"하는 게 아니라, mutationFn의 반환값을 RQ가 배달해 줌

   const handleCloseSuccess = () => {        // 성공 팝업 닫고 홈으로
     setShowSuccess(false)
     router.push('/')                        // 주문 사이클 마무리
   }

   const images = product.images?.length ? product.images : []
   // · 이미지 있으면 그 배열, 없으면 빈 배열 (아래 갤러리에서 안전하게 map)
   const isSoldOut = product.status === 'sold_out' || product.stock <= 0
   // · 품절 상태거나 재고 0 이하면 true → 버튼 잠금


   ─────────────────────────────────────────────
   4. 화면 그리기 (JSX 구조 지도)
   ─────────────────────────────────────────────
   <div>
     [상단 2단 grid] lg에서 좌우 2칸
       ├ 좌: 갤러리
       │   · 메인 이미지 = images[selectedImage] (없으면 회색 원 placeholder)
       │   · 썸네일 = images.length > 1 일 때만 노출
       │       클릭 → setSelectedImage(i) → 메인 이미지 교체
       │       선택된 썸네일만 ring 강조, 나머지는 opacity 낮춤
       └ 우: 정보블록
           · 카테고리 → 이름(localizedName) → 보조이름(ko면 영문 / en이면 국문)
           · 가격 formatKRW
           · 설명(localizedDescription) — 있을 때만
           · 수량: − 버튼 Math.max(1, q-1) / + 버튼 Math.min(stock, q+1) → 재고 초과·0 방지
           · Total = price_krw × quantity
           · 주문 버튼 <button onClick={handlePurchase}>
               disabled = purchase.isPending || payment.isPending || isSoldOut
               라벨 = 품절? 'Sold Out' : 주문중? '주문 생성 중...'
                      : 결제중? '결제 진행 중...' : 'Buy It Now'
           · 에러 = purchase.isError || payment.isError 일 때
               (purchase.error ?? payment.error)?.message 표시

     [하단 탭 섹션]
       · 탭 네비: detail / shipping → 클릭 시 setActiveTab
       · detail  → detail_images 있으면 이미지 나열
                   없고 설명 있으면 설명 텍스트, 둘 다 없으면 "준비 중"
       · shipping→ <ShippingBlock> 2개(배송 안내 / 교환·반품) + 핸드메이드 유의 문구

     [주문 성공 팝업] showSuccess === true 일 때만
       · 체크 아이콘 + "주문 완료" + 상품×수량 + 합계
       · 확인 버튼 → handleCloseSuccess (팝업 닫고 홈 이동)
   </div>

   ── ShippingBlock (하단 helper 컴포넌트) ──
   · props: title(제목) + rows([라벨, 값][] 배열)
   · <dl> 안에 rows.map 으로 라벨-값 행을 반복 출력


   ─────────────────────────────────────────────
   5. 헷갈릴 때 메모
   ─────────────────────────────────────────────
   · 구조분해 O vs X
       읽기(useProduct)  → { data: product } 바로 쪼갬 (지금 값이 필요)
       쓰기(usePurchase) → const purchase = … 통째로 (점으로 여러 개 꺼내 씀 + 이름 충돌 회피)

   · 배선 vs 실행 (이 파일 최대 함정)
       usePurchase() 호출     = 배선(연결) 완료 — 렌더마다 여기서 한 번
       purchase.mutate(data)  = 배선된 postPurchase 실행 — 버튼 누를 때마다
       → mutate는 useMutation을 다시 만드는 게 아니라, 이미 연결된 함수의 방아쇠

   · purchase.mutate(…) 뜯어 보기
       purchase(상자) . mutate(도구 꺼냄) ()(실행)

   · onSuccess의 인자(createdPurchase)는 내가 넣는 게 아님
       mutationFn(postPurchase)의 return 값을 React Query가 자동으로 넘겨줌

   · 3단 onSuccess 중첩 = "앞 단계 성공 → 다음 단계" 연쇄
       주문 생성 → 결제·검증 → 팝업. 중간에 실패하면 뒤로 안 감

   · data: product 처럼 : 로 이름 바꾸기 = 구조분해 별칭(rename)

   · 관문 이후엔 product 존재 보장 → product.xxx 안전하게 접근

   · min-h-screen = 레이아웃 점프(CLS) 방지용 높이 예약

   · Math.max(1, …) / Math.min(stock, …) = 수량 하한 1, 상한 재고
   ════════════════════════════════════════════════════════════════ */
