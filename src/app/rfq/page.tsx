'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Logo } from '@/components/Logo'
import { 
  ArrowLeft, 
  FileText, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Send,
  Calendar,
  DollarSign,
  Package,
  User,
  Mail,
  Phone,
  Building,
  MapPin,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  Search,
  TrendingUp,
  Target,
  X
} from 'lucide-react'

interface RFQ {
  id: string
  title: string
  description: string
  status: 'Draft' | 'Submitted' | 'Under Review' | 'Approved' | 'Rejected'
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  createdAt: string
  dueDate: string
  estimatedValue: string
  category: string
  requester: string
  items: RFQItem[]
}

interface RFQItem {
  id: string
  product: string
  quantity: number
  specifications: string
  unitPrice?: number
  totalPrice?: number
}

export default function RFQPage() {
  const router = useRouter()
  const [showNewRFQModal, setShowNewRFQModal] = useState(false)

  const rfqs: RFQ[] = [
    {
      id: '1',
      title: 'OMNI-7000 System Upgrade',
      description: 'Request for upgrading existing OMNI-6000 system to OMNI-7000',
      status: 'Under Review',
      priority: 'High',
      createdAt: '2024-01-15',
      dueDate: '2024-02-15',
      estimatedValue: '$125,000',
      category: 'System Upgrade',
      requester: 'John Smith',
      items: [
        {
          id: '1',
          product: 'OMNI-7000 Control Unit',
          quantity: 1,
          specifications: 'Latest model with advanced features',
          unitPrice: 85000,
          totalPrice: 85000
        },
        {
          id: '2',
          product: 'Installation Service',
          quantity: 1,
          specifications: 'Professional installation and setup',
          unitPrice: 15000,
          totalPrice: 15000
        }
      ]
    },
    {
      id: '2',
      title: 'Maintenance Parts Order',
      description: 'Quarterly maintenance parts for OMNI-3000 systems',
      status: 'Draft',
      priority: 'Medium',
      createdAt: '2024-01-20',
      dueDate: '2024-02-20',
      estimatedValue: '$15,000',
      category: 'Maintenance',
      requester: 'Sarah Johnson',
      items: [
        {
          id: '1',
          product: 'Filter Set',
          quantity: 10,
          specifications: 'High-efficiency filters',
          unitPrice: 150,
          totalPrice: 1500
        }
      ]
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800'
      case 'Submitted': return 'bg-blue-100 text-blue-800'
      case 'Under Review': return 'bg-yellow-100 text-yellow-800'
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Low': return 'bg-green-100 text-green-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'High': return 'bg-orange-100 text-orange-800'
      case 'Urgent': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Request for Quote (RFQ)</h1>
                  <p className="text-sm text-slate-600">Submit and manage your quote requests</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Active
              </Badge>
              <Button
                onClick={() => setShowNewRFQModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                New RFQ
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
                Quote Management 💼
              </h1>
              <p className="text-slate-600 text-lg">
                Submit requests for quotes and track their progress
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Meeting
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">12</p>
                  <p className="text-sm text-slate-600">Total RFQs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">3</p>
                  <p className="text-sm text-slate-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">8</p>
                  <p className="text-sm text-slate-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">$2.1M</p>
                  <p className="text-sm text-slate-600">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Header with New RFQ Button */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">RFQ History</h2>
            <p className="text-slate-600">Manage your quote requests</p>
          </div>
          <Button
            onClick={() => setShowNewRFQModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            New RFQ
          </Button>
        </div>

        {/* RFQ History */}
        <div className="space-y-6">
          {rfqs.map((rfq) => (
            <Card key={rfq.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">{rfq.title}</h3>
                      <Badge 
                        variant={rfq.status === 'Approved' ? 'default' : rfq.status === 'Rejected' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {rfq.status}
                      </Badge>
                      <Badge 
                        variant={rfq.priority === 'Urgent' ? 'destructive' : rfq.priority === 'High' ? 'secondary' : 'outline'}
                        className="text-xs"
                      >
                        {rfq.priority}
                      </Badge>
                    </div>
                    <p className="text-slate-600 mb-3">{rfq.description}</p>
                    <div className="flex items-center gap-6 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created: {rfq.createdAt}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        Due: {rfq.dueDate}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {rfq.estimatedValue}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {rfq.requester}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New RFQ Modal */}
        {showNewRFQModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    New RFQ
                  </CardTitle>
                  <CardDescription>
                    Create a new Request for Quote
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNewRFQModal(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">RFQ Title</label>
                    <Input placeholder="Enter RFQ title" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
                    <Input placeholder="Select category" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                  <textarea 
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Describe your requirements..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                    <Input type="date" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Value</label>
                    <Input placeholder="$0.00" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
                    <select className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option>Low</option>
                      <option>Medium</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                      <Input placeholder="Your full name" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                      <Input type="email" placeholder="your.email@company.com" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                      <Input placeholder="+1 (555) 123-4567" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Company</label>
                      <Input placeholder="Your company name" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <Button variant="outline" onClick={() => setShowNewRFQModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="outline">
                    Save as Draft
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">
                    Submit RFQ
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
