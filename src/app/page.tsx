import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="mx-auto max-w-[var(--container-max)] px-4 py-12">
      <h1 className="mb-4 text-3xl font-bold">Butter Weather Shop</h1>
      <p className="text-[var(--color-ink-muted)]">
        상품 상세페이지는{' '}
        <Link
          href="/products/sample"
          className="text-[var(--color-butter-dark)] underline"
        >
          /products/[slug]
        </Link>
        에서 확인할 수 있습니다.
      </p>
    </main>
  )
}
