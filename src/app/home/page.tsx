'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { useAuthStore } from '@/store/auth-store'
import { supabase } from '@/lib/supabase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { manuals } from '../manuals/manuals-data'
import { 
  Bot, 
  GraduationCap, 
  FileText, 
  Headphones, 
  BookOpen, 
  LogOut,
  TrendingUp,
  CheckCircle,
  Menu,
  X,
  ArrowRight,
  Users,
  Shield,
  Zap,
  Download,
  Calendar,
  MessageSquare,
  Activity,
  BarChart3,
  Newspaper,
  Settings,
  Crown,
  User,
  ChevronDown
} from 'lucide-react'

const dashboardStats = [
  { 
    label: 'Manuals', 
    value: manuals.length.toString(), 
    color: 'text-green-600', 
    bgColor: 'bg-green-50', 
    borderColor: 'border-green-200',
    icon: FileText,
    href: '/manuals'
  },
  { 
    label: 'Training Classes', 
    value: '4', 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-50', 
    borderColor: 'border-purple-200',
    icon: GraduationCap,
    href: '/training'
  },
]

const menuItems = [
  {
    id: 'ai-assistant',
    title: 'AI Assistant',
    subtitle: 'Get instant help with technical questions',
    icon: Bot,
    gradient: 'from-blue-500 via-blue-600 to-indigo-600',
    href: '/ai-assistant',
    badge: null,
    badgeColor: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'training',
    title: 'Training Programs',
    subtitle: 'Access courses and certifications',
    icon: GraduationCap,
    gradient: 'from-purple-500 via-purple-600 to-violet-600',
    href: '/training',
    badge: null,
    badgeColor: ''
  },
  {
    id: 'submit-rfq',
    title: 'Submit RFQ',
    subtitle: 'Request quotes and proposals',
    icon: FileText,
    gradient: 'from-green-500 via-green-600 to-emerald-600',
    href: 'https://form.typeform.com/to/daiU0VJA',
    badge: null,
    badgeColor: ''
  },
  {
    id: 'support',
    title: 'Support Center',
    subtitle: 'Get technical assistance',
    icon: Headphones,
    gradient: 'from-red-500 via-red-600 to-rose-600',
    href: '/support',
    badge: null,
    badgeColor: 'bg-red-100 text-red-800'
  },
  {
    id: 'view-manuals',
    title: 'Manuals',
    subtitle: 'Download manuals and guides',
    icon: BookOpen,
    gradient: 'from-orange-500 via-orange-600 to-amber-600',
    href: '/manuals',
    badge: null,
    badgeColor: ''
  },
  {
    id: 'news',
    title: 'News',
    subtitle: 'Latest company updates and announcements',
    icon: Newspaper,
    gradient: 'from-indigo-500 via-indigo-600 to-purple-600',
    href: '/news',
    badge: null,
    badgeColor: ''
  },
]


export default function HomePage() {
  const router = useRouter()
  const { user, signOut } = useAuthStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const hashHandledRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || hashHandledRef.current) {
      return
    }

    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')

    if (accessToken && refreshToken) {
      hashHandledRef.current = true

      const type = hashParams.get('type') || 'invite'
      const email = hashParams.get('email')

      const targetParams = new URLSearchParams({
        access_token: accessToken,
        refresh_token: refreshToken,
        type,
      })

      if (email) {
        targetParams.set('email', email)
      }

      const targetUrl = `/set-password?${targetParams.toString()}`

      supabase.auth
        .signOut({ scope: 'local' })
        .catch((signOutError) => {
          console.warn('Error signing out before redirect:', signOutError)
        })
        .finally(() => {
          window.location.replace(targetUrl)
        })
    }
  }, [])

  const handleSignOut = async () => {
    try {
      // Sign out from Supabase first
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Then clear local state
      signOut()
      
      // Redirect to login with full page reload to ensure session is cleared
      window.location.href = '/login'
    } catch (error) {
      console.error('Error signing out:', error)
      // Even if Supabase fails, clear local state and redirect
      signOut()
      window.location.href = '/login'
    }
  }

  const handleMenuClick = (href: string) => {
    if (href.startsWith('http')) {
      window.open(href, '_blank', 'noopener,noreferrer')
      return
    }
    router.push(href)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
            
              <Logo width={140} height={49} />
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <Avatar className="h-10 w-10 border-2 border-slate-200">
                    <AvatarImage src={undefined} alt={user?.email || 'User'} />
                    <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-slate-900">
                      {user?.name || user?.email?.split('@')[0] || 'User'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {user?.email || ''}
                    </div>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {profileDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setProfileDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-slate-200">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-12 w-12 border-2 border-slate-200">
                            <AvatarImage src={undefined} alt={user?.email || 'User'} />
                            <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold">
                              {user?.email?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-slate-900 truncate">
                              {user?.name || user?.email?.split('@')[0] || 'User'}
                            </div>
                            <div className="text-xs text-slate-500 truncate">
                              {user?.email}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="py-1">
                        {user?.role === 'admin' && (
                          <button
                            onClick={() => {
                              setProfileDropdownOpen(false)
                              router.push('/admin')
                            }}
                            className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            <Crown className="h-4 w-4 text-purple-600" />
                            <span>Admin Panel</span>
                          </button>
                        )}
                        {/* <button
                          onClick={() => {
                            setProfileDropdownOpen(false)
                            // TODO: Add settings page
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Settings className="h-4 w-4 text-slate-600" />
                          <span>Settings</span>
                        </button>
                        <div className="border-t border-slate-200 my-1" /> */}
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false)
                            handleSignOut()
                          }}
                          className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Welcome back! 👋
              </h1>
              <p className="text-slate-600 text-lg">
                Here&apos;s what&apos;s happening with your account today.
              </p>
            </div>
        
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardStats.map((stat, index) => {
            const Icon = stat.icon
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-200 border-0 shadow-sm cursor-pointer"
                onClick={() => router.push(stat.href)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.borderColor} border`}>
                        <Icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                        <p className="text-sm text-slate-600">{stat.label}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Quick Actions */}
        <div>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-2">Quick Actions</h2>
              <p className="text-slate-600">Access your most used features</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Card 
                    key={item.id} 
                    className="cursor-pointer hover:shadow-xl transition-all duration-300 group border-0 shadow-sm hover:scale-[1.02]"
                    onClick={() => handleMenuClick(item.href)}
                  >
                    <CardContent className="p-0">
                      <div className={`relative w-full h-40 bg-gradient-to-br ${item.gradient} rounded-lg p-6 text-white overflow-hidden`}>
                        {/* Background Pattern */}
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                        
                        <div className="relative z-10 flex flex-col justify-between h-full">
                          <div className="flex items-center justify-between">
                            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                              <Icon className="h-6 w-6" />
                            </div>
                            {item.badge && (
                              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                                {item.badge}
                              </Badge>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                            <p className="text-sm opacity-90">{item.subtitle}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
      </div>
    </div>
  )
}
