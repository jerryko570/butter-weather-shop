'use client'

import { useLocaleStore } from '@/store/localeStore'
import { dict, type TranslationKey } from '@/lib/i18n/dictionary'

/**
 * 화면 텍스트 번역 훅.
 * const { t, locale, setLocale, toggle } = useT()
 * <span>{t('nav.shop')}</span>
 */
export function useT() {
  const { locale, setLocale, toggle } = useLocaleStore()

  const t = (key: TranslationKey) => dict[locale][key] ?? key

  return { t, locale, setLocale, toggle }
}
