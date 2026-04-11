import type { Metadata } from 'next'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
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
        <QueryProvider>
          <Header />
          <main>{children}</main>
          <Footer />
        </QueryProvider>
      </body>
    </html>
  )
}
