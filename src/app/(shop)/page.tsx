'use client'

// 홈(메인) — nutats 레퍼런스 레이아웃.
// 티커 → 히어로 → 신상품(실제 DB) → 브랜드 스토리.
// 가벼운 i18n 토글을 쓰므로 클라이언트 컴포넌트.

import Link from 'next/link'
import Image from 'next/image'
import { useProducts } from '@/lib/queries/useProducts'
import { useT } from '@/hooks/useT'
import { localizedName } from '@/lib/i18n/dictionary'
import { formatKRW } from '@/lib/utils/formatPrice'
import Text from '@/components/ui/Text/Text'

export default function HomePage() {
  const { t, locale } = useT()
  const { data } = useProducts()
  // 최신 8개만 미리보기
  const products = (data?.pages.flat() ?? []).slice(0, 8)

  return (
    <div>
      {/* ── 티커 배너 ── */}
      <div className="flex items-center gap-10 overflow-hidden border-b border-[#e5e5e5] px-7 py-2.5">
        {(
          [
            'ticker.shipping',
            'ticker.new',
            'ticker.worldwide',
            'ticker.seoul',
          ] as const
        ).map((key) => (
          <Text
            as="span"
            key={key}
            className="text-[11px] tracking-widest whitespace-nowrap text-[#aaa] uppercase"
          >
            {t(key)}
          </Text>
        ))}
      </div>

      {/* ── 히어로 ── */}
      <section className="grid grid-cols-1 border-b border-[#e5e5e5] md:grid-cols-2">
        {/* 이미지 영역 — 첫 상품 이미지로 채움 (없으면 플레이스홀더 도형) */}
        <div className="relative flex min-h-[400px] items-center justify-center overflow-hidden border-b border-[#e5e5e5] bg-[#f0ede8] md:min-h-[520px] md:border-r md:border-b-0">
          <Text
            as="span"
            className="absolute top-6 left-6 z-10 text-[10px] tracking-[0.14em] text-[#888] uppercase"
          >
            SS 2026
          </Text>
          {products[0]?.images?.[0] ? (
            <Image
              src={products[0].images[0]}
              alt={localizedName(products[0], locale)}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-full bg-[#e0dbd2]">
              <div className="h-28 w-28 rounded-full bg-[#c8c2b5]" />
            </div>
          )}
        </div>

        {/* 텍스트 영역 */}
        <div className="flex flex-col justify-between p-12 md:p-14">
          <div>
            <Text
              as="p"
              className="mb-5 text-[10px] tracking-[0.14em] text-[#aaa] uppercase"
            >
              {t('hero.eyebrow')}
            </Text>
            <Text
              as="h1"
              className="mb-5 font-serif text-[38px] leading-[1.15] whitespace-pre-line text-[#111]"
            >
              {t('hero.title')}
            </Text>
            <Text
              as="p"
              className="max-w-xs text-[13px] leading-relaxed font-light whitespace-pre-line text-[#777]"
            >
              {t('hero.body')}
            </Text>
            <div className="mt-10 flex gap-3">
              <Link
                href="/products"
                className="bg-[#111] px-7 py-3 text-[11px] tracking-widest text-white uppercase transition-colors hover:bg-[#333]"
              >
                {t('hero.shopNow')}
              </Link>
              <Link
                href="/products?sort=newest"
                className="border border-[#ddd] px-7 py-3 text-[11px] tracking-widest text-[#111] uppercase transition-colors hover:border-[#111]"
              >
                {t('hero.newArrivals')}
              </Link>
            </div>
          </div>

          {/* 하단 스탯 */}
          <div className="mt-10 flex gap-8 border-t border-[#e5e5e5] pt-8">
            {[
              { val: '16', label: t('stat.products') },
              { val: 'KR · EN', label: t('stat.language') },
              { val: 'WW', label: t('stat.shipping') },
            ].map((stat) => (
              <div key={stat.label}>
                <Text as="p" className="font-serif text-[22px] text-[#111]">
                  {stat.val}
                </Text>
                <Text as="p" className="mt-1 text-[11px] text-[#aaa]">
                  {stat.label}
                </Text>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals ── */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-7 py-5">
        <Text as="h2" className="font-serif text-[20px] text-[#111]">
          {t('section.newArrivals')}
        </Text>
        <Link
          href="/products?sort=newest"
          className="border-b border-[#aaa] pb-0.5 text-[11px] tracking-widest text-[#aaa] uppercase transition-colors hover:border-[#111] hover:text-[#111]"
        >
          {t('section.viewAll')}
        </Link>
      </div>

      {/* ── 상품 미리보기 (실제 DB 최신 8개) ── */}
      <div className="grid grid-cols-2 border-b border-[#e5e5e5] md:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group border-r border-b border-[#e5e5e5] [&:nth-child(2n)]:border-r-0 md:[&:nth-child(2n)]:border-r md:[&:nth-child(4n)]:border-r-0"
          >
            <div className="relative flex aspect-3/4 items-center justify-center overflow-hidden bg-[#f5f5f5]">
              {product.images?.[0] ? (
                <Image
                  src={product.images[0]}
                  alt={localizedName(product, locale)}
                  fill
                  sizes="(max-width: 768px) 50vw, 25vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-[#e0dbd2]" />
              )}
            </div>
            <div className="border-t border-[#e5e5e5] p-4">
              <Text
                as="p"
                className="mb-1 text-[10px] tracking-widest text-[#aaa] uppercase"
              >
                {product.category ?? 'Butter Weather'}
              </Text>
              <Text
                as="p"
                className="mb-2 text-[13px] text-[#111] group-hover:underline"
              >
                {localizedName(product, locale)}
              </Text>
              <Text as="p" className="text-[13px] font-medium text-[#111]">
                {formatKRW(product.price_krw)}
              </Text>
            </div>
          </Link>
        ))}
      </div>

      {/* ── 브랜드 스토리 스트립 ── */}
      <div className="grid grid-cols-1 border-b border-[#e5e5e5] md:grid-cols-2">
        <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden border-b border-[#e5e5e5] bg-[#f7f4f0] p-16 md:border-r md:border-b-0">
          {products[1]?.images?.[0] ? (
            <Image
              src={products[1].images[0]}
              alt={localizedName(products[1], locale)}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <div className="border border-[#ddd] px-8 py-4 text-[11px] tracking-widest text-[#aaa] uppercase">
              Campaign Image
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center p-12">
          <Text
            as="p"
            className="mb-4 text-[10px] tracking-[0.12em] text-[#aaa] uppercase"
          >
            {t('brand.eyebrow')}
          </Text>
          <Text
            as="h3"
            className="mb-4 font-serif text-[22px] leading-snug whitespace-pre-line text-[#111]"
          >
            {t('brand.title')}
          </Text>
          <Text
            as="p"
            className="mb-6 text-[12px] leading-relaxed font-light whitespace-pre-line text-[#888]"
          >
            {t('brand.body')}
          </Text>
          <Link
            href="/about"
            className="inline-block w-fit border-b border-[#111] pb-0.5 text-[11px] tracking-widest text-[#111] uppercase transition-colors hover:border-[#555] hover:text-[#555]"
          >
            {t('brand.readMore')}
          </Link>
        </div>
      </div>
    </div>
  )
}
