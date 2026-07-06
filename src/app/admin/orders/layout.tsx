import { AdminNav } from '@/components/admin/AdminNav'

// 주문 관리 화면 공통 레이아웃. (상품 관리 레이아웃과 동일 — 로그인엔 안 붙음)
export default function AdminOrdersLayout({
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
