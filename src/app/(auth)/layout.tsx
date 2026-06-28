// 인증 레이아웃 — 로그인/회원가입 전용.
// (shop) 그룹 밖이라 헤더·사이드바·푸터가 안 붙고, 중앙 정렬된 깔끔한 화면이 된다.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-cloud)] px-6">
      {children}
    </div>
  )
}
