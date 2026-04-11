import { useEffect, useRef } from 'react'

interface Options {
  onIntersect: () => void
  enabled?: boolean
}

export const useIntersectionObserver = ({ onIntersect, enabled = true }: Options) => {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!enabled || !ref.current) return
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) onIntersect() },
      { threshold: 0.1 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [enabled, onIntersect])
  return ref
}
