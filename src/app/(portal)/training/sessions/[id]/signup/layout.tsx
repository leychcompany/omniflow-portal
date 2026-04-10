import { Suspense } from 'react'
import type { Metadata } from 'next'
import { TrainingSkeleton } from '@/components/portal/skeletons'

export const metadata: Metadata = {
  title: 'Class signup — Training',
}

export default function TrainingSessionSignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Suspense fallback={<TrainingSkeleton />}>{children}</Suspense>
}
