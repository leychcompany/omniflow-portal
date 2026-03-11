'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Users, GraduationCap, BookOpen, Package, Newspaper, BarChart3 } from 'lucide-react'
import { ADMIN_TABS, type AdminTabId } from './admin-types'

const TAB_CONFIG: { id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'manuals', label: 'Documents', icon: BookOpen },
  { id: 'software', label: 'Software', icon: Package },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

function getTabButtonClass(activeTab: AdminTabId | null, id: AdminTabId) {
  const base = 'px-6 transition-all duration-200'
  if (activeTab !== id) return `${base} bg-transparent hover:bg-slate-50`
  switch (id) {
    case 'users': return `${base} bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md hover:from-red-700 hover:to-red-800`
    case 'training': return `${base} bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md hover:from-purple-700 hover:to-purple-800`
    case 'manuals': return `${base} bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-md hover:from-teal-700 hover:to-teal-800`
    case 'software': return `${base} bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-md hover:from-cyan-700 hover:to-cyan-800`
    case 'news': return `${base} bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md hover:from-blue-700 hover:to-blue-800`
    case 'analytics': return `${base} bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md hover:from-indigo-700 hover:to-indigo-800`
    default: return base
  }
}

export function AdminTabNav({ counts }: { counts?: Partial<Record<AdminTabId, number>> }) {
  const pathname = usePathname()
  const segment = pathname.replace(/^\/admin\/?/, '').split('/')[0]
  const activeTab = (ADMIN_TABS.includes(segment as AdminTabId) ? segment : null) as AdminTabId | null

  return (
    <div className="mb-8 hidden md:block">
      <div className="flex flex-wrap gap-2 bg-white p-1.5 rounded-xl shadow-lg border border-slate-200 w-fit">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <Button
            key={id}
            variant={activeTab === id ? 'default' : 'ghost'}
            asChild
            className={getTabButtonClass(activeTab, id)}
          >
            <Link href={`/admin/${id}`}>
              <Icon className="h-4 w-4 mr-2" />
              {label}{counts?.[id] != null ? ` (${counts?.[id]})` : ''}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}

export function AdminMobileTabNav({ counts }: { counts?: Partial<Record<AdminTabId, number>> }) {
  const pathname = usePathname()
  const segment = pathname.replace(/^\/admin\/?/, '').split('/')[0]
  const activeTab = (ADMIN_TABS.includes(segment as AdminTabId) ? segment : null) as AdminTabId | null

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-6 h-14">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id
          const activeColor = id === 'users' ? 'text-red-600' : id === 'training' ? 'text-purple-600' : id === 'manuals' ? 'text-teal-600' : id === 'software' ? 'text-cyan-600' : id === 'news' ? 'text-blue-600' : 'text-indigo-600'
          return (
            <Link
              key={id}
              href={`/admin/${id}`}
              className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors touch-manipulation ${
                isActive ? activeColor : 'text-slate-400'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-medium truncate w-full text-center">{label}{counts?.[id] != null ? ` (${counts?.[id]})` : ''}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
