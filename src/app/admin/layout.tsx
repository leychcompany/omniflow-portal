'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Crown, ArrowLeft, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { recordAuthEvent } from '@/lib/record-analytics-event'
import { AdminTabNav, AdminMobileTabNav } from './_components/admin-tab-nav'
import { ADMIN_TABS } from './_components/admin-types'

const MAIN_SECTION_PATTERN = new RegExp(`^/admin/(${ADMIN_TABS.join('|')})$`)

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const isMainSection = pathname === '/admin' || MAIN_SECTION_PATTERN.test(pathname)

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

  const handleBack = () => {
    if (isMainSection) {
      router.push('/home')
    } else {
      const match = pathname.match(/^\/admin\/(users|training|manuals|software|news|analytics)/)
      router.push(match ? `/admin/${match[1]}` : '/admin/users')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={handleBack}
                className="flex items-center gap-2 px-3 hover:bg-slate-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-red-600 rounded-xl shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
                  <p className="text-sm text-slate-600">
                    {isMainSection ? 'Manage users, content, and system settings' : 'Admin'}
                  </p>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {pathname !== '/admin' && <AdminTabNav />}
        {children}
        {pathname !== '/admin' && <AdminMobileTabNav />}
      </main>
    </div>
  )
}
