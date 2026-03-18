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

/** Per-section accent colors - unified blue theme for header nav and page dashboards */
export const ADMIN_TAB_COLORS: Record<AdminNavTabId, {
  nav: string
  mobile: string
  dashboard: { border: string; icon: string; pills: string }
}> = {
  dashboard: { nav: 'bg-blue-100 text-blue-700', mobile: 'text-blue-600', dashboard: { border: 'border-l-blue-500', icon: 'bg-blue-50 text-blue-600', pills: 'border-blue-100 bg-blue-50/40' } },
  users: { nav: 'bg-blue-100 text-blue-700', mobile: 'text-blue-600', dashboard: { border: 'border-l-blue-500', icon: 'bg-blue-50 text-blue-600', pills: 'border-blue-100 bg-blue-50/40' } },
  training: { nav: 'bg-blue-100 text-blue-700', mobile: 'text-blue-600', dashboard: { border: 'border-l-blue-500', icon: 'bg-blue-50 text-blue-600', pills: 'border-blue-100 bg-blue-50/40' } },
  manuals: { nav: 'bg-blue-100 text-blue-700', mobile: 'text-blue-600', dashboard: { border: 'border-l-blue-500', icon: 'bg-blue-50 text-blue-600', pills: 'border-blue-100 bg-blue-50/40' } },
  software: { nav: 'bg-blue-100 text-blue-700', mobile: 'text-blue-600', dashboard: { border: 'border-l-blue-500', icon: 'bg-blue-50 text-blue-600', pills: 'border-blue-100 bg-blue-50/40' } },
  news: { nav: 'bg-blue-100 text-blue-700', mobile: 'text-blue-600', dashboard: { border: 'border-l-blue-500', icon: 'bg-blue-50 text-blue-600', pills: 'border-blue-100 bg-blue-50/40' } },
  analytics: { nav: 'bg-blue-100 text-blue-700', mobile: 'text-blue-600', dashboard: { border: 'border-l-blue-500', icon: 'bg-blue-50 text-blue-600', pills: 'border-blue-100 bg-blue-50/40' } },
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
