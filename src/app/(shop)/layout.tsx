import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Footer } from '@/components/layout/Footer'
import { AccountNav } from '@/components/auth/AccountNav'
import { CartButton } from '@/components/layout/CartButton'

// 손님용 쇼핑몰 레이아웃 (nutats 구조) —
// 데스크톱: 좌측 세로 사이드바 + 우측 콘텐츠
// 모바일: 상단바(Header) + 콘텐츠
// 어드민(/admin)은 이 그룹 밖이라 이 네비가 안 붙는다.
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="md:flex md:min-h-screen">
      {/* 데스크톱 좌측 사이드바 */}
      <Sidebar />

      {/* 모바일 상단바 + 콘텐츠 + 푸터 */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        {/* 데스크톱 상단바 — 우측 계정 + 장바구니 (모바일은 Header가 대신) */}
        <div className="hidden items-center justify-end gap-5 border-b border-[#e5e5e5] bg-white px-6 py-3 md:flex">
          <AccountNav linkClass="text-[12px] text-[#555] transition-colors hover:text-[#111]" />
          <CartButton className="text-[12px] tracking-wide text-[#555] uppercase transition-colors hover:text-[#111]" />
        </div>

        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  )
}
