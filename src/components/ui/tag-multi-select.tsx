'use client'

import { useState, useRef, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { X, Trash2 } from 'lucide-react'

interface TagMultiSelectProps {
  value: string[]
  onChange: (tags: string[]) => void
  availableTags: string[]
  placeholder?: string
  disabled?: boolean
  className?: string
  onDeleteFromPool?: (tag: string) => void | Promise<void>
}

export function TagMultiSelect({
  value,
  onChange,
  availableTags,
  placeholder = 'Add or select tags...',
  disabled = false,
  className = '',
  onDeleteFromPool,
}: TagMultiSelectProps) {
  const [inputValue, setInputValue] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const [deletingTag, setDeletingTag] = useState<string | null>(null)
  const tagMap = new Map<string, string>()
  ;[...availableTags, ...value].forEach((tag) => {
    const key = tag.toLowerCase()
    if (!tagMap.has(key)) tagMap.set(key, tag)
  })
  const allTags = Array.from(tagMap.values()).sort((a, b) =>
    a.toLowerCase().localeCompare(b.toLowerCase())
  )
  const unselectedTags = allTags.filter(
    (t) => !value.some((v) => v.toLowerCase() === t.toLowerCase())
  )

  const handleDeleteFromPool = async (tag: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!onDeleteFromPool || deletingTag) return
    setDeletingTag(tag)
    try {
      await onDeleteFromPool(tag)
    } finally {
      setDeletingTag(null)
    }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    const key = trimmed.toLowerCase()
    const alreadyHas = value.some((v) => v.toLowerCase() === key)
    if (trimmed && !alreadyHas) {
      onChange([...value, trimmed])
    }
    setInputValue('')
    setIsOpen(false)
  }

  const removeTag = (tag: string) => {
    const key = tag.toLowerCase()
    onChange(value.filter((t) => t.toLowerCase() !== key))
  }

  const displayTags = value.filter(
    (tag, i, arr) => arr.findIndex((t) => t.toLowerCase() === tag.toLowerCase()) === i
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      addTag(inputValue.trim())
    }
    if (e.key === 'Backspace' && !inputValue && displayTags.length > 0) {
      removeTag(displayTags[displayTags.length - 1])
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        className={`flex min-h-11 flex-wrap gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500 ${disabled ? 'cursor-not-allowed bg-slate-50 opacity-60' : ''}`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        {displayTags.map((tag) => (
          <Badge
            key={tag.toLowerCase()}
            variant="secondary"
            className="flex items-center gap-1 pr-1 text-sm"
          >
            {tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  removeTag(tag)
                }}
                title={`Remove ${tag}`}
                className="ml-1 rounded-full p-0.5 hover:bg-slate-300 hover:text-slate-900 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm outline-none placeholder:text-slate-400"
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {inputValue.trim() && !allTags.includes(inputValue.trim()) && (
            <button
              type="button"
              className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-slate-100"
              onClick={() => addTag(inputValue.trim())}
            >
              <span className="text-slate-600">Add &quot;{inputValue.trim()}&quot;</span>
            </button>
          )}
          {unselectedTags.map((tag) => (
            <div
              key={tag}
              className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-slate-100 group"
            >
              <button
                type="button"
                className="flex-1 text-left text-sm"
                onClick={() => addTag(tag)}
              >
                {tag}
              </button>
              {onDeleteFromPool && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteFromPool(tag, e)}
                  disabled={deletingTag !== null}
                  title={`Permanently delete "${tag}" from the tag list`}
                  className="rounded p-1 text-slate-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {unselectedTags.length === 0 && !inputValue.trim() && (
            <div className="px-3 py-2 text-sm text-slate-500">No more tags to add</div>
          )}
        </div>
      )}
    </div>
  )
}
