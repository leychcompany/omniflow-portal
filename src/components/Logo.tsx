import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

interface LogoProps {
  width?: number
  height?: number
  className?: string
  whiteLogo?: boolean
  href?: string
}

export const Logo: React.FC<LogoProps> = ({ width = 120, height = 42, className, whiteLogo = false, href }) => {
  const content = (
    <Image
      src={whiteLogo ? "/OmniWhite.svg" : "/logo.svg"}
      alt="Omniflow Logo"
      width={width}
      height={height}
      quality={100}
      className="object-contain"
      priority
    />
  )

  return (
    <div className={`flex items-center ${className}`}>
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
