'use client'

import Link from 'next/link'
import { useT } from '@/hooks/useT'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import Text from '@/components/ui/Text/Text'

const FOOTER_LINKS: {
  title: TranslationKey
  links: {
    label: TranslationKey | string
    href: string
    external?: boolean // 외부 링크 (새 탭)
    raw?: boolean // label을 번역 키가 아닌 원문 그대로 사용
  }[]
}[] = [
  {
    title: 'footer.shop',
    links: [
      { label: 'footer.newArrivals', href: '/products?sort=newest' },
      { label: 'nav.keyring', href: '/products?category=keyring' },
      { label: 'nav.bead', href: '/products?category=bead' },
      { label: 'footer.allProducts', href: '/products' },
    ],
  },
  {
    title: 'footer.order',
    links: [
      { label: 'footer.shippingInfo', href: '/info/shipping' },
      { label: 'footer.returns', href: '/info/returns' },
      { label: 'footer.faq', href: '/info/faq' },
    ],
  },
  {
    title: 'footer.brand',
    links: [
      { label: 'footer.about', href: '/about' },
      {
        label: 'Instagram',
        href: 'https://instagram.com',
        external: true,
        raw: true,
      },
      { label: 'footer.contact', href: 'mailto:email.narae@gmail.com' },
    ],
  },
]

export function Footer() {
  const { t, locale, setLocale } = useT()

  return (
    <footer>
      {/* 링크 그리드 */}
      <div className="grid grid-cols-3 border-t border-[#e5e5e5]">
        {FOOTER_LINKS.map((col) => (
          <div
            key={col.title}
            className="border-r border-[#e5e5e5] p-7 last:border-r-0"
          >
            <Text
              as="p"
              className="mb-4 text-[10px] tracking-[0.1em] text-[#aaa] uppercase"
            >
              {t(col.title)}
            </Text>
            <ul className="flex flex-col gap-2">
              {col.links.map((link) => {
                const label = link.raw
                  ? (link.label as string)
                  : t(link.label as TranslationKey)
                const className =
                  'text-[12px] text-[#555] transition-colors hover:text-[#111]'
                return (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={className}
                      >
                        {label}
                      </a>
                    ) : (
                      <Link href={link.href} className={className}>
                        {label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* 카피라이트 + 언어 토글 */}
      <div className="flex items-center justify-between border-t border-[#e5e5e5] px-7 py-4">
        <Text as="p" className="text-[11px] text-[#bbb]">
          {t('footer.rights')}
        </Text>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLocale('ko')}
            className={`text-[11px] ${locale === 'ko' ? 'text-[#111]' : 'text-[#bbb] hover:text-[#111]'}`}
          >
            KR
          </button>
          <button
            onClick={() => setLocale('en')}
            className={`text-[11px] ${locale === 'en' ? 'text-[#111]' : 'text-[#bbb] hover:text-[#111]'}`}
          >
            EN
          </button>
        </div>
      </div>
    </footer>
  )
}
