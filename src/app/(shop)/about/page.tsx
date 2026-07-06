'use client'

// About — 브랜드 소개. 가벼운 i18n 토글을 쓰므로 클라이언트 컴포넌트.

import Link from 'next/link'
import Image from 'next/image'
import { useProducts } from '@/lib/queries/useProducts'
import { useT } from '@/hooks/useT'
import { localizedName } from '@/lib/i18n/dictionary'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import Text from '@/components/ui/Text/Text'

export default function AboutPage() {
  const { t, locale } = useT()
  const { data } = useProducts()
  const hero = (data?.pages.flat() ?? [])[0]

  const values: { title: TranslationKey; body: TranslationKey }[] = [
    { title: 'about.value1.title', body: 'about.value1.body' },
    { title: 'about.value2.title', body: 'about.value2.body' },
    { title: 'about.value3.title', body: 'about.value3.body' },
  ]

  return (
    <div>
      {/* ── 히어로 ── */}
      <section className="grid grid-cols-1 border-b border-[#e5e5e5] lg:grid-cols-2">
        <div className="flex flex-col justify-center p-12 lg:p-16">
          <Text
            as="p"
            className="mb-5 text-[10px] tracking-[0.14em] text-[#aaa] uppercase"
          >
            {t('about.eyebrow')}
          </Text>
          <Text
            as="h1"
            className="font-serif text-[34px] leading-[1.2] whitespace-pre-line text-[#111]"
          >
            {t('about.title')}
          </Text>
        </div>
        <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden border-t border-[#e5e5e5] bg-[#f0ede8] lg:border-t-0 lg:border-l">
          {hero?.images?.[0] ? (
            <Image
              src={hero.images[0]}
              alt={localizedName(hero, locale)}
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="h-40 w-40 rounded-full bg-[#e0dbd2]" />
          )}
        </div>
      </section>

      {/* ── 본문 ── */}
      <section className="mx-auto max-w-2xl px-6 py-16 lg:py-24">
        <div className="space-y-6 text-[14px] leading-loose font-light text-[#555]">
          <Text as="p">{t('about.body1')}</Text>
          <Text as="p">{t('about.body2')}</Text>
          <Text as="p">{t('about.body3')}</Text>
        </div>
      </section>

      {/* ── 가치 3개 ── */}
      <section className="border-t border-[#e5e5e5]">
        <Text
          as="p"
          className="px-7 py-5 text-[10px] tracking-[0.12em] text-[#aaa] uppercase"
        >
          {t('about.values')}
        </Text>
        <div className="grid grid-cols-1 border-t border-[#e5e5e5] lg:grid-cols-3">
          {values.map((v, i) => (
            <div
              key={v.title}
              className="border-b border-[#e5e5e5] p-10 lg:border-r lg:border-b-0 lg:last:border-r-0"
            >
              <Text
                as="p"
                className="mb-3 font-serif text-[28px] text-[#e0dbd2]"
              >
                0{i + 1}
              </Text>
              <Text as="h3" className="mb-2 text-[15px] text-[#111]">
                {t(v.title)}
              </Text>
              <Text
                as="p"
                className="text-[13px] leading-relaxed font-light text-[#888]"
              >
                {t(v.body)}
              </Text>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col items-center gap-6 border-t border-[#e5e5e5] py-20">
        <Text as="h2" className="font-serif text-[24px] text-[#111]">
          Butter Weather
        </Text>
        <Link
          href="/products"
          className="bg-[#111] px-8 py-3 text-[11px] tracking-widest text-white uppercase transition-colors hover:bg-[#333]"
        >
          {t('about.cta')}
        </Link>
      </section>
    </div>
  )
}
