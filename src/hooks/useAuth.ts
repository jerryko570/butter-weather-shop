/**
 * useAuth — 지금 로그인한 사용자를 읽고, 로그아웃을 제공하는 훅 (클라이언트 전용)
 *
 * - user: 로그인한 사용자 (없으면 null)
 * - loading: 최초 사용자 확인 중인지 (깜빡임 방지용)
 * - signOut: 로그아웃 (세션 쿠키 제거)
 *
 * onAuthStateChange로 로그인/로그아웃이 일어나면 자동으로 user가 갱신된다.
 */

'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useAuth() {
  // 한 번 만든 클라이언트를 계속 재사용 (매 렌더마다 새로 만들지 않게)
  const [supabase] = useState(() => createClient())
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1) 최초 진입 시 현재 사용자 확인
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      setLoading(false)
    })

    // 2) 이후 로그인/로그아웃이 생기면 user를 자동 갱신
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return { user, loading, signOut }
}
