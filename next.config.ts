import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  // 프로젝트 루트를 이 폴더로 못박는다.
  // (홈 디렉토리에 떠돌이 lockfile이 있어서 Next.js가 루트를 헷갈리던 경고 해결)
  turbopack: {
    root: path.resolve(__dirname),
  },
}

export default nextConfig
