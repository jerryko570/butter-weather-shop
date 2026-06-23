import type { Locale } from '@/store/localeStore'
import type { Product } from '@/types/product'

/**
 * UI 텍스트 사전 — 메뉴·버튼·섹션 제목 등 "화면 텍스트"만.
 * 상품 데이터(이름·설명)는 DB의 name/name_en 으로 분리되어 있어 여기 없다.
 *
 * 키 추가법: ko/en 양쪽에 같은 키를 넣으면 끝. 누락 시 키 문자열이 그대로 노출된다.
 */
export const dict = {
  ko: {
    'nav.shop': '샵',
    'nav.about': '소개',
    'nav.all': '전체',
    'nav.keyring': '키링',
    'nav.bead': '비즈',
    'nav.etc': '기타',
    'nav.new': '신상',
    'nav.bag': '장바구니',
    'nav.search': '검색',

    'ticker.shipping': '5만원 이상 무료배송',
    'ticker.new': '매주 새로운 입고',
    'ticker.worldwide': '전 세계 배송',
    'ticker.seoul': 'Designed in Seoul',

    'hero.eyebrow': '신규 컬렉션 — 2026 봄/여름',
    'hero.title': '당신의 매일을\n위한 디자인.',
    'hero.body':
      '키링 하나, 비즈 하나가 담아내는 감정.\n작은 오브제로 하루를 디자인합니다.',
    'hero.shopNow': '쇼핑하기',
    'hero.newArrivals': '신상품',
    'stat.products': '상품',
    'stat.language': '언어',
    'stat.shipping': '배송',

    'section.newArrivals': '신상품',
    'section.viewAll': '전체 보기',
    'section.bestSeller': '베스트',

    'brand.eyebrow': '브랜드 스토리',
    'brand.title': '작은 오브제,\n정직한 디자인.',
    'brand.body':
      '날씨처럼 매일 달라지는 감정을 담아,\n손 안에 쥘 수 있는 작은 것들을 만듭니다.',
    'brand.readMore': '더 알아보기',

    'about.eyebrow': '소개',
    'about.title': '날씨처럼,\n매일 다른 감정을 담아.',
    'about.body1':
      'Butter Weather는 키링과 비즈 악세사리를 만드는 디자인 스튜디오입니다. 맑은 날의 햇살, 비 오는 날의 차분함, 흐린 날의 포근함 — 매일 달라지는 날씨와 감정을 작은 오브제에 담습니다.',
    'about.body2':
      '하나하나 직접 디자인하고 손으로 만듭니다. 크지 않지만 정직하게, 오래 곁에 둘 수 있는 것들을 지향합니다.',
    'about.body3':
      '서울에서 시작해 전 세계로. 작은 것이 주는 큰 기쁨을 더 많은 사람과 나누고 싶습니다.',
    'about.values': '우리가 지키는 것',
    'about.value1.title': '직접 디자인',
    'about.value1.body': '모든 제품을 직접 설계하고 만듭니다.',
    'about.value2.title': '정직한 소재',
    'about.value2.body': '오래 쓸 수 있는 단단한 재료만.',
    'about.value3.title': '작은 정성',
    'about.value3.body': '하나하나 손으로 마무리합니다.',
    'about.cta': '컬렉션 둘러보기',

    'footer.shop': 'Shop',
    'footer.order': 'Order',
    'footer.brand': 'Brand',
    'footer.newArrivals': '신상품',
    'footer.allProducts': '전체 상품',
    'footer.shippingInfo': '배송 안내',
    'footer.returns': '교환·반품',
    'footer.faq': '자주 묻는 질문',
    'footer.about': '브랜드 소개',
    'footer.contact': '문의',
    'footer.rights': '© 2026 Butter Weather. All rights reserved.',
  },
  en: {
    'nav.shop': 'Shop',
    'nav.about': 'About',
    'nav.all': 'All',
    'nav.keyring': 'Keyring',
    'nav.bead': 'Bead',
    'nav.etc': 'Etc',
    'nav.new': 'New',
    'nav.bag': 'Bag',
    'nav.search': 'Search',

    'ticker.shipping': 'Free shipping over ₩50,000',
    'ticker.new': 'New arrivals every week',
    'ticker.worldwide': 'Worldwide shipping',
    'ticker.seoul': 'Designed in Seoul',

    'hero.eyebrow': 'New Collection — Spring / Summer 2026',
    'hero.title': 'Designed for\nyour everyday\nmoments.',
    'hero.body':
      'The feeling held in a single keyring, a single bead.\nWe design your day with small objects.',
    'hero.shopNow': 'Shop Now',
    'hero.newArrivals': 'New Arrivals',
    'stat.products': 'Products',
    'stat.language': 'Language',
    'stat.shipping': 'Shipping',

    'section.newArrivals': 'New Arrivals',
    'section.viewAll': 'View All',
    'section.bestSeller': 'Best Seller',

    'brand.eyebrow': 'Brand Story',
    'brand.title': 'Small objects,\nhonest design.',
    'brand.body':
      'Holding emotions that shift daily like the weather,\nwe make small things you can hold in your hand.',
    'brand.readMore': 'Read More',

    'about.eyebrow': 'About',
    'about.title': 'Like the weather,\nholding a different feeling each day.',
    'about.body1':
      'Butter Weather is a design studio making keyrings and beaded accessories. Sunshine on a clear day, calm on a rainy day, warmth on a cloudy one — we capture the ever-changing weather and emotions in small objects.',
    'about.body2':
      'Each piece is designed and handmade by us. Not big, but honest — things you can keep close for a long time.',
    'about.body3':
      'Starting in Seoul, reaching the world. We want to share the big joy of small things with more people.',
    'about.values': 'What We Stand For',
    'about.value1.title': 'Designed by us',
    'about.value1.body': 'Every product is designed and made in-house.',
    'about.value2.title': 'Honest materials',
    'about.value2.body': 'Only sturdy materials made to last.',
    'about.value3.title': 'Small devotion',
    'about.value3.body': 'Each piece is finished by hand.',
    'about.cta': 'Browse the Collection',

    'footer.shop': 'Shop',
    'footer.order': 'Order',
    'footer.brand': 'Brand',
    'footer.newArrivals': 'New Arrivals',
    'footer.allProducts': 'All Products',
    'footer.shippingInfo': 'Shipping Info',
    'footer.returns': 'Returns',
    'footer.faq': 'FAQ',
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'footer.rights': '© 2026 Butter Weather. All rights reserved.',
  },
} as const

export type TranslationKey = keyof (typeof dict)['ko']

/** 상품 이름을 현재 언어로 — 영문이 비어있으면 국문으로 폴백 */
export const localizedName = (product: Product, locale: Locale) =>
  locale === 'en' && product.name_en ? product.name_en : product.name

/** 상품 설명을 현재 언어로 — 영문이 비어있으면 국문으로 폴백 */
export const localizedDescription = (product: Product, locale: Locale) =>
  locale === 'en' && product.description_en
    ? product.description_en
    : product.description
