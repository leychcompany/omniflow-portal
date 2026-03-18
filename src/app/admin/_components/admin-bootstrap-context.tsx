'use client'

import { createContext, useContext, useState, type ReactNode } from 'react'

export interface DashboardData {
  counts: {
    users: number
    admins: number
    manuals: number
    courses: number
    news: number
    software: number
    invites: number
  }
  activityByDay: { date: string; label: string; logins: number; downloads: number }[]
  recentActivity: {
    id: string
    event_type: string
    user_email: string | null
    user_name: string | null
    resource_label: string | null
    created_at: string
  }[]
  totals7d: { logins: number; downloads: number }
  topTags: { name: string; count: number }[]
}

interface AdminBootstrapContextValue {
  dashboard: DashboardData | null
  setDashboard: (d: DashboardData | null) => void
}

const AdminBootstrapContext = createContext<AdminBootstrapContextValue | null>(null)

export function AdminBootstrapProvider({ children }: { children: ReactNode }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  return (
    <AdminBootstrapContext.Provider value={{ dashboard, setDashboard }}>
      {children}
    </AdminBootstrapContext.Provider>
  )
}

export function useAdminBootstrap() {
  const ctx = useContext(AdminBootstrapContext)
  return ctx
}
