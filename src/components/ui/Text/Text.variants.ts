import { cva } from 'class-variance-authority'

export const textVariant = cva('', {
  variants: {
    as: {
      h1: 'text-5xl font-bold', // 70px
      h2: 'text-4xl font-bold', // 34px
      h3: 'text-3xl font-semibold', // 30px
      h4: 'text-2xl font-semibold', // 26px
      h5: 'text-xl font-medium', // 22px
      p: 'text-sm font-normal', // 16px
      span: 'text-xs font-normal', // 14px
    },
    // 의미 variant — "라벨" 타이포(대문자 + 넓은 자간).
    // 크기·색은 쓰는 쪽에서 className으로 조절 (CART 14px / TOTAL 11px 등).
    variant: {
      default: '',
      label: 'tracking-label uppercase',
    },
  },
  defaultVariants: {
    as: 'p',
    variant: 'default',
  },
})
