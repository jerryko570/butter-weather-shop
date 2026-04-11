import Link from 'next/link'

// 홈은 서버 컴포넌트 (SEO + 빠른 초기 렌더링)
// 상품 목록은 /products 페이지에서 클라이언트 사이드로 필터링

export default function HomePage() {
  return (
    <div>

      {/* ── 티커 배너 ── */}
      <div className="border-b border-[#e5e5e5] px-7 py-2.5 flex items-center gap-10 overflow-hidden">
        {['Free shipping over ₩50,000', 'New arrivals every week', 'Worldwide shipping', 'Designed in Seoul'].map((text) => (
          <span key={text} className="text-[11px] tracking-widest uppercase text-[#aaa] whitespace-nowrap">
            {text}
          </span>
        ))}
      </div>

      {/* ── 히어로 ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 border-b border-[#e5e5e5]">

        {/* 이미지 영역 */}
        <div className="relative bg-[#f0ede8] min-h-[400px] md:min-h-[520px] flex items-center justify-center border-b md:border-b-0 md:border-r border-[#e5e5e5]">
          <span className="absolute top-6 left-6 text-[10px] tracking-[0.14em] uppercase text-[#aaa]">
            SS 2026
          </span>
          {/* TODO: 실제 상품 이미지로 교체 */}
          <div className="w-48 h-48 rounded-full bg-[#e0dbd2] flex items-center justify-center">
            <div className="w-28 h-28 rounded-full bg-[#c8c2b5]" />
          </div>
        </div>

        {/* 텍스트 영역 */}
        <div className="flex flex-col justify-between p-12 md:p-14">
          <div>
            <p className="text-[10px] tracking-[0.14em] uppercase text-[#aaa] mb-5">
              New Collection — Spring / Summer 2026
            </p>
            <h1 className="font-serif text-[38px] leading-[1.15] text-[#111] mb-5">
              Designed for<br />
              your <em className="italic text-[#aaa]">everyday</em><br />
              moments.
            </h1>
            <p className="text-[13px] text-[#777] leading-relaxed max-w-xs font-light">
              키링 하나, 비즈 하나가 담아내는 감정.<br />
              작은 오브제로 하루를 디자인합니다.
            </p>
            <div className="flex gap-3 mt-10">
              <Link
                href="/products"
                className="bg-[#111] text-white text-[11px] tracking-widest uppercase px-7 py-3 hover:bg-[#333] transition-colors"
              >
                Shop Now
              </Link>
              <Link
                href="/products?sort=newest"
                className="border border-[#ddd] text-[#111] text-[11px] tracking-widest uppercase px-7 py-3 hover:border-[#111] transition-colors"
              >
                New Arrivals
              </Link>
            </div>
          </div>

          {/* 하단 스탯 */}
          <div className="flex gap-8 pt-8 mt-10 border-t border-[#e5e5e5]">
            {[
              { val: '84', label: 'Products' },
              { val: 'KR · EN', label: 'Language' },
              { val: 'WW', label: 'Shipping' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-[22px] text-[#111]">{stat.val}</p>
                <p className="text-[11px] text-[#aaa] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── New Arrivals 링크 ── */}
      <div className="flex items-center justify-between px-7 py-5 border-b border-[#e5e5e5]">
        <h2 className="font-serif text-[20px] text-[#111]">New Arrivals</h2>
        <Link
          href="/products?sort=newest"
          className="text-[11px] tracking-widest uppercase text-[#aaa] border-b border-[#aaa] pb-0.5 hover:text-[#111] hover:border-[#111] transition-colors"
        >
          View All
        </Link>
      </div>

      {/* ── 상품 미리보기 (서버에서 최신 4개 fetch) ── */}
      {/* TODO: Supabase 연결 후 실제 데이터로 교체 */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#e5e5e5]">
        {['Butter Drop Keyring', 'Cloud Bead Bracelet', 'Sunny Charm', 'Rainy Day Earring'].map((name, i) => (
          <div key={name} className="border-r border-[#e5e5e5] last:border-r-0">
            <div className="aspect-[3/4] bg-[#f5f5f5] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-[#e0dbd2]" />
            </div>
            <div className="p-4 border-t border-[#e5e5e5]">
              <p className="text-[10px] text-[#aaa] tracking-widest uppercase mb-1">Butter Weather</p>
              <p className="text-[13px] text-[#111] mb-2">{name}</p>
              <p className="text-[13px] font-medium text-[#111]">₩{(16 + i * 2).toLocaleString()},000</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── 브랜드 스토리 스트립 ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 border-b border-[#e5e5e5]">
        <div className="bg-[#f7f4f0] flex items-center justify-center p-16 border-b md:border-b-0 md:border-r border-[#e5e5e5] min-h-[200px]">
          {/* TODO: 캠페인 이미지 */}
          <div className="border border-[#ddd] px-8 py-4 text-[11px] text-[#aaa] tracking-widest uppercase">
            Campaign Image
          </div>
        </div>
        <div className="flex flex-col justify-center p-12">
          <p className="text-[10px] tracking-[0.12em] uppercase text-[#aaa] mb-4">Brand Story</p>
          <h3 className="font-serif text-[22px] leading-snug text-[#111] mb-4">
            Small objects,<br />
            <em className="italic text-[#888]">honest design.</em>
          </h3>
          <p className="text-[12px] text-[#888] leading-relaxed font-light mb-6">
            날씨처럼 매일 달라지는 감정을 담아,<br />
            손 안에 쥘 수 있는 작은 것들을 만듭니다.
          </p>
          <Link
            href="/about"
            className="inline-block text-[11px] tracking-widest uppercase text-[#111] border-b border-[#111] pb-0.5 w-fit hover:text-[#555] hover:border-[#555] transition-colors"
          >
            Read More
          </Link>
        </div>
      </div>

    </div>
  )
}
