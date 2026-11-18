import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BrandLogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  linkToHome?: boolean
  theme?: 'dark' | 'light' | 'auto'
}

const sizeConfig = {
  sm: { icon: 28, text: 'text-lg', gap: 'gap-2' },
  md: { icon: 34, text: 'text-xl', gap: 'gap-2.5' },
  lg: { icon: 42, text: 'text-2xl', gap: 'gap-3' },
  xl: { icon: 54, text: 'text-3xl', gap: 'gap-3.5' },
}

/**
 * Official Tapqori Brand Logo Component.
 * Incorporates the official logo and favicon with perfect responsive scaling.
 */
export function BrandLogo({
  className,
  size = 'md',
  showText = true,
  linkToHome = true,
}: BrandLogoProps) {
  const { icon, text, gap } = sizeConfig[size]

  const content = (
    <div className={cn('inline-flex items-center select-none group', gap, className)}>
      <div className="relative shrink-0 overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-105 shadow-xs">
        <Image
          src="/tapqori-favicon.png"
          alt="Tapqori"
          width={icon}
          height={icon}
          priority
          className="object-contain"
        />
      </div>

      {showText && (
        <span className={cn('font-extrabold tracking-tight text-foreground transition-colors', text)}>
          tap<span className="text-[#13B1A5]">qori</span>
        </span>
      )}
    </div>
  )

  if (linkToHome) {
    return (
      <Link href="/" aria-label="Tapqori Home" className="focus:outline-hidden">
        {content}
      </Link>
    )
  }

  return content
}
