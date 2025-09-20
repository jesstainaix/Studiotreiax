import React from 'react'
import ProjectDashboard from '../components/dashboard/ProjectDashboard'

const Projects: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <ProjectDashboard />
      </div>
    </div>
  )
}

export default Projects