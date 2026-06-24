import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// 가벼운 i18n — 언어 상태만 전역으로 들고, URL은 안 바꾼다.
// (글로벌 확장 시 next-intl 라우팅으로 승격 가능. 지금은 출시 속도 우선.)
export type Locale = 'ko' | 'en'

interface LocaleStore {
  locale: Locale
  setLocale: (locale: Locale) => void
  toggle: () => void
}

export const useLocaleStore = create<LocaleStore>()(
  persist(
    (set) => ({
      locale: 'ko',
      setLocale: (locale) => set({ locale }),
      toggle: () => set((s) => ({ locale: s.locale === 'ko' ? 'en' : 'ko' })),
    }),
    { name: 'bw-locale' } // localStorage 키 — 새로고침해도 언어 유지
  )
)
