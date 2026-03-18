'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ADMIN_TAB_COLORS, type AdminTabId } from '@/app/admin/_components/admin-types'

export interface DashboardStat {
  label: string
  value: string | number
}

interface AdminPageDashboardProps {
  title: string
  description?: string
  icon: ReactNode
  stats: DashboardStat[]
  accent?: AdminTabId
  className?: string
}

const DEFAULT_ACCENT = 'manuals' as const

export function AdminPageDashboard({
  title,
  description,
  icon,
  stats,
  accent = DEFAULT_ACCENT,
  className,
}: AdminPageDashboardProps) {
  const colors = ADMIN_TAB_COLORS[accent].dashboard
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        'group rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#141414] shadow-sm overflow-hidden',
        'border-l-4',
        colors.border,
        'transition-shadow duration-200 hover:shadow-md hover:border-slate-300 dark:hover:border-white/[0.12]',
        className
      )}
    >
      <div className="px-5 py-5 sm:px-6 sm:py-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-lg', colors.icon)}>
              {icon}
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-zinc-100 tracking-tight">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-slate-500 dark:text-zinc-400 mt-0.5">{description}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={cn('rounded-lg px-4 py-2.5 text-center', colors.pills)}
              >
                <p className="text-lg font-semibold text-slate-900 tabular-nums leading-none">
                  {stat.value}
                </p>
                <p className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 uppercase tracking-wider mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
