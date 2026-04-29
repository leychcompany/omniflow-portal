'use client'

import { Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatTrainingSessionSchedule,
  type TrainingSessionDay,
} from '@/lib/format-training-session-schedule'

type TrainingScheduleDisplayProps = {
  days: ReadonlyArray<TrainingSessionDay>
  timezone: string
  className?: string
  /** Additional classes on the text column; icon row uses default portal styling */
  textClassName?: string
}

/**
 * One line per class day — always explicit, never grouped.
 * Times are shown in the class timezone (e.g. "10:00 AM (CST)").
 */
export function TrainingScheduleDisplay({
  days,
  timezone,
  className,
  textClassName,
}: TrainingScheduleDisplayProps) {
  const sched = formatTrainingSessionSchedule(days, timezone, undefined)

  if (sched.perDay.length === 0) {
    return null
  }

  return (
    <div className={cn('flex items-start gap-2', className)}>
      <Calendar className="h-4 w-4 mt-0.5 shrink-0 text-blue-500" aria-hidden />
      <ul className={cn('min-w-0 space-y-1', textClassName)}>
        {sched.perDay.map((d, idx) => (
          <li key={idx} className="leading-snug">
            <span className="font-medium text-slate-800 dark:text-zinc-200">{d.date}</span>
            <span className="text-slate-600 dark:text-zinc-400"> · {d.time}</span>
            {d.label && (
              <span className="text-slate-500 dark:text-zinc-500"> — {d.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
