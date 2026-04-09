'use client'

import {
  useLayoutEffect,
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type CSSProperties,
  type RefObject,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

const MENU_MIN_W_PX = 176
const GAP_PX = 6
const VIEW_MARGIN = 8
/** Approximate height for flip detection; real menu is ~2 items. */
const APPROX_MENU_H = 132

export function TableRowMenuPortal({
  open,
  onClose,
  anchorRef,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  anchorRef: RefObject<HTMLElement | null>
  children: ReactNode
  className?: string
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [style, setStyle] = useState<CSSProperties | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null)
      return
    }
    const el = anchorRef.current
    if (!el) {
      setStyle(null)
      return
    }
    const r = el.getBoundingClientRect()
    const left = Math.min(
      Math.max(VIEW_MARGIN, r.right - MENU_MIN_W_PX),
      window.innerWidth - MENU_MIN_W_PX - VIEW_MARGIN
    )
    const spaceBelow = window.innerHeight - r.bottom - VIEW_MARGIN
    const spaceAbove = r.top - VIEW_MARGIN
    const openUp = spaceBelow < APPROX_MENU_H && spaceAbove > spaceBelow
    const topBelow = r.bottom + GAP_PX
    const topAbove = Math.max(VIEW_MARGIN, r.top - APPROX_MENU_H - GAP_PX)
    const top = openUp ? topAbove : topBelow
    const maxH = Math.max(80, window.innerHeight - top - VIEW_MARGIN)
    setStyle({
      position: 'fixed',
      left,
      top,
      minWidth: MENU_MIN_W_PX,
      maxHeight: maxH,
      zIndex: 100,
    })
  }, [open, anchorRef])

  useEffect(() => {
    if (!open) return
    const onPtr = (e: PointerEvent) => {
      const t = e.target as Node
      if (anchorRef.current?.contains(t)) return
      if (menuRef.current?.contains(t)) return
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    const dismiss = () => onClose()
    document.addEventListener('pointerdown', onPtr, true)
    document.addEventListener('keydown', onKey)
    window.addEventListener('scroll', dismiss, true)
    window.addEventListener('resize', dismiss)
    return () => {
      document.removeEventListener('pointerdown', onPtr, true)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('scroll', dismiss, true)
      window.removeEventListener('resize', dismiss)
    }
  }, [open, onClose, anchorRef])

  if (!open || style === null || typeof document === 'undefined') return null

  return createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={style}
      className={cn(
        'overflow-y-auto overflow-x-hidden rounded-xl border border-slate-200/90 bg-white py-1 shadow-lg shadow-slate-900/10',
        'dark:border-white/[0.1] dark:bg-[#1c1c1c] dark:shadow-black/40',
        'transition-none',
        className
      )}
    >
      {children}
    </div>,
    document.body
  )
}
