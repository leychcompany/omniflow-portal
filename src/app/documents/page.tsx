'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  FileText, 
  Download,
  BookOpen,
  File,
  Loader2
} from 'lucide-react'

interface Manual {
  id: string
  title: string
  category: string
  filename: string
  path?: string
  download_url?: string
  size: string
  description: string
}

export default function DocumentsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Manual[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSeries, setSelectedSeries] = useState<'all' | 'OMNI-3000-6000' | 'OMNI-4000-7000'>('all')

  useEffect(() => {
    fetch('/api/manuals')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load documents')
        return res.json()
      })
      .then((data) => setDocuments(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const seriesOptions = [
    { id: 'all', label: 'All', value: 'all' },
    { id: '3000-6000', label: '3000/6000', value: 'OMNI-3000-6000' },
    { id: '4000-7000', label: '4000/7000', value: 'OMNI-4000-7000' }
  ] as const

  const filteredDocuments = documents.filter((doc) =>
    selectedSeries === 'all' ? true : doc.category === selectedSeries
  )

  const handleDownload = (doc: Manual) => {
    const url = doc.download_url ?? doc.path
    if (!url) return
    const link = document.createElement('a')
    link.href = url
    link.download = doc.filename
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    link.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-orange-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/home')}
                className="flex items-center gap-2 px-3"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Documents</h1>
                  <p className="text-sm text-slate-600">Technical documentation and guides</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Documents List */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Available Documents</h2>
            <p className="text-slate-600">Download technical documentation and guides</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {seriesOptions.map((option) => (
              <Button
                key={option.id}
                variant={selectedSeries === option.value ? 'default' : 'outline'}
                onClick={() => setSelectedSeries(option.value)}
                className={selectedSeries === option.value ? 'bg-orange-600 text-white hover:bg-orange-700' : ''}
              >
                {option.label}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id} className="border-0 shadow-sm hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{doc.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {doc.category}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-3">{doc.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {doc.size}
                        </div>
                        <div className="flex items-center gap-1">
                          <File className="h-4 w-4" />
                          PDF Document
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        className="transition-all duration-200"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredDocuments.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              No documents found for this series.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
