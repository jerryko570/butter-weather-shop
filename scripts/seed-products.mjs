/**
 * 더미 상품 시드 스크립트 (일회성, 레이아웃 테스트용)
 * - 기존 상품 중 이미지가 빈 것에 placeholder 채우기
 * - 새 상품 8개 추가 → 그리드 풍성하게
 * 실행: node scripts/seed-products.mjs
 * ⚠️ 이미지는 picsum 임시 플레이스홀더. 실제 촬영컷으로 교체할 것.
 */
import { readFileSync } from 'node:fs'

// .env.local 파싱
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

// 시드 기반 placeholder (slug마다 안정적으로 같은 이미지)
const img = (seed, w = 800, h = 1000) =>
  `https://picsum.photos/seed/bw-${seed}/${w}/${h}`
const gallery = (slug) => [img(`${slug}-1`), img(`${slug}-2`), img(`${slug}-3`)]
const detail = (slug) => [img(`${slug}-d1`, 768, 1024), img(`${slug}-d2`, 768, 1024)]

// ── 1) 기존 상품: 이미지 빈 것 채우기 ──
const existing = await fetch(
  `${URL_BASE}/rest/v1/products?select=id,slug,images,detail_images`,
  { headers }
).then((r) => r.json())

let patched = 0
for (const p of existing) {
  const body = {}
  if (!p.images || p.images.length === 0) body.images = gallery(p.slug)
  if (!p.detail_images || p.detail_images.length === 0)
    body.detail_images = detail(p.slug)
  if (Object.keys(body).length === 0) continue

  const res = await fetch(`${URL_BASE}/rest/v1/products?id=eq.${p.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  })
  if (res.ok) patched++
  else console.error('patch fail', p.slug, await res.text())
}
console.log(`✅ 기존 상품 이미지 채움: ${patched}개`)

// ── 2) 새 상품 추가 ──
const NEW = [
  {
    slug: 'cozy-cloud-keyring-ivory',
    name: '포근한 구름 키링 - 아이보리',
    name_en: 'Cozy Cloud Keyring - Ivory',
    description: '솜처럼 부드러운 구름 모양 아크릴 키링.\n흐린 날에도 마음만은 포근하게.',
    description_en: 'A soft, cloud-shaped acrylic keyring.\nKeep your heart cozy even on cloudy days.',
    price_krw: 17000,
    price_usd: 12.5,
    stock: 30,
    category: 'keyring',
    tags: ['구름', '파스텔', '겨울'],
    status: 'active',
  },
  {
    slug: 'rainbow-rain-charm-multi',
    name: '무지개 비 참 - 멀티',
    name_en: 'Rainbow Rain Charm - Multi',
    description: '비 온 뒤 무지개를 담은 참 장식.\n가방 끝에 작은 날씨 하나.',
    description_en: 'A charm holding the rainbow after the rain.\nA little weather for your bag.',
    price_krw: 14000,
    price_usd: 10.0,
    stock: 45,
    category: 'keyring',
    tags: ['무지개', '여름', '비'],
    status: 'active',
  },
  {
    slug: 'starlight-bead-bracelet-night',
    name: '별빛 비즈 팔찌 - 나이트',
    name_en: 'Starlight Bead Bracelet - Night',
    description: '밤하늘 별빛을 닮은 글래스 비즈 팔찌.\n은은하게 반짝이는 손목.',
    description_en: 'A glass bead bracelet like starlight.\nA wrist that softly sparkles.',
    price_krw: 26000,
    price_usd: 18.5,
    stock: 20,
    category: 'bead',
    tags: ['별', '비즈', '글래스'],
    status: 'active',
  },
  {
    slug: 'sunshine-daisy-keyring-yellow',
    name: '햇살 데이지 키링 - 옐로우',
    name_en: 'Sunshine Daisy Keyring - Yellow',
    description: '맑은 날의 데이지를 닮은 키링.\n버터 옐로우 컬러로 기분까지 밝게.',
    description_en: 'A keyring like a daisy on a sunny day.\nButter-yellow to brighten your mood.',
    price_krw: 16000,
    price_usd: 11.5,
    stock: 38,
    category: 'keyring',
    tags: ['데이지', '여름', '노랑'],
    status: 'active',
  },
  {
    slug: 'pastel-mist-earring-lilac',
    name: '파스텔 안개 귀걸이 - 라일락',
    name_en: 'Pastel Mist Earring - Lilac',
    description: '아침 안개처럼 은은한 파스텔 귀걸이.\n가볍고 부담 없는 데일리 무드.',
    description_en: 'Pastel earrings as soft as morning mist.\nLight and easy for everyday wear.',
    price_krw: 21000,
    price_usd: 15.0,
    stock: 25,
    category: 'bead',
    tags: ['안개', '파스텔', '귀걸이'],
    status: 'active',
  },
  {
    slug: 'cotton-candy-sky-necklace-pink',
    name: '솜사탕 하늘 목걸이 - 핑크',
    name_en: 'Cotton Candy Sky Necklace - Pink',
    description: '노을빛 솜사탕 하늘을 담은 비즈 목걸이.\n달콤한 핑크 그라데이션.',
    description_en: 'A bead necklace holding a cotton-candy sunset sky.\nA sweet pink gradient.',
    price_krw: 29000,
    price_usd: 20.5,
    stock: 15,
    category: 'bead',
    tags: ['노을', '핑크', '목걸이'],
    status: 'active',
  },
  {
    slug: 'rainy-umbrella-keyring-blue',
    name: '비 오는 날 우산 키링 - 블루',
    name_en: 'Rainy Day Umbrella Keyring - Blue',
    description: '작은 우산이 달린 키링.\n비 오는 날을 좋아하게 만드는 마스코트.',
    description_en: 'A keyring with a tiny umbrella.\nA mascot that makes you love rainy days.',
    price_krw: 15500,
    price_usd: 11.0,
    stock: 40,
    category: 'keyring',
    tags: ['우산', '비', '블루'],
    status: 'active',
  },
  {
    slug: 'sunset-gradient-bracelet-coral',
    name: '노을 그라데이션 팔찌 - 코랄',
    name_en: 'Sunset Gradient Bracelet - Coral',
    description: '해질녘 하늘의 그라데이션을 담은 팔찌.\n코랄에서 라벤더로 번지는 색.',
    description_en: 'A bracelet holding the gradient of a sunset sky.\nColor melting from coral to lavender.',
    price_krw: 23000,
    price_usd: 16.5,
    stock: 22,
    category: 'bead',
    tags: ['노을', '코랄', '그라데이션'],
    status: 'active',
  },
].map((p) => ({
  ...p,
  is_active: true,
  images: gallery(p.slug),
  detail_images: detail(p.slug),
}))

const insertRes = await fetch(`${URL_BASE}/rest/v1/products`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
  body: JSON.stringify(NEW),
})
if (insertRes.ok) console.log(`✅ 새 상품 추가: ${NEW.length}개`)
else console.error('insert fail', await insertRes.text())

// 최종 집계
const all = await fetch(
  `${URL_BASE}/rest/v1/products?select=id&is_active=eq.true`,
  { headers }
).then((r) => r.json())
console.log(`🎉 공개 상품 총 ${all.length}개`)
