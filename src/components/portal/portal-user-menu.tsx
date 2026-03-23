'use client'

import { useState, useRef, useEffect, cloneElement, isValidElement, type ReactElement } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Crown, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from '@/store/auth-store'

type PortalUserMenuVariant = 'sidebar' | 'mobile-header'

interface PortalUserMenuProps {
  user: User | null
  variant: PortalUserMenuVariant
  /** Must be a single element (e.g. `<button>`) that receives merged `onClick` / `aria-*`. */
  children: ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
}

/**
 * User account menu anchored to the trigger (no Radix portal).
 * Avoids the dropdown “flying in” from the viewport edge.
 */
export function PortalUserMenu({ user, variant, children }: PortalUserMenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: PointerEvent) => {
      if (rootRef.current?.contains(e.target as Node)) return
      setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const trigger = isValidElement(children)
    ? cloneElement(children, {
        onClick: (e: React.MouseEvent) => {
          children.props.onClick?.(e)
          setOpen((v) => !v)
        },
        'aria-expanded': open,
        'aria-haspopup': 'menu' as const,
      })
    : children

  const itemClass =
    'flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:text-zinc-200 dark:hover:bg-white/[0.06]'

  return (
    <div
      className={cn('relative', variant === 'sidebar' && 'w-full')}
      ref={rootRef}
    >
      {trigger}
      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-[60] min-w-48 overflow-hidden rounded-xl border py-1 shadow-lg',
            'border-slate-200/90 bg-white dark:border-white/10 dark:bg-[#1c1c1c] dark:shadow-black/40',
            'origin-top-left animate-in fade-in zoom-in-95 duration-150',
            variant === 'sidebar' && 'bottom-0 left-full ml-2',
            variant === 'mobile-header' && 'right-0 top-full mt-2 origin-top-right'
          )}
        >
          <button
            type="button"
            role="menuitem"
            className={itemClass}
            onClick={() => {
              setOpen(false)
              router.push('/settings')
            }}
          >
            <Settings className="h-4 w-4 shrink-0 text-slate-500 dark:text-zinc-400" />
            Settings
          </button>
          {user?.role?.toLowerCase() === 'admin' && (
            <button
              type="button"
              role="menuitem"
              className={itemClass}
              onClick={() => {
                setOpen(false)
                router.push('/admin')
              }}
            >
              <Crown className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              Admin Panel
            </button>
          )}
          <div className="mx-2 my-1 h-px bg-slate-100 dark:bg-white/[0.06]" />
          <Link
            role="menuitem"
            href="/logout"
            prefetch={false}
            className={cn(itemClass, 'text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10')}
            onClick={() => setOpen(false)}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </Link>
        </div>
      )}
    </div>
  )
}
