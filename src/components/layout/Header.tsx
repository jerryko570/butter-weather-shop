'use client'

// 모바일(<md) 상단바 — nutats 모바일 레퍼런스.
// 상단: 로고(좌) | 계정 + 장바구니 + 언어(우) / 그 아래: 가로 카테고리 줄.
// 햄버거는 없앴고, 소셜·About은 푸터로 옮겼다.
// 데스크톱(md+)에서는 숨고 Sidebar + 상단바가 대신 뜬다.

import Link from 'next/link'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import Text from '@/components/ui/Text/Text'
import { AccountNav } from '@/components/auth/AccountNav'
import { CartButton } from '@/components/layout/CartButton'

const SHOP_CATEGORIES: { key: TranslationKey; href: string }[] = [
  { key: 'nav.all', href: '/products' },
  { key: 'nav.keyring', href: '/products?category=keyring' },
  { key: 'nav.bead', href: '/products?category=bead' },
  { key: 'nav.etc', href: '/products?category=etc' },
]

export function Header() {
  const { t, locale, setLocale } = useT()

  return (
    <header className="sticky top-0 z-50 border-b border-gray-300 bg-white lg:hidden">
      {/* 상단: 로고(좌) | 계정 + 장바구니 + 언어(우) */}
      <div className="flex h-16 items-center justify-between gap-3 px-6">
        <Link
          href="/"
          className="text-[20px] font-medium whitespace-nowrap text-gray-900"
        >
          Butterweather
        </Link>

        <div className="flex items-center gap-3">
          <AccountNav linkClass="text-[14px] whitespace-nowrap text-[#555] transition-colors hover:text-[#111]" />
          <CartButton className="text-[14px] tracking-wide whitespace-nowrap text-[#555] uppercase transition-colors hover:text-[#111]" />

          {/* 언어 토글 KR | EN */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocale('ko')}
              className={`text-[11px] ${locale === 'ko' ? 'text-[#111]' : 'text-[#bbb] hover:text-[#111]'}`}
            >
              KR
            </button>
            <Text as="p" className="text-[#ddd]">
              |
            </Text>
            <button
              onClick={() => setLocale('en')}
              className={`text-[11px] ${locale === 'en' ? 'text-[#111]' : 'text-[#bbb] hover:text-[#111]'}`}
            >
              EN
            </button>
          </div>
        </div>
      </div>

      {/* 가로 카테고리 줄 */}
      <div className="flex items-center gap-5 overflow-x-auto border-t border-[#e5e5e5] px-5 py-2.5">
        {SHOP_CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={cat.href}
            className="text-[11px] tracking-widest whitespace-nowrap text-gray-900 uppercase transition-colors hover:cursor-pointer hover:text-gray-500"
          >
            {t(cat.key)}
          </Link>
        ))}
      </div>
    </header>
  )
}
