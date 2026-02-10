'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Logo } from '@/components/Logo'
import Image from 'next/image'
import { 
  ArrowLeft, 
  GraduationCap, 
  Play, 
  CheckCircle, 
  BookOpen, 
  Calendar,
  Video,
  FileText,
  Zap,
  TrendingUp
} from 'lucide-react'
import { courses, featuredCourse } from './courses-data'

export default function TrainingPage() {
  const router = useRouter()


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
                <div className="p-2 bg-purple-100 rounded-lg">
                  <GraduationCap className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Training Programs</h1>
                  <p className="text-sm text-slate-600">Enhance your skills and knowledge</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                <TrendingUp className="h-3 w-3 mr-1" />
                Live Learning
              </Badge>
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
                Training Center 🎓
              </h1>
              <p className="text-slate-600 text-lg">
                Access comprehensive training programs and earn certifications
              </p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Training
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
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{courses.length}</p>
                  <p className="text-sm text-slate-600">Available Courses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            {/* Featured Course */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge className="bg-purple-100 text-purple-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                      {featuredCourse.title}
                    </h2>
                    <p className="text-slate-600 mb-4">
                      {featuredCourse.description}
                    </p>
                    <div className="mb-6" />
                    <div className="flex items-center space-x-4">
                      <Button
                        asChild
                        className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200"
                      >
                        <Link href={`/training/request?course=${featuredCourse.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          Request Training
                        </Link>
                      </Button>
                    </div>
                  </div>
                  <div className="mt-6 lg:mt-0 lg:ml-8">
                    <div className="w-64 h-40 rounded-lg overflow-hidden bg-slate-100">
                      {featuredCourse.thumbnail ? (
                        <Image
                          src="/images/tr7000-featured.png"
                          alt={featuredCourse.title}
                          width={640}
                          height={360}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-200 to-blue-200">
                          <Video className="h-16 w-16 text-purple-600" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter((course) => course.id !== featuredCourse.id).map((course) => (
                <Card key={course.id} className="border-0 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative">
                      {course.thumbnail ? (
                        <div className="w-full h-48 overflow-hidden rounded-t-lg bg-slate-100">
                          <Image
                            src={course.thumbnail}
                            alt={course.title}
                            width={640}
                            height={360}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg flex items-center justify-center">
                          <Video className="h-12 w-12 text-slate-400" />
                        </div>
                      )}
                      <div className="absolute top-4 right-4">
                      </div>
                      {course.completed && (
                        <div className="absolute top-4 left-4">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <CheckCircle className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-slate-900 group-hover:text-purple-600 transition-colors">
                          {course.title}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="mb-4" />
                      {course.progress > 0 && !course.completed && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-slate-600">Progress</span>
                            <span className="text-slate-900 font-medium">{course.progress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <Button 
                        asChild
                        className="w-full"
                        variant={course.completed ? "outline" : "default"}
                      >
                        <Link href={`/training/request?course=${course.id}`}>
                          <Play className="h-4 w-4 mr-2" />
                          Request Training
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
      </div>
    </div>
  )
}