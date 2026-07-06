'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Text from '@/components/ui/Text/Text'

// 어드민 상단 바 — 제목 + 로그아웃. 상품 관리 화면 전체에 붙는다.
export function AdminNav() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // 현재 어느 탭인지 표시 (활성 탭은 진하게)
  const tabClass = (active: boolean) =>
    active
      ? 'text-[12px] font-medium text-[var(--color-ink)]'
      : 'text-[12px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]'

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.refresh()
    router.push('/admin/login')
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[#e5e5e5] bg-white px-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="font-serif text-[14px] tracking-[0.12em] text-[var(--color-ink)] uppercase"
        >
          Butter Weather
        </Link>
        <Text
          as="span"
          className="rounded-full bg-[var(--color-butter-light)] px-2 py-0.5 text-[10px] font-medium tracking-wide text-[var(--color-butter-dark)] uppercase"
        >
          Admin
        </Text>

        {/* 탭: 상품 / 주문 */}
        <nav className="ml-2 flex items-center gap-4">
          <Link
            href="/admin/products"
            className={tabClass(pathname.startsWith('/admin/products'))}
          >
            상품
          </Link>
          <Link
            href="/admin/orders"
            className={tabClass(pathname.startsWith('/admin/orders'))}
          >
            주문
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/"
          target="_blank"
          className="text-[11px] tracking-wide text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          사이트 보기 ↗
        </Link>
        <button
          onClick={handleSignOut}
          className="text-[11px] tracking-wide text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          로그아웃
        </button>
      </div>
    </header>
  )
}
