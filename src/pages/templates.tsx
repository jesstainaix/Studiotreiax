import React from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/Navigation'
import TemplateGallery from '../components/templates/TemplateGallery'
import { Template } from '../data/templates'

export default function Templates() {
  const navigate = useNavigate()

  const handleSelectTemplate = (template: Template) => {
    // Redirecionar para o editor com o template selecionado
    navigate(`/editor?template=${template.id}`)
  }

  const handlePreviewTemplate = (template: Template) => {
    // Implementar preview do template (modal ou página separada)
    console.log('Preview template:', template.id)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Modelos de Apresentação
          </h1>
          <p className="text-gray-600">
            Escolha um modelo para começar sua apresentação
          </p>
        </div>
        
        <TemplateGallery 
          onSelectTemplate={handleSelectTemplate}
          onPreviewTemplate={handlePreviewTemplate}
        />
      </div>
    </div>
  )
}