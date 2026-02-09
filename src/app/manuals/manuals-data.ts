export interface Manual {
  id: string
  title: string
  category: string
  filename: string
  path: string
  size: string
  description: string
}

export const manuals: Manual[] = [
  {
    id: '1',
    title: 'User Manual Volume 1 - System Architecture & Installation',
    category: 'OMNI-3000-6000',
    filename: 'User-Manual-Volume-1-System-Architecture-Installation.pdf',
    path: '/manuals/OMNI-3000-6000/User-Manual-Volume-1-System-Architecture-Installation.pdf',
    size: '2.4 MB',
    description: 'Complete system architecture and installation guide for OMNI-3000 and OMNI-6000 series'
  },
  {
    id: '2',
    title: 'OMNI 7000 Installation and Configuration',
    category: 'OMNI-4000-7000',
    filename: 'OMNI 7000 Installation and Configuration.pdf',
    path: '/manuals/OMNI-4000-7000/OMNI 7000 Installation and Configuration.pdf',
    size: '1.8 MB',
    description: 'Step-by-step installation and configuration guide for OMNI-7000 systems'
  },
  {
    id: '3',
    title: 'OMNI 7000 Operations and Maintenance Guide',
    category: 'OMNI-4000-7000',
    filename: 'OMNI 7000 Operations and Maintenance Guide.pdf',
    path: '/manuals/OMNI-4000-7000/OMNI 7000 Operations and Maintenance Guide.pdf',
    size: '3.2 MB',
    description: 'Comprehensive operations and maintenance procedures for OMNI-7000 systems'
  }
]
