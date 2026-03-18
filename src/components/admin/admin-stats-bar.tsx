'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

export interface StatItem {
  label: string
  value: string | number
}

interface AdminStatsBarProps {
  stats: StatItem[]
  className?: string
}

export function AdminStatsBar({ stats, className }: AdminStatsBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'flex flex-wrap gap-4 py-3 px-4 rounded-xl',
        'bg-gradient-to-r from-blue-50/80 to-slate-50/80',
        'border border-blue-100/60',
        className
      )}
    >
      {stats.map((stat, i) => (
        <div key={stat.label} className="flex items-center gap-2">
          <span className="text-sm text-slate-500">{stat.label}</span>
          <span className="font-semibold text-slate-800">{stat.value}</span>
          {i < stats.length - 1 && (
            <span className="text-slate-300 mx-1">•</span>
          )}
        </div>
      ))}
    </motion.div>
  )
}
