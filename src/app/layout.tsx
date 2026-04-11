import type { Metadata } from 'next'
import QueryProvider from '@/components/layout/QueryProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Butter Weather Shop',
  description: '버터웨더 쇼핑몰',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
