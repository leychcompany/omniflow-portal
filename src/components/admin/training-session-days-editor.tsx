'use client'

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  formatTrainingSessionSchedule,
  type TrainingSessionDay,
} from '@/lib/format-training-session-schedule'
import { trainingTimezoneLabel } from '@/lib/training-timezones'

export type DraftDay = {
  day_date: string
  start_time: string
  end_time: string
  label: string
}

type TrainingSessionDaysEditorProps = {
  days: DraftDay[]
  timezone: string
  onChange: (days: DraftDay[]) => void
}

function addDayAfter(days: DraftDay[]): DraftDay[] {
  if (days.length === 0) {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return [{ day_date: `${yyyy}-${mm}-${dd}`, start_time: '09:00', end_time: '15:00', label: '' }]
  }
  const last = days[days.length - 1]
  const next = nextDateString(last.day_date)
  return [...days, { day_date: next, start_time: last.start_time, end_time: last.end_time, label: '' }]
}

function nextDateString(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map((s) => parseInt(s, 10))
  if (!y || !m || !d) {
    const t = new Date()
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`
  }
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + 1)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

function applyToAll(days: DraftDay[], src: DraftDay): DraftDay[] {
  return days.map((d, i) => (i === 0 ? d : { ...d, start_time: src.start_time, end_time: src.end_time }))
}

function trimSeconds(time: string): string {
  if (!time) return ''
  const parts = time.split(':')
  return parts.length >= 2 ? `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}` : time
}

function toPreviewDays(days: DraftDay[]): TrainingSessionDay[] {
  return days
    .filter((d) => d.day_date && d.start_time && d.end_time)
    .map((d, idx) => ({
      position: idx,
      day_date: d.day_date,
      start_time: trimSeconds(d.start_time),
      end_time: trimSeconds(d.end_time),
      label: d.label?.trim() || null,
    }))
}

export function TrainingSessionDaysEditor({ days, timezone, onChange }: TrainingSessionDaysEditorProps) {
  const tzLabel = trainingTimezoneLabel(timezone)
  const previewDays = toPreviewDays(days)
  const sched = formatTrainingSessionSchedule(previewDays, timezone, undefined)
  const validPreview = previewDays.length > 0 && previewDays.every((d) => d.start_time < d.end_time)

  const updateDay = (index: number, patch: Partial<DraftDay>) =>
    onChange(days.map((d, i) => (i === index ? { ...d, ...patch } : d)))
  const removeDay = (index: number) => onChange(days.filter((_, i) => i !== index))
  const addDay = () => onChange(addDayAfter(days))
  const applyAll = () => onChange(applyToAll(days, days[0]))

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Class days</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            All times in <span className="font-medium">{tzLabel}</span>. Different hours per day are supported.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addDay} className="gap-1.5">
          <Plus className="h-3.5 w-3.5" />
          Add day
        </Button>
      </div>

      {days.length === 0 ? (
        <p className="rounded-md border border-dashed border-zinc-300 dark:border-white/[0.12] p-4 text-sm text-zinc-500">
          No days yet. Add at least one day with a date and time range.
        </p>
      ) : (
        <div className="rounded-lg border border-zinc-200 dark:border-white/[0.08] overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[minmax(130px,1.4fr)_minmax(100px,0.9fr)_minmax(100px,0.9fr)_minmax(0,1.6fr)_auto] gap-x-3 px-3 py-2 bg-zinc-50/80 dark:bg-white/[0.03] border-b border-zinc-200 dark:border-white/[0.08]">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Date</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Start</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">End</span>
            <span className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Label <span className="normal-case font-normal">(optional)</span></span>
            <span className="w-8" />
          </div>

          {/* Rows */}
          <ul className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
            {days.map((d, i) => {
              const timeOrderError =
                d.start_time && d.end_time && trimSeconds(d.end_time) <= trimSeconds(d.start_time)
              return (
                <li key={i} className="px-3 py-2 space-y-1">
                  <div className="grid grid-cols-[minmax(130px,1.4fr)_minmax(100px,0.9fr)_minmax(100px,0.9fr)_minmax(0,1.6fr)_auto] items-center gap-x-3">
                    <Input
                      type="date"
                      required
                      value={d.day_date}
                      onChange={(e) => updateDay(i, { day_date: e.target.value })}
                      className="h-9"
                    />
                    <Input
                      type="time"
                      required
                      step={300}
                      value={d.start_time}
                      onChange={(e) => updateDay(i, { start_time: e.target.value })}
                      className="h-9"
                    />
                    <Input
                      type="time"
                      required
                      step={300}
                      value={d.end_time}
                      onChange={(e) => updateDay(i, { end_time: e.target.value })}
                      className="h-9"
                    />
                    <Input
                      type="text"
                      value={d.label}
                      placeholder="e.g. Day 1 — Hardware"
                      maxLength={200}
                      onChange={(e) => updateDay(i, { label: e.target.value })}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      onClick={() => removeDay(i)}
                      disabled={days.length <= 1}
                      aria-label={`Remove day ${i + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {timeOrderError && (
                    <p className="text-xs text-rose-600">End time must be after start time.</p>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Footer actions */}
          {days.length > 1 && (
            <div className="px-3 py-2 border-t border-zinc-100 dark:border-white/[0.05] bg-zinc-50/50 dark:bg-white/[0.02]">
              <button
                type="button"
                onClick={applyAll}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Apply day 1 times to all days
              </button>
            </div>
          )}
        </div>
      )}

      {validPreview && sched.perDay.length > 0 && (
        <div className="rounded-md border border-zinc-200 dark:border-white/[0.08] bg-white dark:bg-[#0e0e0e] p-3 text-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 mb-1">
            Preview (what users will see)
          </p>
          {sched.uniform && sched.dates && sched.time ? (
            <div className="space-y-0.5">
              <p>
                <span className="font-medium">Dates</span>
                <span className="text-zinc-600 dark:text-zinc-400"> · {sched.dates}</span>
              </p>
              <p>
                <span className="font-medium">Time</span>
                <span className="text-zinc-600 dark:text-zinc-400"> · {sched.time}</span>
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {sched.perDay.map((p, idx) => (
                <li key={idx}>
                  <span className="font-medium">{p.date}</span>
                  <span className="text-zinc-600 dark:text-zinc-400"> · {p.time}</span>
                  {p.label && <span className="text-zinc-500"> — {p.label}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
