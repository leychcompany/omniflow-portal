'use client'

import { ReactNode, useEffect } from 'react'

interface AdminAddModalLayoutProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl'
  onBackdropClick?: () => void
}

const maxWidthClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-xl',
  xl: 'max-w-2xl',
}

export function AdminAddModalLayout({ children, maxWidth = 'md', onBackdropClick }: AdminAddModalLayoutProps) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    if (!onBackdropClick) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBackdropClick()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onBackdropClick])

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop - lighter, subtle */}
      <div
        className="fixed inset-0 bg-black/15 dark:bg-black/20"
        aria-hidden
        onClick={onBackdropClick}
      />
      {/* Modal card - max 90vh, scrolls when content overflows */}
      <div
        className={`relative z-50 w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto rounded-xl shadow-xl ring-1 ring-black/5 dark:ring-white/5 border border-zinc-200 dark:border-white/12 bg-white dark:bg-[#141414]`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
