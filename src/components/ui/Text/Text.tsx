import React from 'react'
import { VariantProps } from 'class-variance-authority'
import { textVariant } from './Text.variants'
import { cn } from '@/lib/utils/cn'

type AsType = NonNullable<VariantProps<typeof textVariant>['as']>

type TextProps = {
  as?: AsType
  children: React.ReactNode
  className?: string
} & Omit<VariantProps<typeof textVariant>, 'as'> &
  React.HTMLAttributes<HTMLElement>

const elementMap: Record<AsType, React.ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body: 'p',
  p: 'p',
  caption: 'span',
}

export default function Text({
  as = 'p',
  children,
  className,
  ...rest
}: TextProps) {
  const Tag = elementMap[as]

  return (
    <Tag className={cn(textVariant({ as }), className)} {...rest}>
      {children}
    </Tag>
  )
}
