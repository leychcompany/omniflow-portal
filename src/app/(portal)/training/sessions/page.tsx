import { redirect } from 'next/navigation'

/** Canonical session list lives at /training/schedule; this path is supported for links and redirects. */
export default function TrainingSessionsIndexPage() {
  redirect('/training/schedule')
}
