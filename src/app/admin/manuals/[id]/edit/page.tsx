'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { EditManualForm } from '@/components/admin/edit-manual-form'

export default function EditManualPage() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''

  useEffect(() => {
    if (!id) router.replace('/admin/manuals')
  }, [id, router])

  if (!id) {
    return null
  }

  const back = () => router.push('/admin/manuals')

  return (
    <EditManualForm
      manualId={id}
      onCancel={back}
      onSuccess={back}
    />
  )
}
