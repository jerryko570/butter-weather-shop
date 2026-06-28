'use client'

// 모바일(<md) 상단바 — nutats 모바일 레퍼런스.
// 상단: 로고 + Bag + 햄버거 / 그 아래: 가로 카테고리 줄.
// 햄버거 = About·언어·소셜 전체 메뉴 패널.
// 데스크톱(md+)에서는 숨고 Sidebar가 대신 뜬다.

import Link from 'next/link'
import { useUiStore } from '@/store/uiStore'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import Text from '@/components/ui/Text/Text'

const SHOP_CATEGORIES: { key: TranslationKey; href: string }[] = [
  { key: 'nav.all', href: '/products' },
  { key: 'nav.keyring', href: '/products?category=keyring' },
  { key: 'nav.bead', href: '/products?category=bead' },
  { key: 'nav.etc', href: '/products?category=etc' },
]

const SOCIAL = [
  { label: 'Instagram', href: 'https://instagram.com' },
  { label: 'Contact', href: 'mailto:email.narae@gmail.com' },
]

export function Header() {
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useUiStore()
  const { t, locale, setLocale } = useT()

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white md:hidden">
      {/* 상단: 로고 + 햄버거 */}
      <div className="flex h-12 items-center justify-between px-5">
        <Link
          href="/"
          className="font-serif text-[14px] tracking-[0.12em] text-[#111] uppercase"
        >
          Butter Weather
        </Link>
        <button
          className="text-[16px] text-[#111]"
          onClick={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
          aria-label="Menu"
        >
          {isMobileMenuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* 가로 카테고리 줄 */}
      <div className="flex items-center gap-5 overflow-x-auto border-t border-[#e5e5e5] px-5 py-2.5">
        {SHOP_CATEGORIES.map((cat) => (
          <Link
            key={cat.key}
            href={cat.href}
            className="text-[11px] tracking-widest whitespace-nowrap text-[#555] uppercase transition-colors hover:text-[#111]"
          >
            {t(cat.key)}
          </Link>
        ))}
      </div>

      {/* 햄버거 패널 — About·언어·소셜 */}
      {isMobileMenuOpen && (
        <div className="flex flex-col gap-5 border-t border-[#e5e5e5] px-5 py-5">
          <Link
            href="/about"
            onClick={closeMobileMenu}
            className="text-[13px] tracking-widest text-[#555] uppercase hover:text-[#111]"
          >
            {t('nav.about')}
          </Link>

          {/* 언어 토글 */}
          <div className="flex items-center gap-2">
            <Text
              as="span"
              className="text-[10px] tracking-[0.14em] text-[#aaa] uppercase"
            >
              Language
            </Text>
            <button
              onClick={() => setLocale('ko')}
              className={`text-[12px] ${locale === 'ko' ? 'text-[#111]' : 'text-[#bbb]'}`}
            >
              KR
            </button>
            <Text as="span" className="text-[#ddd]">
              ·
            </Text>
            <button
              onClick={() => setLocale('en')}
              className={`text-[12px] ${locale === 'en' ? 'text-[#111]' : 'text-[#bbb]'}`}
            >
              EN
            </button>
          </div>

          {/* 소셜 */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#f0f0f0] pt-4">
            {SOCIAL.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#aaa] hover:text-[#111]"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  )
}
