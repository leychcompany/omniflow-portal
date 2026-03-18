'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Tag, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface TopTag {
  name: string
  count: number
}

interface DashboardTopTagsProps {
  tags: TopTag[]
}

export function DashboardTopTags({ tags }: DashboardTopTagsProps) {
  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Top tags</CardTitle>
          <Link
            href="/admin/manuals"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            Manage docs
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <p className="text-sm text-slate-500">Most used in documents</p>
      </CardHeader>
      <CardContent>
        {tags.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No tags yet</p>
        ) : (
          <ul className="space-y-2">
            {tags.map((tag, i) => (
              <motion.li
                key={tag.name}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg hover:bg-slate-50/80 transition-colors"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                    <Tag className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium text-slate-800 truncate">{tag.name}</span>
                </span>
                <span className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                  'bg-blue-50 text-blue-700 border border-blue-100'
                )}>
                  {tag.count}
                </span>
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
