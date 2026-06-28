'use client'

// 데스크톱 좌측 세로 사이드바 (nutats 레퍼런스).
// 좁은 화면(<md)에서는 숨고, 대신 Header(모바일 상단바)가 뜬다.

import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
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

export function Sidebar() {
  const { totalCount, openCart } = useCart()
  const { t, locale, setLocale } = useT()

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#e5e5e5] bg-white md:flex">
      {/* 로고 + Bag */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-6 py-5">
        <Link
          href="/"
          className="font-serif text-[15px] tracking-[0.12em] text-[#111] uppercase"
        >
          Butter Weather
        </Link>
        <button
          onClick={openCart}
          className="flex items-center gap-1.5 text-[11px] tracking-wide text-[#555] uppercase transition-colors hover:text-[#111]"
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
      </div>

      {/* Shop + 카테고리 */}
      <div className="border-b border-[#e5e5e5] px-6 py-6">
        <Text
          as="p"
          className="mb-3 text-[10px] tracking-[0.14em] text-[#aaa] uppercase"
        >
          {t('nav.shop')}
        </Text>
        <nav className="flex flex-col gap-2.5">
          {SHOP_CATEGORIES.map((cat) => (
            <Link
              key={cat.key}
              href={cat.href}
              className="text-[14px] text-[#555] transition-colors hover:text-[#111]"
            >
              {t(cat.key)}
            </Link>
          ))}
        </nav>

        {/* 언어 토글 */}
        <div className="mt-6 flex items-center gap-2">
          <Text
            as="span"
            className="text-[10px] tracking-[0.14em] text-[#aaa] uppercase"
          >
            Language
          </Text>
          <button
            onClick={() => setLocale('ko')}
            className={`text-[11px] ${locale === 'ko' ? 'text-[#111]' : 'text-[#bbb] hover:text-[#111]'}`}
          >
            KR
          </button>
          <Text as="span" className="text-[#ddd]">
            ·
          </Text>
          <button
            onClick={() => setLocale('en')}
            className={`text-[11px] ${locale === 'en' ? 'text-[#111]' : 'text-[#bbb] hover:text-[#111]'}`}
          >
            EN
          </button>
        </div>
      </div>

      {/* 태그라인 */}
      <div className="border-b border-[#e5e5e5] px-6 py-6">
        <Text
          as="p"
          className="font-serif text-[14px] leading-relaxed whitespace-pre-line text-[#888] italic"
        >
          {t('brand.title')}
        </Text>
      </div>

      {/* About */}
      <div className="px-6 py-6">
        <Link
          href="/about"
          className="text-[14px] text-[#555] transition-colors hover:text-[#111]"
        >
          {t('nav.about')}
        </Link>
      </div>

      {/* 하단 소셜 — mt-auto로 바닥에 고정 */}
      <div className="mt-auto border-t border-[#e5e5e5] px-6 py-5">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {SOCIAL.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[#aaa] transition-colors hover:text-[#111]"
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}
