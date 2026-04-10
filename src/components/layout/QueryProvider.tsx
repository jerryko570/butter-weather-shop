'use client'

// TanStack Query를 앱 전체에서 쓸 수 있게 감싸주는 Provider
// layout.tsx에서 한 번만 감싸면 모든 페이지에서 useProducts 등 사용 가능

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // QueryClient를 useState로 만드는 이유:
  // 컴포넌트 바깥에 두면 서버/클라이언트 간 데이터가 공유돼서 버그 생김
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 네트워크 재연결 시 자동 재시도 횟수
            retry: 1,
            // 창 포커스 시 자동 refetch 끔 (쇼핑몰은 불필요)
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* 개발 중에만 보이는 쿼리 디버거 */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
