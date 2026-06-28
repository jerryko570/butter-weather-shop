'use client'

/**
 * CartButton — 상단바용 장바구니 버튼.
 * 로그인했을 때만 노출된다. (비로그인·확인중에는 렌더 안 함)
 */

import { useCart } from '@/hooks/useCart'
import { useAuth } from '@/hooks/useAuth'
import { useT } from '@/hooks/useT'
import Text from '@/components/ui/Text/Text'

export function CartButton({ className }: { className?: string }) {
  const { user, loading } = useAuth()
  const { totalCount, openCart } = useCart()
  const { t } = useT()

  if (loading || !user) return null

  return (
    <button
      type="button"
      onClick={openCart}
      className={`flex items-center gap-1.5 ${className ?? ''}`}
    >
      {t('nav.bag')}
      {totalCount > 0 && (
        <Text
          as="span"
          className="flex h-4 w-4 items-center justify-center rounded-full bg-[#111] text-[9px] text-white"
        >
          {totalCount}
        </Text>
      )}
    </button>
  )
}
