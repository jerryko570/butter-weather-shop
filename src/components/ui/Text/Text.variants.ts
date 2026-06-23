import { cva } from 'class-variance-authority'

export const textVariant = cva('', {
  variants: {
    as: {
      display: 'text-[4.5rem] leading-[1.2] font-extrabold', // 72px
      h1: 'text-[3.5rem] leading-[1.2] font-bold', // 56px
      h2: 'text-[3rem] leading-[1.3] font-bold', // 48px
      h3: 'text-[2.5rem] leading-[1.3] font-semibold', // 40px
      h4: 'text-[2rem] leading-[1.4] font-semibold', // 32px
      h5: 'text-[1.75rem] leading-[1.5] font-medium', // 28px
      h6: 'text-[1.5rem] leading-[1.5] font-medium', // 24px
      body: 'text-[1.125rem] leading-[1.6] font-normal', // 18px
      p: 'text-[1rem] leading-[1.8] font-normal', // 16px
      caption: 'text-[0.875rem] leading-[1.4] font-normal', // 14px
    },
  },
  defaultVariants: {
    as: 'p',
  },
})
