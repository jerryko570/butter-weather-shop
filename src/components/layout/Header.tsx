'use client'

import Link from 'next/link'
import { useCart } from '@/hooks/useCart'
import { useUiStore } from '@/store/uiStore'

// 네비게이션 메뉴 목록
const NAV_ITEMS = [
  { label: 'New', href: '/products?sort=newest' },
  { label: 'Keyring', href: '/products?category=keyring' },
  { label: 'Bead', href: '/products?category=bead' },
  { label: 'All', href: '/products' },
]

export function Header() {
  const { totalCount, openCart } = useCart()
  const { isMobileMenuOpen, openMobileMenu, closeMobileMenu } = useUiStore()

  return (
    <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white">
      <div className="flex h-12 items-center justify-between px-7">
        {/* 왼쪽: 네비게이션 */}
        <nav className="hidden items-center gap-6 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-[11px] tracking-widest text-[#555] uppercase transition-colors hover:text-[#111]"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 가운데: 로고 */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 font-serif text-[14px] tracking-[0.12em] text-[#111] uppercase"
        >
          Butter Weather
        </Link>

        {/* 오른쪽: 유틸리티 */}
        <div className="ml-auto flex items-center gap-5">
          <button className="hidden text-[11px] tracking-wide text-[#555] transition-colors hover:text-[#111] md:block">
            Search
          </button>
          <span className="hidden cursor-pointer text-[11px] tracking-wide text-[#555] hover:text-[#111] md:block">
            KR
          </span>

          {/* 장바구니 버튼 */}
          <button
            onClick={openCart}
            className="flex items-center gap-1.5 text-[11px] tracking-wide text-[#555] transition-colors hover:text-[#111]"
          >
            Bag
            {totalCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#111] text-[9px] text-white">
                {totalCount}
              </span>
            )}
          </button>

          {/* 모바일 햄버거 */}
          <button
            className="text-[#111] md:hidden"
            onClick={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
          >
            {isMobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {isMobileMenuOpen && (
        <div className="flex flex-col gap-4 border-t border-[#e5e5e5] px-7 py-4 md:hidden">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={closeMobileMenu}
              className="text-[12px] tracking-widest text-[#555] uppercase hover:text-[#111]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
