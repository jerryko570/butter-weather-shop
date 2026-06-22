import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// 손님용 쇼핑몰 레이아웃 — 헤더·푸터는 여기에만 붙는다.
// 어드민(/admin)은 이 그룹 밖이라 쇼핑몰 헤더가 보이지 않는다.
export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}
