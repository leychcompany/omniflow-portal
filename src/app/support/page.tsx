'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Logo } from '@/components/Logo'
import {
  ArrowLeft, 
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
    description: '',
    email: '',
  })
  const [attachments, setAttachments] = useState<File[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
    if (!form.subject || !form.description || !form.email) {
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
      formData.append('description', form.description)
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
        description: '',
        email: '',
      })
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/home')}
                className="flex items-center gap-2 p-3"
              >
                <ArrowLeft className="h-4 w-4" />

              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Headphones className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Support Center</h1>
                  <p className="text-sm text-slate-600">Get help when you need it</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setActiveTab('new')}
                className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Ticket
              </Button>
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
                Support Center 🎧
              </h1>
              <p className="text-slate-600 text-lg">
                Get help from our expert support team
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button
                asChild
                className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transition-all"
              >
                <a href="tel:+12812406161">
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Phone Support</h3>
              <p className="text-sm text-slate-600 mb-2">+1 (281) 240-6161</p>
              <Button asChild variant="outline" size="sm">
                <a href="tel:+12812406161">Call Now</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all cursor-pointer">
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Knowledge Base</h3>
              <p className="text-sm text-slate-600 mb-4">Self-help resources</p>
              <Button asChild variant="outline" size="sm">
                <a href="/manuals">Browse Manuals</a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Headphones className="h-5 w-5 text-red-600" />
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
                    <label className="text-sm font-medium text-slate-700">Subject</label>
                    <Input
                      name="subject"
                      value={form.subject}
                      onChange={handleChange}
                      required
                      placeholder="Brief description of your issue"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
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
                    <label className="text-sm font-medium text-slate-700">Category</label>
                    <select
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option>Technical</option>
                      <option>Billing</option>
                      <option>General</option>
                      <option>Feature Request</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Priority</label>
                    <select
                      name="priority"
                      value={form.priority}
                      onChange={handleChange}
                      className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Critical</option>
                    </select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Description</label>
                  <textarea 
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    rows={6}
                    placeholder="Please provide detailed information about your issue..."
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">Attachments</label>
                    <span className="text-xs text-slate-500">Up to {MAX_FILES} files, {Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB each</span>
                  </div>
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileText className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Click to choose files</p>
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
                        <div key={file.name} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                          <span className="text-sm text-slate-700 truncate">{file.name}</span>
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
                  <p className="text-sm text-red-600">{error}</p>
                )}
                {status === 'success' && (
                  <p className="text-sm text-green-600">Ticket submitted. Our team will contact you soon.</p>
                )}
                
                <div className="flex items-center space-x-4 pt-2">
                  <Button
                    type="submit"
                    className="bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
                    disabled={status === 'submitting'}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {status === 'submitting' ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/home')}
                  >
                    Back to Home
                  </Button>
                </div>
              </form>
            </CardContent>
        </Card>
      </div>
    </div>
  )
}