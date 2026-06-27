/**
 * 더미 상품 1개 추가 (일회성)
 * 실행: node scripts/seed-one-product.mjs
 * ⚠️ 이미지는 picsum 임시 플레이스홀더. 실제 촬영컷으로 교체할 것.
 */
import { readFileSync } from 'node:fs'

const env = Object.fromEntries(
  readFileSync(new URL('../.env.local', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')]
    })
)

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL
const SR = env.SUPABASE_SERVICE_ROLE_KEY
const headers = {
  apikey: SR,
  Authorization: `Bearer ${SR}`,
  'Content-Type': 'application/json',
}

const img = (seed, w = 800, h = 1000) => `https://picsum.photos/seed/bw-${seed}/${w}/${h}`
const slug = 'misty-morning-keyring-mint'

const product = {
  slug,
  name: '안개 낀 아침 키링 - 민트',
  name_en: 'Misty Morning Keyring - Mint',
  description: '안개 낀 아침의 고요함을 담은 민트빛 키링.\n하루의 첫 숨처럼 산뜻하게.',
  description_en: 'A mint keyring holding the calm of a misty morning.\nFresh like the first breath of the day.',
  price_krw: 18000,
  price_usd: 13.0,
  stock: 33,
  category: 'keyring',
  tags: ['안개', '민트', '아침'],
  status: 'active',
  is_active: true,
  images: [img(`${slug}-1`), img(`${slug}-2`), img(`${slug}-3`)],
  detail_images: [img(`${slug}-d1`, 768, 1024), img(`${slug}-d2`, 768, 1024)],
}

const res = await fetch(`${URL_BASE}/rest/v1/products`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify(product),
})

if (res.ok) {
  const [row] = await res.json()
  console.log(`✅ 더미 상품 추가: ${row.name} (id: ${row.id})`)
} else {
  console.error('insert fail', await res.text())
  process.exit(1)
}
