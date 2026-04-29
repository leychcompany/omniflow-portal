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
 * Dates + Time lines aligned with training emails. Always renders in the
 * **class timezone** (e.g. "10:00 AM (CST)") regardless of the visitor.
 *
 * - When all days share the same hours: collapsed "Dates / Time (… each day)".
 * - When hours differ: a per-day list (date · time · optional label).
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
      <div className={cn('min-w-0 space-y-1', textClassName)}>
        {sched.uniform && sched.dates && sched.time ? (
          <>
            <p>
              <span className="font-medium text-slate-800 dark:text-zinc-200">Dates</span>
              <span className="text-slate-600 dark:text-zinc-400"> · {sched.dates}</span>
            </p>
            <p>
              <span className="font-medium text-slate-800 dark:text-zinc-200">Time</span>
              <span className="text-slate-600 dark:text-zinc-400"> · {sched.time}</span>
            </p>
          </>
        ) : (
          <ul className="space-y-1">
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
        )}
      </div>
    </div>
  )
}
