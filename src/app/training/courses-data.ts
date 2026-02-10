export interface Course {
  id: string
  title: string
  description: string
  duration: string
  progress: number
  completed: boolean
  thumbnail: string
  instructor: string
  rating: number
  students: number
}

export const courses: Course[] = [
  {
    id: 'TR7000',
    title: 'OMNI 7000',
    description:
      'Comprehensive instrument training for operators, technicians and integrators. Get experience using the latest OMNI 7000 hardware and software tools.',
    duration: 'In Person',
    progress: 0,
    completed: false,
    thumbnail: '/images/tr7000.png',
    instructor: 'OMNI Training',
    rating: 0,
    students: 0,
  },
  {
    id: 'TR6100',
    title: 'Basic Operator Online Class – TR6100',
    description:
      'If you need to get the baseline skills required to operate the OMNI 3000/6000 flow computer, this is the class for you.',
    duration: 'In Person',
    progress: 0,
    completed: false,
    thumbnail: '/images/tr6100.png',
    instructor: 'OMNI Training',
    rating: 0,
    students: 0,
  },
  {
    id: 'TR6300',
    title: 'Operator / Technician Training - TR6300',
    description:
      'If you’re looking for a class that goes beyond basic navigation and front panel operations, this is the class for you.',
    duration: 'In Person',
    progress: 0,
    completed: false,
    thumbnail: '/images/tr6300.png',
    instructor: 'OMNI Training',
    rating: 0,
    students: 0,
  },
  {
    id: 'TR6400',
    title: 'Advanced Technician Class – TR6400',
    description:
      'If you’re already an experienced OMNI user, or you’ve completed our Operator/Technician (TR6300) class and you’re ready for the next step, this is the class for you.',
    duration: 'In Person',
    progress: 0,
    completed: false,
    thumbnail: '/images/tr6400.png',
    instructor: 'OMNI Training',
    rating: 0,
    students: 0,
  },
]

export const featuredCourse = courses[0]
