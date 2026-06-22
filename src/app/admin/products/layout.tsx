import { AdminNav } from '@/components/admin/AdminNav'

// 상품 관리 화면 공통 레이아웃. (로그인 페이지엔 안 붙음 — 그건 /admin/login)
export default function AdminProductsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--color-cloud)]">
      <AdminNav />
      <main className="mx-auto max-w-3xl px-6 py-8">{children}</main>
    </div>
  )
}
