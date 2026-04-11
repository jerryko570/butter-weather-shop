import Link from 'next/link'

const FOOTER_LINKS = {
  Shop: [
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Keyring', href: '/products?category=keyring' },
    { label: 'Bead', href: '/products?category=bead' },
    { label: 'All Products', href: '/products' },
  ],
  Order: [
    { label: 'Shipping Info', href: '/info/shipping' },
    { label: 'Returns', href: '/info/returns' },
    { label: 'FAQ', href: '/info/faq' },
  ],
  Brand: [
    { label: 'About', href: '/about' },
    { label: 'Instagram', href: 'https://instagram.com' },
    { label: 'Smartstore', href: 'https://smartstore.naver.com/butterweather' },
    { label: 'Contact', href: 'mailto:email.narae@gmail.com' },
  ],
}

export function Footer() {
  return (
    <footer>
      {/* 링크 그리드 */}
      <div className="grid grid-cols-3 border-t border-[#e5e5e5]">
        {Object.entries(FOOTER_LINKS).map(([title, links]) => (
          <div
            key={title}
            className="border-r border-[#e5e5e5] p-7 last:border-r-0"
          >
            <p className="mb-4 text-[10px] tracking-[0.1em] text-[#aaa] uppercase">
              {title}
            </p>
            <ul className="flex flex-col gap-2">
              {links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[12px] text-[#555] transition-colors hover:text-[#111]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* 카피라이트 */}
      <div className="flex items-center justify-between border-t border-[#e5e5e5] px-7 py-4">
        <p className="text-[11px] text-[#bbb]">
          © 2026 Butter Weather. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <span className="cursor-pointer text-[11px] text-[#111]">KR</span>
          <span className="cursor-pointer text-[11px] text-[#bbb] hover:text-[#111]">
            EN
          </span>
        </div>
      </div>
    </footer>
  )
}
