'use client'

import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Users,
  GraduationCap,
  BookOpen,
  Package,
  Newspaper,
  BarChart3,
  Home,
  LogOut,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { recordAuthEvent } from '@/lib/record-analytics-event'
import { CommandPalette } from '@/components/admin/command-palette'
import { ADMIN_TABS, ADMIN_TAB_COLORS, type AdminTabId } from './_components/admin-types'

const TAB_CONFIG: { id: AdminTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'training', label: 'Training', icon: GraduationCap },
  { id: 'manuals', label: 'Documents', icon: BookOpen },
  { id: 'software', label: 'Software', icon: Package },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const segment = pathname.replace(/^\/admin\/?/, '').split('/')[0]
  const activeTab = (ADMIN_TABS.includes(segment as AdminTabId) ? segment : null) as AdminTabId | null

  const handleSignOut = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      await recordAuthEvent('logout', session?.access_token)
      await supabase.auth.signOut()
      window.location.href = '/login'
    } catch {
      window.location.href = '/login'
    }
  }

  return (
    <div className="min-h-screen bg-slate-50/80">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent)]" />

      {/* Header with nav + search */}
      <header className="sticky top-0 z-30 flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-3 sm:px-4 lg:px-6 py-2.5 bg-slate-50/80 backdrop-blur-md border-b border-slate-200/60">
        <nav className="hidden md:flex items-center gap-0.5 flex-1 min-w-0">
          <Link
            href="/home"
            className="flex items-center justify-center h-9 w-9 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-colors shrink-0 mr-2 border-r border-slate-200 pr-2"
            title="Back to Portal"
          >
            <Home className="h-4 w-4" />
          </Link>
          {TAB_CONFIG.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            const colors = ADMIN_TAB_COLORS[id]
            return (
              <Link
                key={id}
                href={`/admin/${id}`}
                title={label}
                className={`flex items-center justify-center gap-2 px-2 py-2 2xl:px-3 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                  isActive ? colors.nav : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden xl:inline truncate">{label}</span>
              </Link>
            )
          })}
        </nav>
        <div className="flex items-center justify-end gap-2">
          <CommandPalette />
          <div className="w-px h-6 bg-slate-200" />
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="h-9 w-9 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 min-h-screen pb-20 md:pb-0">{children}</main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 z-40 pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-6 h-14">
          {TAB_CONFIG.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id
            const colors = ADMIN_TAB_COLORS[id]
            return (
              <Link
                key={id}
                href={`/admin/${id}`}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-colors ${
                  isActive ? colors.mobile : 'text-slate-500'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
