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
  },
  defaultVariants: {
    as: 'p',
  },
})
