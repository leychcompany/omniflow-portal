'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import {
  BookOpen,
  Newspaper,
  Package,
  GraduationCap,
  Users,
  BarChart3,
  Plus,
  Search,
  Home,
  LogOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const COMMANDS = [
  { id: 'manuals', label: 'Documents', icon: BookOpen, href: '/admin/manuals', keywords: ['docs', 'pdf', 'manuals'] },
  { id: 'manuals-add', label: 'Add Document', icon: Plus, href: '/admin/manuals/add', keywords: ['add', 'upload', 'new'] },
  { id: 'news', label: 'News', icon: Newspaper, href: '/admin/news', keywords: ['articles'] },
  { id: 'news-add', label: 'Add Article', icon: Plus, href: '/admin/news/add', keywords: ['add', 'new'] },
  { id: 'software', label: 'Software', icon: Package, href: '/admin/software', keywords: ['downloads'] },
  { id: 'software-add', label: 'Add Software', icon: Plus, href: '/admin/software/add', keywords: ['add', 'new'] },
  { id: 'training', label: 'Training', icon: GraduationCap, href: '/admin/training', keywords: ['courses'] },
  { id: 'training-add', label: 'Add Course', icon: Plus, href: '/admin/training/add', keywords: ['add', 'new'] },
  { id: 'users', label: 'Users', icon: Users, href: '/admin/users', keywords: ['people'] },
  { id: 'users-add', label: 'Add User', icon: Plus, href: '/admin/users/add', keywords: ['invite'] },
  { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/admin/analytics', keywords: ['stats', 'metrics'] },
  { id: 'home', label: 'Back to Portal', icon: Home, href: '/home', keywords: ['portal'] },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (href: string) => {
    if (href === '/login') {
      supabase.auth.signOut().then(() => { window.location.href = '/login' })
      return
    }
    router.push(href)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'hidden md:flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500',
          'border border-slate-200/80 bg-white/50 backdrop-blur-sm',
          'hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30',
          'transition-all duration-200 shadow-sm'
        )}
      >
        <Search className="h-4 w-4" />
        <span>Search...</span>
        <kbd className="ml-1 px-1.5 py-0.5 text-xs font-mono bg-slate-100 rounded border border-slate-200 text-slate-400">
          ⌘K
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Quick navigation"
        className={cn(
          'fixed left-1/2 top-[20%] -translate-x-1/2 z-[100]',
          'w-full max-w-xl rounded-2xl overflow-hidden',
          'bg-white/95 backdrop-blur-xl shadow-2xl shadow-slate-900/20',
          'border border-slate-200/80',
          'animate-in fade-in-0 zoom-in-95 duration-200'
        )}
      >
        <div className="flex items-center gap-3 border-b border-slate-200/80 px-4 py-3">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <Command.Input
            placeholder="Navigate or create..."
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <kbd className="hidden sm:inline px-2 py-1 text-xs font-mono text-slate-400 bg-slate-100 rounded">ESC</kbd>
        </div>
        <Command.List className="max-h-[320px] overflow-y-auto p-2">
          <Command.Empty className="py-8 text-center text-sm text-slate-500">No results found.</Command.Empty>
          <Command.Group heading="Navigate" className="mb-2">
            {COMMANDS.filter((c) => !c.id.includes('-add')).map((cmd) => (
              <Command.Item
                key={cmd.id}
                value={`${cmd.label} ${cmd.keywords?.join(' ') ?? ''}`}
                onSelect={() => handleSelect(cmd.href)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm',
                  'data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700',
                  'data-[selected=true]:outline-none'
                )}
              >
                {(() => { const Icon = cmd.icon; return <Icon className="h-4 w-4 text-slate-500 shrink-0" /> })()}
                {cmd.label}
              </Command.Item>
            ))}
          </Command.Group>
          <Command.Group heading="Quick actions" className="border-t border-slate-100 pt-2">
            {COMMANDS.filter((c) => c.id.includes('-add')).map((cmd) => (
              <Command.Item
                key={cmd.id}
                value={`${cmd.label} ${cmd.keywords?.join(' ') ?? ''}`}
                onSelect={() => handleSelect(cmd.href)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer text-sm',
                  'data-[selected=true]:bg-indigo-50 data-[selected=true]:text-indigo-700'
                )}
              >
                {(() => { const Icon = cmd.icon; return <Icon className="h-4 w-4 text-indigo-500 shrink-0" /> })()}
                <span className="font-medium">{cmd.label}</span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
        <div className="border-t border-slate-100 px-4 py-2 flex items-center gap-2 text-xs text-slate-400">
          <span>↑↓</span> <span>navigate</span>
          <span className="mx-2">•</span>
          <span>↵</span> <span>select</span>
        </div>
      </Command.Dialog>
    </>
  )
}
