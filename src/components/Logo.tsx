'use client'

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface LogoProps {
  width?: number
  height?: number
  className?: string
  whiteLogo?: boolean
  href?: string
}

export const Logo: React.FC<LogoProps> = ({ width = 120, height = 42, className, whiteLogo, href }) => {
  // Use CSS dark: variant so the correct logo shows immediately on F5 (no useTheme delay)
  const imgProps = { width, height, alt: 'Omniflow Logo' as const, quality: 100 as const, priority: true as const }

  const content =
    whiteLogo === true ? (
      <Image src="/OmniWhite.svg" {...imgProps} className="object-contain" />
    ) : whiteLogo === false ? (
      <Image src="/logo.svg" {...imgProps} className="object-contain" />
    ) : (
      <span className="relative inline-flex items-center" style={{ width, height }}>
        <Image src="/logo.svg" {...imgProps} className="object-contain dark:hidden" />
        <Image src="/OmniWhite.svg" {...imgProps} className="object-contain hidden dark:block absolute inset-0" />
      </span>
    )

  return (
    <div className={cn('flex items-center', className)}>
      {href ? (
        <Link href={href} className="flex items-center">
          {content}
        </Link>
      ) : (
        content
      )}
    </div>
  )
}
