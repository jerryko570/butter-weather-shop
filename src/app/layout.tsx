import type { Metadata } from 'next'
import { QueryProvider } from '@/components/layout/QueryProvider'
import './globals.css'
import './styles/theme.css'

export const metadata: Metadata = {
  title: 'Butter Weather — Design Accessories',
  description:
    '키링, 비즈 악세사리 디자인 편집샵. 작은 오브제로 하루를 디자인합니다.',
  openGraph: {
    title: 'Butter Weather',
    description: '디자이너가 만드는 디자인 편집샵',
    url: 'https://butterweather.shop',
    siteName: 'Butter Weather',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        {/* QueryProvider는 손님·어드민 공통이라 루트에 둔다.
            쇼핑몰 헤더·푸터는 (shop)/layout.tsx 로 옮겨, 어드민엔 안 붙는다. */}
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
