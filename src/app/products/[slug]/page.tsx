/**
 1. 재료 준비 (훅 실행 -> 변수에 담기)
 - useParams(): 주소에서 slug(상품 이름표) 꺼내기
 - useRouter(): 페이지 이동 리모콘 준비
 - useProduct(): slug로 supabase에서 상품 정보 가져오기
 - usePurchase(): 주문 도구 준비 
 - useState: 변하는 값 (수량, 성공 시 팝업)

 2. 관문 (예상 상황 거르기 -> 통과해야 화면 그림)
 - 로딩 중이면 '불러오는 중' 보여주고 멈춤
 - 에러나 상품이 없으면 '찾을 수 없음' 보여주고 멈춤
 -> 이 아래부터는 상품이 확실히 있다는 것이 보장됨

 3. 동작 정의 (클릭될 때 발동하게 미리 만들어둠)
 - handlePurchase: 주문 버튼 누르면 mutate로 서버에 주문 전송 (성공 시 팝업 켜기)
 - handleCloseSuccess: 성공 팝업 확인 누르면 팝업 닫고 홈으로 (주문 사이클 마무리)
 
 4. 화면 그리기 (return): 이미지 / 정보 / 수량 / 주문버튼 / 성공팝업
 */

'use client'

import { useParams, useRouter } from 'next/navigation'
// useParams : 주소에서 값 꺼내기 담당 (읽기)
// useRouter : 페이지 이동 담당 (이동)
import Image from 'next/image'
import { useProduct } from '@/lib/queries/useProducts'
// 상품 조회 관련은 queries 방에, 기능 훅은 hooks 방에
// 상품 정보를 서버에서 가져오는 도구 (서버에서 받아오기만 함 -> 읽기 전용)
import { usePurchase } from '@/hooks/usePurchase'
// 주문 로직을 담당하는 도구 (데이터를 바꾸는 도구, 서버에 뭔가를 등록/변경 -> 쓰기 전용)
// 함수 결과값이 아닌 함수 자체를 임포트함
import { usePayment } from '@/hooks/usePayment'
// 결제창을 띄우고 결제 결과를 서버에 검증시키는 도구 (주문 생성 다음에 이어서 돈다)
import { formatKRW } from '@/lib/utils/formatPrice'
// 가격을 예쁘게 바꿔주는 도구
import { useState } from 'react'
import Text from '@/components/ui/Text/Text'
// 공통 타이포그래피 컴포넌트 (as로 시맨틱 태그 + 기본 스타일 결정)

// 상품 상세 화면 함수
// 함수를 실행해서 나온 '결과'를 담는 것이다
export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  // 주소창에서 상품 이름표(slug)를 꺼내옴
  // 어떤 상품인지 알아내기 위해" 주소에서 slug를 꺼내오는 것
  const router = useRouter()
  // 페이지 이동용 (router.push로 다른 페이지 보내기)
  const { data: product, isLoading, error } = useProduct(slug)
  // slug로 상품 정보 조회 (가져온 데이터 / 로딩중 / 에러)
  // 주소에서 꺼낸 번호표 (slug)를 useProduct에 넘겨 상품 정보를 가져옴
  // 그 도구는 Tansktack을 쓰고 결과 꾸러미에서 상품 데이터, 로딩중, 에러를 꺼냄
  const purchase = usePurchase()
  const payment = usePayment()
  // payment: 결제창 + 서버검증 도구. purchase(주문생성) 다음 단계에서 사용한다.
  // 페이지 들어오면 바로 실행 (v8 엔진이 usePurchase 내용을 돌림 )
  // 주문 도구를 purchase 변수에 담아둠
  // usePurchase()를 실행한 결과(꾸러미)를 저장
  // 함수 자체가 아닌 함수를 실행한 결과를 담기 때문에 usePurchase()로 해야함
  // usePurchase: 자판기 그 자체. 음료가 아니라 기계를 가리키는 것
  // usePurchase(): 자판기 버튼을 눌러서 나온 음료. 우리가 마실 수 있는 것임

  const [quantity, setQuantity] = useState(1)
  const [showSuccess, setShowSuccess] = useState(false)

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

  // 구매 버튼을 누르면 handlePurchase가 실행되고,
  // 그 안에서 purchase.mutate에 주문 데이터를 넘겨서 서버로 보낸다.
  const handlePurchase = () => {
    // 1번 인자: 서버로 보낼 것 {주문데이터}
    // 지금 이 화면에서만 알 수 있는, 지금 보고 있는 상품의 데이터 값 (직접 전해줘야 함)
    // usePurchase 안쪽 (mutate를 만드는 곳)에서는 알 수 없음 주문 보내는 기능만 있음 거기에는
    // 점(.) 표기법: 꺼내기, 괄호(): 실행하고 결과가 노출된다
    purchase.mutate(
      // 페이지 누를 때 실행
      // mutate 함수 실행함
      // supabase에 있던 값(product)를 재료로 사용하긴 하지만 통째가 아닌 DB값에 필요한 것만 뽑고 사용자가 고른 수량을
      // 더하고 가격을 곱해 계산해서 주문용으로 새로 만든 데이터
      // mutate(): 버튼을 누르는 것 (실행 신호)
      {
        product_id: product.id,
        product_name: product.name,
        quantity, // 사용자가 고른 수량 (useState)
        price_krw: product.price_krw * quantity,
        price_usd: product.price_usd ? product.price_usd * quantity : null,
      },
      // 2번 인자: 결과 처리
      // [바뀐 점] 예전엔 주문이 만들어지면 바로 팝업을 띄웠지만,
      // 이제는 주문 생성(pending) 후 -> 결제창을 띄우고 -> 서버 검증까지 통과해야 팝업을 띄운다.
      {
        onSuccess: (createdPurchase) => {
          // createdPurchase: 방금 DB에 저장된 주문 (payment_id 포함)
          // 이 주문을 결제창에 넘겨 결제를 진행한다.
          payment.mutate(createdPurchase, {
            onSuccess: () => {
              // 결제 + 서버검증까지 모두 성공 -> 그제서야 "주문완료" 팝업
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
  // 주문 사이클의 마무리 역할

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

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={handlePurchase}
              disabled={purchase.isPending || payment.isPending}
              className="w-full bg-[#111] py-3.5 text-[11px] tracking-widest text-white uppercase transition-colors hover:bg-[#333] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {purchase.isPending
                ? '주문 생성 중...'
                : payment.isPending
                  ? '결제 진행 중...'
                  : '바로 주문'}
            </button>

            {/* 주문 생성 실패 또는 결제/검증 실패 메시지 */}
            {(purchase.isError || payment.isError) && (
              <Text as="caption" className="text-[12px] text-red-500">
                {purchase.error?.message ?? payment.error?.message}
              </Text>
            )}
          </div>
        </div>
      </div>

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
