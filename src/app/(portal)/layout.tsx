'use client'

import { PortalLayout } from '@/components/portal/portal-layout'

/**
 * Portal layout. Auth is enforced by proxy (server-side redirect).
 * No loading state - proxy already validated session before we render.
 */
export default function PortalLayoutWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <PortalLayout>{children}</PortalLayout>
}
