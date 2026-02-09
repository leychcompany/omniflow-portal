'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Logo } from '@/components/Logo'
import { manuals } from './manuals-data'
import { 
  ArrowLeft, 
  FileText, 
  Download,
  BookOpen,
  Calendar,
  File
} from 'lucide-react'

export default function ManualsPage() {
  const router = useRouter()
  const [selectedSeries, setSelectedSeries] = useState<'all' | 'OMNI-3000-6000' | 'OMNI-4000-7000'>('all')

  const seriesOptions = [
    { id: 'all', label: 'All', value: 'all' },
    { id: '3000-6000', label: '3000/6000', value: 'OMNI-3000-6000' },
    { id: '4000-7000', label: '4000/7000', value: 'OMNI-4000-7000' }
  ] as const

  const filteredManuals = manuals.filter(manual =>
    selectedSeries === 'all' ? true : manual.category === selectedSeries
  )

  const handleDownload = (manual: (typeof manuals)[number]) => {
    const link = document.createElement('a')
    link.href = manual.path
    link.download = manual.filename
    link.click()
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
                  <h1 className="text-xl font-semibold text-slate-900">Manuals</h1>
                  <p className="text-sm text-slate-600">Technical documentation and guides</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{manuals.length}</p>
                  <p className="text-sm text-slate-600">Total Manuals</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <File className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">2</p>
                  <p className="text-sm text-slate-600">Product Series</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 rounded-xl">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">2024</p>
                  <p className="text-sm text-slate-600">Latest Update</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Manuals List */}
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Available Manuals</h2>
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
            {filteredManuals.map((manual) => (
              <Card key={manual.id} className="border-0 shadow-sm hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-slate-900">{manual.title}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {manual.category}
                        </Badge>
                      </div>
                      <p className="text-slate-600 mb-3">{manual.description}</p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {manual.size}
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
                        onClick={() => handleDownload(manual)}
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

          {filteredManuals.length === 0 && (
            <div className="text-center py-10 text-slate-600">
              No manuals found for this series.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}