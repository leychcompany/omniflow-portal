'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RichTextEditor } from '@/components/admin/rich-text-editor'
import { stripHtml } from '@/lib/strip-html'
import {
  Headphones, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send,
  Calendar,
  MessageSquare,
  Phone,
  Mail,
  Video,
  FileText,
  User,
  Search,
  Filter,
  Star,
  ThumbsUp,
  ThumbsDown,
  Download,
  Edit,
  Trash2,
  Eye,
  Zap,
  Shield,
  LifeBuoy,
  TrendingUp,
  Target,
  Bell,
  DollarSign
} from 'lucide-react'

type Status = 'idle' | 'submitting' | 'success' | 'error'

interface SupportTicket {
  id: string
  title: string
  description: string
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  category: 'Technical' | 'Billing' | 'General' | 'Feature Request'
  createdAt: string
  updatedAt: string
  assignedTo?: string
  requester: string
  attachments?: string[]
  messages: TicketMessage[]
}

interface TicketMessage {
  id: string
  content: string
  sender: string
  isFromSupport: boolean
  timestamp: string
  attachments?: string[]
}

export default function SupportPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'new'>('new')
  const [form, setForm] = useState({
    subject: '',
    category: 'Technical',
    priority: 'Medium',
    email: '',
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [descriptionHtml, setDescriptionHtml] = useState('<p></p>')
  const [editorKey, setEditorKey] = useState(0)

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const ticketFormRef = useRef<HTMLDivElement | null>(null)

  const MAX_FILES = 3
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const incoming = Array.from(files)
    const allowed = incoming.filter(file => file.size <= MAX_FILE_SIZE)
    const next = [...attachments, ...allowed].slice(0, MAX_FILES)

    if (allowed.length !== incoming.length) {
      setError(`Some files exceeded the ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB limit and were skipped.`)
    } else {
      setError(null)
    }

    if (attachments.length + allowed.length > MAX_FILES) {
      setError(`Only ${MAX_FILES} attachments allowed.`)
    }

    setAttachments(next)
  }

  const removeAttachment = (name: string) => {
    setAttachments(prev => prev.filter(file => file.name !== name))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const descriptionText = stripHtml(descriptionHtml)
    if (!form.subject || !descriptionText || !form.email) {
      setError('Subject, email, and description are required.')
      return
    }

    setStatus('submitting')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('subject', form.subject)
      formData.append('category', form.category)
      formData.append('priority', form.priority)
      formData.append('description', descriptionHtml)
      formData.append('email', form.email)

      attachments.forEach(file => {
        formData.append('attachments', file)
      })

      const res = await fetch('/api/support', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit ticket')
      }

      setStatus('success')
      setForm({
        subject: '',
        category: 'Technical',
        priority: 'Medium',
        email: '',
      })
      setDescriptionHtml('<p></p>')
      setEditorKey(prev => prev + 1)
      setAttachments([])
      // Redirect back to main support page after successful submission
      router.push('/support')
    } catch (err: any) {
      setStatus('error')
      setError(err.message || 'Failed to submit ticket')
    } finally {
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  const tickets: SupportTicket[] = [
    {
      id: '1',
      title: 'OMNI-7000 System Error',
      description: 'System showing error code E-1234 during startup',
      status: 'In Progress',
      priority: 'High',
      category: 'Technical',
      createdAt: '2024-01-15',
      updatedAt: '2024-01-16',
      assignedTo: 'John Smith',
      requester: 'Mike Davis',
      attachments: ['error-log.txt', 'screenshot.png'],
      messages: [
        {
          id: '1',
          content: 'System showing error code E-1234 during startup. Please help!',
          sender: 'Mike Davis',
          isFromSupport: false,
          timestamp: '2024-01-15 10:30'
        },
        {
          id: '2',
          content: 'Thank you for contacting support. I\'ve received your ticket and will investigate this issue. Can you please provide the system logs?',
          sender: 'John Smith',
          isFromSupport: true,
          timestamp: '2024-01-15 11:15'
        }
      ]
    },
    {
      id: '2',
      title: 'Billing Question',
      description: 'Question about monthly subscription charges',
      status: 'Resolved',
      priority: 'Low',
      category: 'Billing',
      createdAt: '2024-01-10',
      updatedAt: '2024-01-12',
      assignedTo: 'Sarah Johnson',
      requester: 'Lisa Wilson',
      messages: [
        {
          id: '1',
          content: 'I have a question about my monthly subscription charges.',
          sender: 'Lisa Wilson',
          isFromSupport: false,
          timestamp: '2024-01-10 14:20'
        },
        {
          id: '2',
          content: 'I\'ve reviewed your account and explained the charges. Is there anything else I can help you with?',
          sender: 'Sarah Johnson',
          isFromSupport: true,
          timestamp: '2024-01-12 09:45'
        }
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Open': return 'bg-blue-100 text-blue-800'
      case 'In Progress': return 'bg-yellow-100 text-yellow-800'
      case 'Resolved': return 'bg-green-100 text-green-800'
      case 'Closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Technical': return <Zap className="h-4 w-4" />
      case 'Billing': return <DollarSign className="h-4 w-4" />
      case 'General': return <MessageSquare className="h-4 w-4" />
      case 'Feature Request': return <Target className="h-4 w-4" />
      default: return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <div className="max-w-7xl mx-auto w-full py-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-100 mb-2">
                Support Center 🎧
              </h1>
              <p className="text-slate-600 dark:text-zinc-400 text-lg">
                Get help from our expert support team
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
              >
                <a href="tel:+12812406161">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support
                </a>
              </Button>
              <Button
                onClick={() => ticketFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-6 text-center flex flex-col h-full">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 shrink-0">
                <Phone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-2">Phone Support</h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mb-2">+1 (281) 240-6161</p>
              <Button asChild variant="outline" size="sm" className="mt-auto">
                <a href="tel:+12812406161">Call Now</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-6 text-center flex flex-col h-full">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 shrink-0">
                <FileText className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-zinc-100 mb-2">Documents</h3>
              <p className="text-sm text-slate-600 dark:text-zinc-400 mb-4">Self-help resources</p>
              <Button asChild variant="outline" size="sm" className="mt-auto">
                <Link href="/documents">Browse</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Card ref={ticketFormRef} className="border-0 shadow-sm scroll-mt-24 md:scroll-mt-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-900 dark:text-zinc-100">
              <Headphones className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span>Create Support Ticket</span>
            </CardTitle>
            <CardDescription>
              Describe your issue and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>
            <CardContent>
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Subject</label>
                    <Input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Email</label>
                    <Input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="you@company.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-200 dark:border-white/[0.12] rounded-lg bg-white dark:bg-white/[0.04] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option>Technical</option>
                      <option>Billing</option>
                      <option>General</option>
                      <option>Feature Request</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Priority</label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-200 dark:border-white/[0.12] rounded-lg bg-white dark:bg-white/[0.04] text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Description</label>
                  <RichTextEditor
                    key={editorKey}
                    initialContent={descriptionHtml}
                    onChange={setDescriptionHtml}
                    aria-label="Support ticket description"
                    placeholder="Please provide detailed information about your issue..."
                    minHeight="180px"
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700 dark:text-zinc-300">Attachments</label>
                    <span className="text-xs text-slate-500 dark:text-zinc-500">Up to {MAX_FILES} files, {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB each</span>
                  </div>
                  <div
                    className="border-2 border-dashed border-slate-200 dark:border-white/[0.12] rounded-lg p-6 text-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-8 w-8 text-slate-400 dark:text-zinc-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-600 dark:text-zinc-400">Click to choose files</p>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />
                    <Button type="button" variant="outline" className="mt-2" onClick={() => fileInputRef.current?.click()}>
                      Choose Files
                    </Button>
                  </div>
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map(file => (
                        <div key={file.name} className="flex items-center justify-between rounded-md border border-slate-200 dark:border-white/[0.08] px-3 py-2">
                          <span className="text-sm text-slate-700 dark:text-zinc-300 truncate">{file.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(file.name)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {error && (
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                )}
                {status === 'success' && (
                  <p className="text-sm text-green-600 dark:text-green-400">Ticket submitted. Our team will contact you soon.</p>
                )}
                
                <div className="flex items-center space-x-4 pt-2">
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200"
                    disabled={status === 'submitting'}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {status === 'submitting' ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                  <Button
                    variant="outline"
                    asChild
                  >
                    <Link href="/home" prefetch>Back to Home</Link>
                  </Button>
                </div>
              </form>
            </CardContent>
        </Card>
    </div>
  )
}