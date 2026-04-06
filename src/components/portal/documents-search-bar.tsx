'use client'

import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type DocumentsSearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  isLoading?: boolean
  disabled?: boolean
  inputClassName?: string
}

export function DocumentsSearchBar({
  value,
  onChange,
  placeholder = 'Search documents...',
  isLoading = false,
  disabled = false,
  inputClassName,
}: DocumentsSearchBarProps) {
  return (
    <div className="relative flex-1 w-full">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
      <Input
        type="text"
        autoComplete="off"
        enterKeyHint="search"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-busy={isLoading}
        className={cn(
          'h-11 w-full rounded-xl border-slate-200 bg-white pl-11 shadow-sm focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/50 dark:border-white/8 dark:bg-[#141414] dark:focus-visible:border-blue-500 dark:focus-visible:ring-blue-500/40',
          isLoading && 'pr-10',
          !isLoading && 'pr-4',
          inputClassName
        )}
      />
      {isLoading ? (
        <div
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
          aria-hidden
        >
          <Loader2 className="h-4 w-4 animate-spin text-slate-400 dark:text-zinc-500" />
        </div>
      ) : null}
    </div>
  )
}
