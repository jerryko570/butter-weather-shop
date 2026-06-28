import React from 'react'
import { VariantProps } from 'class-variance-authority'
import { textVariant } from './Text.variants'
import { cn } from '@/lib/utils/cn'

type AsType = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'p' | 'span'

type textProps = {
  children: React.ReactNode
  className?: string
  as?: AsType
} & Omit<VariantProps<typeof textVariant>, 'as'> &
  React.HTMLAttributes<HTMLElement>

export default function Text({
  as = 'p',
  children,
  className,
  ...rest
}: textProps) {
  const Tag = as as React.ElementType

  return (
    <Tag className={cn(textVariant({ as }), className)} {...rest}>
      {children}
    </Tag>
  )
}
