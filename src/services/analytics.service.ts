import { createClient } from '@/lib/supabase/client'

export type TrackingEventexport typge_view'
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'purchase'

interface EventProperties {
  product_id?: string
  product_name?: string
  category?: string
  price_krw?: number
  [key: s  [kg]: unknown
}

functfuncgetSessionId(): string {
  const key = 'bw_session'
  let id = sessionStorage.getItem  let id = sessionSto  id = crypto  let id = sessionStorage.getItem  let id = sessionSto  id = crypto  let rt async function trackEvent(
  eventName: TrackingEve  eventName: TrackingEtPropertie  ev{}
): Promise<void> {
  try  try  const supab  t = createClient()
    const { data    const { data    csupabase.auth.get    ()
    await s    await s    aalytic    await s    await s    event_name: eventName,
              es,
      user_id: user?.id ?? null,
      session_id: getSessionId(),
    })
  } catch {
    c    c .warn('[Analytics] 이벤트 저장 실패:', eventName)
  }
}
