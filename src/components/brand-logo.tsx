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

const logoDimensions = {
  sm: { height: 30, width: 66, iconSize: 30 },
  md: { height: 38, width: 84, iconSize: 38 },
  lg: { height: 50, width: 110, iconSize: 50 },
  xl: { height: 64, width: 140, iconSize: 64 },
}

/**
 * Official Tapqori Brand Logo Component.
 * Uses the user-provided official brand image asset with automatic dark/light theme support.
 */
export function BrandLogo({
  className,
  size = 'md',
  showText = true,
  linkToHome = true,
  theme = 'auto',
}: BrandLogoProps) {
  const dim = logoDimensions[size]

  const content = (
    <div className={cn('inline-flex items-center select-none group', className)}>
      {showText ? (
        <div className="relative inline-flex items-center transition-transform duration-200 group-hover:scale-102">
          {theme === 'light' ? (
            <Image
              src="/tapqori-logo.png"
              alt="Tapqori"
              width={dim.width}
              height={dim.height}
              priority
              style={{ height: dim.height, width: 'auto' }}
              className="object-contain"
            />
          ) : theme === 'dark' ? (
            <Image
              src="/tapqori-logo-dark.png"
              alt="Tapqori"
              width={dim.width}
              height={dim.height}
              priority
              style={{ height: dim.height, width: 'auto' }}
              className="object-contain"
            />
          ) : (
            <>
              {/* Light mode: crisp navy & teal brand logo */}
              <Image
                src="/tapqori-logo.png"
                alt="Tapqori"
                width={dim.width}
                height={dim.height}
                priority
                style={{ height: dim.height, width: 'auto' }}
                className="object-contain dark:hidden"
              />
              {/* Dark mode: crisp white & teal brand logo */}
              <Image
                src="/tapqori-logo-dark.png"
                alt="Tapqori"
                width={dim.width}
                height={dim.height}
                priority
                style={{ height: dim.height, width: 'auto' }}
                className="object-contain hidden dark:block"
              />
            </>
          )}
        </div>
      ) : (
        <div className="relative shrink-0 overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-105 shadow-xs">
          <Image
            src="/tapqori-favicon.png"
            alt="Tapqori"
            width={dim.iconSize}
            height={dim.iconSize}
            priority
            style={{ width: dim.iconSize, height: dim.iconSize }}
            className="object-contain rounded-xl"
          />
        </div>
      )}
    </div>
  )

  if (linkToHome) {
    return (
      <Link href="/" aria-label="Tapqori Home" className="focus:outline-hidden inline-flex items-center">
        {content}
      </Link>
    )
  }

  return content
}
