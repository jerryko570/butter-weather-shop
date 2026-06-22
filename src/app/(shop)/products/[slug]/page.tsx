/**
 * ProductDetailPage — 상품 상세 화면
 *
 * 1. 재료 준비  : 훅 실행해서 변수에 담기 (slug · router · 상품데이터 · 주문도구 · 상태값)
 * 2. 관문       : 로딩/에러 거르기 → 통과하면 product가 확실히 존재한다
 * 3. 동작 정의  : 클릭 시 발동할 함수 미리 만들기 (주문 전송 / 팝업 닫기)
 * 4. 화면 그리기: 이미지 · 정보 · 수량 · 주문버튼 · 성공팝업
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
// useParams: 주소에서 값 꺼내기(읽기) / useRouter: 페이지 이동
import Image from 'next/image'
import { useProduct } from '@/lib/queries/useProducts' // 상품 조회 (읽기 전용)
import { usePurchase } from '@/hooks/usePurchase' // 주문 전송 (쓰기 전용, 함수 자체를 import)
import { formatKRW } from '@/lib/utils/formatPrice' // 가격 포맷팅
import { useState } from 'react'
import Text from '@/components/ui/Text/Text' // 공통 타이포 컴포넌트 (as로 태그+스타일 결정)

export default function ProductDetailPage() {
  // 1. 재료 준비
  const { slug } = useParams<{ slug: string }>() // 주소에서 어떤 상품인지(slug) 꺼내기
  const router = useRouter() // router.push('/')로 페이지 이동
  const { data: product, isLoading, error } = useProduct(slug) // slug로 상품 조회 (useQuery 꾸러미)
  // useProduct(slug)가 실행되는 순간 알아서 패칭이 시작됨 (호출!)

  const purchase = usePurchase() // 주문 도구 꾸러미. ()로 "실행한 결과"를 담는다 (함수 자체 X)
  // purchase 안에 mutate · isPending · isError · error 가 형제로 들어있음

  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)

  // 2. 관문 — 여기서 거르면 아래부터는 product가 있다는 게 보장됨
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text as="h3" className="text-[13px] text-[#aaa]">
          상품을 불러오는 중...
        </Text>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex items-center justify-center py-20">
        <Text as="caption" className="text-[13px] text-red-500">
          상품을 찾을 수 없습니다.
        </Text>
      </div>
    )
  }

  // 3. 동작 정의
  // 주문 버튼 클릭 → mutate로 서버에 주문 전송
  const handlePurchase = () => {
    purchase.mutate(
      // 1번 인자: 서버로 보낼 주문 데이터
      // product(DB값)에서 필요한 것만 뽑고, 수량/가격을 계산해 새로 만든 값
      {
        product_id: product.id,
        product_name: product.name,
        quantity, // 사용자가 고른 수량
        price_krw: product.price_krw * quantity, // 수량만큼 곱한 최종 가격
        price_usd: product.price_usd ? product.price_usd * quantity : null,
      },
      // 2번 인자: 결과 처리 콜백 (서버로 안 가고 브라우저에서 실행)
      // postPurchase가 throw 없이 return하면 돌려줌
      // 함수가 일을 끝내고 return으로 결과를 밖으로 내보내는걸 돌려준다고 함
      {
        onSuccess: () => {
          setShowSuccess(true)
        },
      }
    )
  }
  // mutate는 인자를 2개 받는다. 데이터: postPurchase의 input으로 / 옵션: (성공과 실패 시 할일)

  // 성공 팝업 닫고 홈으로 → 주문 사이클 마무리
  const handleCloseSuccess = () => {
    setShowSuccess(false)
    router.push('/')
  }

  // 4. 화면 그리기
  return (
    <div>
      <div className="grid grid-cols-1 border-b border-[#e5e5e5] md:grid-cols-2">
        <div className="relative flex aspect-square items-center justify-center border-b border-[#e5e5e5] bg-[#f5f5f5] md:border-r md:border-b-0">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="h-32 w-32 rounded-full bg-[#e0dbd2]" />
          )}
        </div>

        <div className="flex flex-col justify-between p-8 md:p-12">
          <div className="flex flex-col gap-6">
            <div>
              <Text
                as="caption"
                className="mb-2 block text-[10px] tracking-[0.14em] text-[#aaa] uppercase"
              >
                {product.category ?? 'Butter Weather'}
              </Text>
              {/* 제품 이름 */}
              <Text
                as="h1"
                className="text-[32px] leading-tight font-normal text-[#111]"
              >
                {product.name}
              </Text>
              {product.name_en && (
                <Text as="p" className="mt-1 text-[13px] text-[#aaa]">
                  {product.name_en}
                </Text>
              )}
            </div>

            {/* 제품 가격 */}
            <Text as="p" className="text-[22px] font-medium text-[#111]">
              {formatKRW(product.price_krw)}
            </Text>

            {/* 제품 상세 */}
            {product.description && (
              <Text
                as="p"
                className="text-[13px] leading-relaxed font-light text-[#777]"
              >
                {product.description}
              </Text>
            )}

            {/* 수량 선택 */}
            <div className="flex items-center gap-3">
              <span className="text-[12px] tracking-widest text-[#aaa] uppercase">
                수량
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center border border-[#e5e5e5] text-[#555] transition-colors hover:border-[#111]"
              >
                −
              </button>
              <span className="w-6 text-center text-[13px] text-[#111]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() =>
                  setQuantity((q) => Math.min(product.stock, q + 1))
                }
                className="flex h-8 w-8 items-center justify-center border border-[#e5e5e5] text-[#555] transition-colors hover:border-[#111]"
              >
                +
              </button>
              <span className="text-[11px] text-[#bbb]">
                재고 {product.stock}개
              </span>
            </div>

            <div className="border-t border-[#e5e5e5]" />
          </div>

          {/* 주문 버튼 + 에러 메시지 */}
          <div className="mt-8 flex flex-col gap-3">
            {/* 요청 중(isPending)엔 버튼 잠그고 "주문 처리 중..." 표시 → 연타 방지 */}
            <button
              type="button"
              onClick={handlePurchase}
              disabled={purchase.isPending}
              className="w-full bg-[#111] py-3.5 text-[11px] tracking-widest text-white uppercase transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {purchase.isPending ? '주문 처리 중...' : '바로 주문'}
            </button>

            {/* 실패하면 isError=true → 에러 메시지 노출 */}
            {purchase.isError && (
              <Text as="caption" className="text-[12px] text-red-500">
                {purchase.error.message}
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* 주문 성공 팝업 */}
      {showSuccess && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
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
