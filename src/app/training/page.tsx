'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Logo } from '@/components/Logo'
import { 
  ArrowLeft, 
  GraduationCap, 
  Play, 
  Clock, 
  CheckCircle, 
  Award, 
  BookOpen, 
  Download,
  Star,
  Users,
  Calendar,
  Video,
  FileText,
  Trophy,
  Zap,
  Target,
  TrendingUp,
  Bookmark
} from 'lucide-react'

interface Course {
  id: string
  title: string
  description: string
  duration: string
  level: 'Beginner' | 'Intermediate' | 'Advanced'
  progress: number
  completed: boolean
  thumbnail: string
  instructor: string
  rating: number
  students: number
}

interface Certification {
  id: string
  name: string
  description: string
  requirements: string[]
  validity: string
  badge: string
}

export default function TrainingPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'courses' | 'certifications'>('courses')

  const courses: Course[] = [
    {
      id: '1',
      title: 'OMNI-3000 Basic Operations',
      description: 'Learn the fundamentals of operating the OMNI-3000 system with hands-on training.',
      duration: '4 hours',
      level: 'Beginner',
      progress: 0,
      completed: false,
      thumbnail: '/course-1.jpg',
      instructor: 'John Smith',
      rating: 4.7,
      students: 892
    },
    {
      id: '2',
      title: 'OMNI-6000 Intermediate Training',
      description: 'Advanced techniques for OMNI-6000 system maintenance and troubleshooting.',
      duration: '6 hours',
      level: 'Intermediate',
      progress: 65,
      completed: false,
      thumbnail: '/course-2.jpg',
      instructor: 'Sarah Johnson',
      rating: 4.9,
      students: 456
    },
    {
      id: '3',
      title: 'OMNI-7000 Advanced Operations',
      description: 'Master advanced techniques for operating and maintaining the OMNI-7000 system.',
      duration: '8 hours',
      level: 'Advanced',
      progress: 0,
      completed: false,
      thumbnail: '/course-3.jpg',
      instructor: 'Mike Davis',
      rating: 4.8,
      students: 234
    },
    {
      id: '4',
      title: 'Safety Protocols and Procedures',
      description: 'Essential safety training for all OMNI system operators.',
      duration: '2 hours',
      level: 'Beginner',
      progress: 100,
      completed: true,
      thumbnail: '/course-4.jpg',
      instructor: 'Lisa Wilson',
      rating: 4.6,
      students: 1200
    },
    {
      id: '5',
      title: 'Preventive Maintenance',
      description: 'Learn how to perform routine maintenance to keep your systems running smoothly.',
      duration: '5 hours',
      level: 'Intermediate',
      progress: 0,
      completed: false,
      thumbnail: '/course-5.jpg',
      instructor: 'Robert Brown',
      rating: 4.5,
      students: 678
    },
    {
      id: '6',
      title: 'Troubleshooting Guide',
      description: 'Comprehensive guide to diagnosing and fixing common system issues.',
      duration: '3 hours',
      level: 'Intermediate',
      progress: 0,
      completed: false,
      thumbnail: '/course-6.jpg',
      instructor: 'Jennifer Lee',
      rating: 4.7,
      students: 345
    }
  ]

  const certifications: Certification[] = [
    {
      id: '1',
      name: 'OMNI System Operator',
      description: 'Certified operator for all OMNI systems',
      requirements: [
        'Complete OMNI-3000 Basic Operations',
        'Pass safety protocols exam',
        'Complete 20 hours of hands-on training'
      ],
      validity: '2 years',
      badge: '/cert-1.png'
    },
    {
      id: '2',
      name: 'Advanced System Technician',
      description: 'Advanced certification for system maintenance',
      requirements: [
        'Complete all intermediate courses',
        'Pass advanced operations exam',
        'Complete 50 hours of hands-on training'
      ],
      validity: '3 years',
      badge: '/cert-2.png'
    },
    {
      id: '3',
      name: 'Master Technician',
      description: 'Highest level certification for system experts',
      requirements: [
        'Complete all advanced courses',
        'Pass master technician exam',
        'Complete 100 hours of hands-on training',
        'Submit case study project'
      ],
      validity: '5 years',
      badge: '/cert-3.png'
    }
  ]

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
                  <p className="text-2xl font-bold text-slate-900">12</p>
                  <p className="text-sm text-slate-600">Available Courses</p>
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
                  <p className="text-sm text-slate-600">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 rounded-xl">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">3</p>
                  <p className="text-sm text-slate-600">Certifications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm hover:shadow-lg transition-all">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 rounded-xl">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">24h</p>
                  <p className="text-sm text-slate-600">Total Hours</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
            <Button
              variant={activeTab === 'courses' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('courses')}
              className={`px-6 ${activeTab === 'courses' ? 'bg-red-600 text-white shadow-sm hover:bg-red-700' : 'hover:bg-slate-200'}`}
            >
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </Button>
            <Button
              variant={activeTab === 'certifications' ? 'default' : 'ghost'}
              onClick={() => setActiveTab('certifications')}
              className={`px-6 ${activeTab === 'certifications' ? 'bg-red-600 text-white shadow-sm hover:bg-red-700' : 'hover:bg-slate-200'}`}
            >
              <Award className="h-4 w-4 mr-2" />
              Certifications
            </Button>
          </div>
        </div>

        {/* Content */}
        {activeTab === 'courses' ? (
          <div className="space-y-6">
            {/* Featured Course */}
            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-50 to-blue-50">
              <CardContent className="p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-4">
                      <Badge className="bg-purple-100 text-purple-800">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                      <Badge variant="secondary">Advanced</Badge>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">
                      OMNI-7000 Advanced Operations
                    </h2>
                    <p className="text-slate-600 mb-4">
                      Master advanced techniques for operating and maintaining the OMNI-7000 system. 
                      This comprehensive course covers troubleshooting, optimization, and best practices.
                    </p>
                    <div className="flex items-center space-x-6 mb-6">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-600">8 hours</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-600">1,234 students</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-slate-600">4.8 (156 reviews)</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200">
                        <Play className="h-4 w-4 mr-2" />
                        Start Course
                      </Button>
                      <Button variant="outline">
                        <Bookmark className="h-4 w-4 mr-2" />
                        Save for Later
                      </Button>
                    </div>
                  </div>
                  <div className="mt-6 lg:mt-0 lg:ml-8">
                    <div className="w-64 h-40 bg-gradient-to-br from-purple-200 to-blue-200 rounded-lg flex items-center justify-center">
                      <Video className="h-16 w-16 text-purple-600" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="border-0 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="w-full h-48 bg-gradient-to-br from-slate-100 to-slate-200 rounded-t-lg flex items-center justify-center">
                        <Video className="h-12 w-12 text-slate-400" />
                      </div>
                      <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="bg-white/90 text-slate-700">
                          {course.level}
                        </Badge>
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
                        <div className="flex items-center space-x-1">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="text-sm text-slate-600">{course.rating}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{course.duration}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-4 w-4" />
                            <span>{course.students}</span>
                          </div>
                        </div>
                      </div>
                      
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
                        className="w-full"
                        variant={course.completed ? "outline" : "default"}
                      >
                        {course.completed ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Completed
                          </>
                        ) : course.progress > 0 ? (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Continue
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4 mr-2" />
                            Start Course
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {certifications.map((cert) => (
                <Card key={cert.id} className="border-0 shadow-sm hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trophy className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">{cert.name}</h3>
                      <p className="text-sm text-slate-600 mb-4">{cert.description}</p>
                      
                      <div className="space-y-2 mb-6">
                        <h4 className="text-sm font-medium text-slate-900">Requirements:</h4>
                        <ul className="text-sm text-slate-600 space-y-1">
                          {cert.requirements.map((req, index) => (
                            <li key={index} className="flex items-center space-x-2">
                              <Target className="h-3 w-3 text-green-500" />
                              <span>{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="text-sm text-slate-500 mb-4">
                        Valid for: {cert.validity}
                      </div>
                      
                      <Button className="w-full">
                        <Download className="h-4 w-4 mr-2" />
                        Download Certificate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}