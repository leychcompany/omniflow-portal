'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  trainingEnrollmentBodySchema,
  type TrainingEnrollmentBody,
} from '@/lib/training-enrollment'
import { TRAINING_SIGNUP_DISCLAIMER_PARAGRAPHS } from '@/lib/training-signup-disclaimers'
import { Loader2 } from 'lucide-react'

export interface ProfilePrefill {
  email: string
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  title?: string | null
  phone?: string | null
}

type FormState = Record<keyof TrainingEnrollmentBody, string>

function emptyForm(): FormState {
  return {
    certificate_company_name: '',
    work_title: '',
    first_name: '',
    last_name: '',
    company_address: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: '',
    contact_email: '',
    contact_phone: '',
    food_restrictions: '',
  }
}

function formFromProfile(p: ProfilePrefill | null): FormState {
  const base = emptyForm()
  if (!p) return base
  return {
    ...base,
    certificate_company_name: p.company?.trim() ?? '',
    work_title: p.title?.trim() ?? '',
    first_name: p.first_name?.trim() ?? '',
    last_name: p.last_name?.trim() ?? '',
    contact_email: p.email?.trim() ?? '',
    contact_phone: p.phone?.trim() ?? '',
  }
}

const fieldClass = cn(
  'flex min-h-[2.75rem] w-full rounded-lg border border-gray-300 dark:border-white/[0.12] bg-white dark:bg-white/[0.04] px-4 py-2 text-sm text-gray-900 dark:text-zinc-100 transition-all duration-200 placeholder:text-gray-500 dark:placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary-400 dark:hover:border-white/[0.2] focus:border-primary-500'
)

interface TrainingEnrollmentFormProps {
  profile: ProfilePrefill | null
  variant: 'register' | 'waitlist'
  submitting: boolean
  onSubmit: (body: TrainingEnrollmentBody) => Promise<void>
  /** Shown as secondary action (e.g. back to class details) */
  cancelHref: string
}

export function TrainingEnrollmentForm({
  profile,
  variant,
  submitting,
  onSubmit,
  cancelHref,
}: TrainingEnrollmentFormProps) {
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(formFromProfile(profile))
    setError(null)
  }, [profile])

  const setField = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const payload = {
      ...form,
      food_restrictions: form.food_restrictions,
    }
    const parsed = trainingEnrollmentBodySchema.safeParse(payload)
    if (!parsed.success) {
      const first = parsed.error.flatten().fieldErrors
      const msg =
        (Object.values(first).flat()[0] as string | undefined) ||
        parsed.error.issues[0]?.message ||
        'Please check the form.'
      setError(msg)
      return
    }
    try {
      await onSubmit(parsed.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    }
  }

  const title = variant === 'waitlist' ? 'Join the waitlist' : 'Sign up for this class'
  const description =
    variant === 'waitlist'
      ? 'We need these details for your enrollment and certificate. Required fields are marked.'
      : 'Please confirm your details for the roster and certificate. Required fields are marked.'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900 dark:text-zinc-100">{title}</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-zinc-400">{description}</p>
      </div>
      <div
        className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-3 text-xs text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100/95 space-y-2"
        role="note"
      >
        <p className="font-semibold text-amber-900 dark:text-amber-50">Please read</p>
        <ul className="list-disc pl-4 space-y-2 leading-relaxed">
          {TRAINING_SIGNUP_DISCLAIMER_PARAGRAPHS.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ul>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2 flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              Company name (as on certificate) <span className="text-red-500">*</span>
            </span>
            <Input
              value={form.certificate_company_name}
              onChange={(e) => setField('certificate_company_name', e.target.value)}
              autoComplete="organization"
              required
            />
          </label>
          <label className="sm:col-span-2 flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              Work title <span className="text-red-500">*</span>
            </span>
            <Input
              value={form.work_title}
              onChange={(e) => setField('work_title', e.target.value)}
              autoComplete="organization-title"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              First name <span className="text-red-500">*</span>
            </span>
            <Input
              value={form.first_name}
              onChange={(e) => setField('first_name', e.target.value)}
              autoComplete="given-name"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              Last name <span className="text-red-500">*</span>
            </span>
            <Input
              value={form.last_name}
              onChange={(e) => setField('last_name', e.target.value)}
              autoComplete="family-name"
              required
            />
          </label>
          <label className="sm:col-span-2 flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              Company address <span className="text-red-500">*</span>
            </span>
            <Input
              value={form.company_address}
              onChange={(e) => setField('company_address', e.target.value)}
              autoComplete="street-address"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              City <span className="text-red-500">*</span>
            </span>
            <Input
              value={form.city}
              onChange={(e) => setField('city', e.target.value)}
              autoComplete="address-level2"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              State / Province <span className="text-red-500">*</span>
            </span>
            <Input
              value={form.state_province}
              onChange={(e) => setField('state_province', e.target.value)}
              autoComplete="address-level1"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              Postal code <span className="text-red-500">*</span>
            </span>
            <Input
              value={form.postal_code}
              onChange={(e) => setField('postal_code', e.target.value)}
              autoComplete="postal-code"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              Country <span className="text-red-500">*</span>
            </span>
            <Input
              value={form.country}
              onChange={(e) => setField('country', e.target.value)}
              autoComplete="country-name"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              E-mail <span className="text-red-500">*</span>
            </span>
            <Input
              type="email"
              value={form.contact_email}
              onChange={(e) => setField('contact_email', e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">
              Phone <span className="text-red-500">*</span>
            </span>
            <Input
              type="tel"
              value={form.contact_phone}
              onChange={(e) => setField('contact_phone', e.target.value)}
              autoComplete="tel"
              required
            />
          </label>
          <label className="sm:col-span-2 flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-800 dark:text-zinc-200">Food restrictions / allergies</span>
            <textarea
              className={fieldClass}
              rows={3}
              value={form.food_restrictions}
              onChange={(e) => setField('food_restrictions', e.target.value)}
              placeholder="None, or describe restrictions"
            />
          </label>
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          {submitting ? (
            <Button type="button" variant="outline" disabled>
              Cancel
            </Button>
          ) : (
            <Button type="button" variant="outline" asChild>
              <Link href={cancelHref}>Cancel</Link>
            </Button>
          )}
          <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700">
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting…
              </>
            ) : variant === 'waitlist' ? (
              'Join waitlist'
            ) : (
              'Confirm signup'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
