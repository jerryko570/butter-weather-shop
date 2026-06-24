import { createClient } from '@/lib/supabase/client'
import posthog from 'posthog-js'

type EventName =
  | 'product_view'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'purchase'
  | 'page_view'

interface EventProperties {
  product_id?: string
  product_name?: string
  category?: string
  price_krw?: number
  quantity?: number
  order_id?: string
  [key: string]: unknown
}

function getOrCreateSessionId(): string {
  const key = 'bw_session_id'
  let sessionId = sessionStorage.getItem(key)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(key, sessionId)
  }
  return sessionId
}

export const trackEvent = async (
  eventName: EventName,
  properties: EventProperties = {}
) => {
  // PostHog로도 전송 — 퍼널·세션 분석용 (초기화됐을 때만)
  if (posthog.__loaded) {
    posthog.capture(eventName, properties)
  }

  try {
    const supabase = createClient()
    const sessionId = getOrCreateSessionId()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    await supabase.from('analytics_events').insert({
      event_name: eventName,
      properties,
      user_id: user?.id ?? null,
      session_id: sessionId,
    })
  } catch (err) {
    console.warn('[Analytics] Event tracking failed:', err)
  }
}
