export interface User {
  id: string
  name?: string
  email: string
  role: 'admin' | 'client'
  status: 'active' | 'inactive' | 'pending'
  lastLogin?: string
  createdAt: string
  avatarUrl?: string
  locked?: boolean
}

export interface Course {
  id: string
  title: string
  description: string | null
  duration: string
  thumbnail: string | null
  instructor: string | null
  featured: boolean
  sort_order: number
  created_at: string
}

export interface Manual {
  id: string
  title: string
  category?: string
  tags: string[]
  filename: string
  storage_path: string
  size: string | null
  description: string | null
  created_at: string
  download_url?: string
}

export interface NewsArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  image_url: string | null
  featured: boolean
  published_at: string
  created_at: string
}

export interface Invite {
  id: string
  email: string
  token: string
  expires_at: string
  used: boolean
  created_at: string
  created_by?: string
}

export interface SoftwareItem {
  id: string
  title: string
  filename: string
  storage_path: string
  size: string | null
  description: string | null
  created_at: string
}

export const ADMIN_TABS = ['users', 'training', 'manuals', 'software', 'news', 'analytics'] as const
export type AdminTabId = (typeof ADMIN_TABS)[number]

export type AdminNavTabId = 'dashboard' | AdminTabId

/** Per-section accent colors for header nav and page dashboards */
export const ADMIN_TAB_COLORS: Record<AdminNavTabId, {
  nav: string
  mobile: string
  dashboard: { border: string; icon: string; pills: string }
}> = {
  dashboard: { nav: 'bg-indigo-100 text-indigo-700', mobile: 'text-indigo-600', dashboard: { border: 'border-l-indigo-500', icon: 'bg-indigo-50 text-indigo-600', pills: 'border-indigo-100 bg-indigo-50/40' } },
  users: { nav: 'bg-blue-100 text-blue-700', mobile: 'text-blue-600', dashboard: { border: 'border-l-blue-500', icon: 'bg-blue-50 text-blue-600', pills: 'border-blue-100 bg-blue-50/40' } },
  training: { nav: 'bg-emerald-100 text-emerald-700', mobile: 'text-emerald-600', dashboard: { border: 'border-l-emerald-500', icon: 'bg-emerald-50 text-emerald-600', pills: 'border-emerald-100 bg-emerald-50/40' } },
  manuals: { nav: 'bg-indigo-100 text-indigo-700', mobile: 'text-indigo-600', dashboard: { border: 'border-l-indigo-500', icon: 'bg-indigo-50 text-indigo-600', pills: 'border-indigo-100 bg-indigo-50/40' } },
  software: { nav: 'bg-violet-100 text-violet-700', mobile: 'text-violet-600', dashboard: { border: 'border-l-violet-500', icon: 'bg-violet-50 text-violet-600', pills: 'border-violet-100 bg-violet-50/40' } },
  news: { nav: 'bg-amber-100 text-amber-700', mobile: 'text-amber-600', dashboard: { border: 'border-l-amber-500', icon: 'bg-amber-50 text-amber-600', pills: 'border-amber-100 bg-amber-50/40' } },
  analytics: { nav: 'bg-cyan-100 text-cyan-700', mobile: 'text-cyan-600', dashboard: { border: 'border-l-cyan-500', icon: 'bg-cyan-50 text-cyan-600', pills: 'border-cyan-100 bg-cyan-50/40' } },
}

export function getStatusColor(status: string) {
  switch (status) {
    case 'active': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'pending': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'inactive': return 'bg-red-100 text-red-700 border-red-200'
    case 'published': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'draft': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'archived': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'in-review': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'quoted': return 'bg-purple-100 text-purple-700 border-purple-200'
    case 'approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'rejected': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
