/**
 * 회원가입 → 로그인으로 리다이렉트.
 *
 * 소셜 전용으로 전환하면서 회원가입은 로그인과 완전히 같은 흐름이 됐다.
 * (구글·카카오는 처음이면 자동 가입 + 로그인) → 별도 회원가입 페이지가 필요 없어
 * /login 으로 넘긴다. 기존에 /signup을 북마크했거나 링크로 들어와도 안 깨지게 유지.
 *
 * ?next=... 는 그대로 이어붙여, 로그인 후 원래 가려던 곳으로 돌아가게 한다.
 */

import { redirect } from 'next/navigation'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams
  redirect(next ? `/login?next=${encodeURIComponent(next)}` : '/login')
}
