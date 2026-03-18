'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

interface AdminCardGridProps {
  children: ReactNode
  className?: string
}

export function AdminCardGrid({ children, className }: AdminCardGridProps) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {children}
    </motion.div>
  )
}

interface AdminCardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function AdminCard({ children, className, onClick }: AdminCardProps) {
  return (
    <motion.div
      variants={item}
      onClick={onClick}
      className={cn(
        'group rounded-xl border border-slate-200 bg-white p-5 shadow-sm',
        'hover:shadow-lg hover:border-blue-200 hover:-translate-y-0.5',
        'transition-shadow transition-transform duration-200',
        onClick && 'cursor-pointer',
        className
      )}
      whileHover={{ scale: 1.01 }}
    >
      {children}
    </motion.div>
  )
}
