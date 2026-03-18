'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ADMIN_TAB_COLORS, type AdminNavTabId } from './admin-types'

interface DashboardStatCardProps {
  label: string
  value: number
  icon: React.ReactNode
  accent: AdminNavTabId
  href?: string
}

export function DashboardStatCard({
  label,
  value,
  icon,
  accent,
  href,
}: DashboardStatCardProps) {
  const colors = ADMIN_TAB_COLORS[accent].dashboard
  const content = (
    <>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colors.icon)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-bold tabular-nums text-slate-900">
          {value.toLocaleString()}
        </p>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider break-words line-clamp-2 leading-tight">
          {label}
        </p>
      </div>
      {href && (
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors" />
      )}
    </>
  )

  const baseClasses = cn(
    'group flex items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-all duration-200',
    'border-l-4',
    colors.border,
    'hover:shadow-md hover:border-slate-300'
  )

  if (href) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <Link href={href} className={baseClasses}>
          {content}
        </Link>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={baseClasses}
    >
      {content}
    </motion.div>
  )
}
