import Link from 'next/link'

// 홈은 서버 컴포넌트 (SEO + 빠른 초기 렌더링)
// 상품 목록은 /products 페이지에서 클라이언트 사이드로 필터링

export default function HomePage() {
  return (
    <div>
      {/* ── 티커 배너 ── */}
      <div className="flex items-center gap-10 overflow-hidden border-b border-[#e5e5e5] px-7 py-2.5">
        {[
          'Free shipping over ₩50,000',
          'New arrivals every week',
          'Worldwide shipping',
          'Designed in Seoul',
        ].map((text) => (
          <span
            key={text}
            className="text-[11px] tracking-widest whitespace-nowrap text-[#aaa] uppercase"
          >
            {text}
          </span>
        ))}
      </div>

      {/* ── 히어로 ── */}
      <section className="grid grid-cols-1 border-b border-[#e5e5e5] md:grid-cols-2">
        {/* 이미지 영역 */}
        <div className="relative flex min-h-[400px] items-center justify-center border-b border-[#e5e5e5] bg-[#f0ede8] md:min-h-[520px] md:border-r md:border-b-0">
          <span className="absolute top-6 left-6 text-[10px] tracking-[0.14em] text-[#aaa] uppercase">
            SS 2026
          </span>
          {/* TODO: 실제 상품 이미지로 교체 */}
          <div className="flex h-48 w-48 items-center justify-center rounded-full bg-[#e0dbd2]">
            <div className="h-28 w-28 rounded-full bg-[#c8c2b5]" />
          </div>
        </div>

        {/* 텍스트 영역 */}
        <div className="flex flex-col justify-between p-12 md:p-14">
          <div>
            <p className="mb-5 text-[10px] tracking-[0.14em] text-[#aaa] uppercase">
              New Collection — Spring / Summer 2026
            </p>
            <h1 className="mb-5 font-serif text-[38px] leading-[1.15] text-[#111]">
              Designed for
              <br />
              your <em className="text-[#aaa] italic">everyday</em>
              <br />
              moments.
            </h1>
            <p className="max-w-xs text-[13px] leading-relaxed font-light text-[#777]">
              키링 하나, 비즈 하나가 담아내는 감정.
              <br />
              작은 오브제로 하루를 디자인합니다.
            </p>
            <div className="mt-10 flex gap-3">
              <Link
                href="/products"
                className="bg-[#111] px-7 py-3 text-[11px] tracking-widest text-white uppercase transition-colors hover:bg-[#333]"
              >
                Shop Now
              </Link>
              <Link
                href="/products?sort=newest"
                className="border border-[#ddd] px-7 py-3 text-[11px] tracking-widest text-[#111] uppercase transition-colors hover:border-[#111]"
              >
                New Arrivals
              </Link>
            </div>
          </div>

          {/* 하단 스탯 */}
          <div className="mt-10 flex gap-8 border-t border-[#e5e5e5] pt-8">
            {[
              { val: '84', label: 'Products' },
              { val: 'KR · EN', label: 'Language' },
              { val: 'WW', label: 'Shipping' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-[22px] text-[#111]">{stat.val}</p>
                <p className="mt-1 text-[11px] text-[#aaa]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals 링크 ── */}
      <div className="flex items-center justify-between border-b border-[#e5e5e5] px-7 py-5">
        <h2 className="font-serif text-[20px] text-[#111]">New Arrivals</h2>
        <Link
          href="/products?sort=newest"
          className="border-b border-[#aaa] pb-0.5 text-[11px] tracking-widest text-[#aaa] uppercase transition-colors hover:border-[#111] hover:text-[#111]"
        >
          View All
        </Link>
      </div>

      {/* ── 상품 미리보기 (서버에서 최신 4개 fetch) ── */}
      {/* TODO: Supabase 연결 후 실제 데이터로 교체 */}
      <div className="grid grid-cols-2 border-b border-[#e5e5e5] md:grid-cols-4">
        {[
          'Butter Drop Keyring',
          'Cloud Bead Bracelet',
          'Sunny Charm',
          'Rainy Day Earring',
        ].map((name, i) => (
          <div key={name} className="border-r border-[#e5e5e5] last:border-r-0">
            <div className="flex aspect-[3/4] items-center justify-center bg-[#f5f5f5]">
              <div className="h-16 w-16 rounded-full bg-[#e0dbd2]" />
            </div>
            <div className="border-t border-[#e5e5e5] p-4">
              <p className="mb-1 text-[10px] tracking-widest text-[#aaa] uppercase">
                Butter Weather
              </p>
              <p className="mb-2 text-[13px] text-[#111]">{name}</p>
              <p className="text-[13px] font-medium text-[#111]">
                ₩{(16 + i * 2).toLocaleString()},000
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 브랜드 스토리 스트립 ── */}
      <div className="grid grid-cols-1 border-b border-[#e5e5e5] md:grid-cols-2">
        <div className="flex min-h-[200px] items-center justify-center border-b border-[#e5e5e5] bg-[#f7f4f0] p-16 md:border-r md:border-b-0">
          {/* TODO: 캠페인 이미지 */}
          <div className="border border-[#ddd] px-8 py-4 text-[11px] tracking-widest text-[#aaa] uppercase">
            Campaign Image
          </div>
        </div>
        <div className="flex flex-col justify-center p-12">
          <p className="mb-4 text-[10px] tracking-[0.12em] text-[#aaa] uppercase">
            Brand Story
          </p>
          <h3 className="mb-4 font-serif text-[22px] leading-snug text-[#111]">
            Small objects,
            <br />
            <em className="text-[#888] italic">honest design.</em>
          </h3>
          <p className="mb-6 text-[12px] leading-relaxed font-light text-[#888]">
            날씨처럼 매일 달라지는 감정을 담아,
            <br />손 안에 쥘 수 있는 작은 것들을 만듭니다.
          </p>
          <Link
            href="/about"
            className="inline-block w-fit border-b border-[#111] pb-0.5 text-[11px] tracking-widest text-[#111] uppercase transition-colors hover:border-[#555] hover:text-[#555]"
          >
            Read More
          </Link>
        </div>
      </div>
    </div>
  )
}
