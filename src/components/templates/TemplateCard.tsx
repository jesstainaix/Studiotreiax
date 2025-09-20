import React from 'react'
import { Clock, FileText, Star, Lock, Play } from 'lucide-react'
import { Template } from '../../data/templates'

interface TemplateCardProps {
  template: Template
  onSelect: (template: Template) => void
  onPreview?: (template: Template) => void
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ 
  template, 
  onSelect, 
  onPreview 
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Básico':
        return 'bg-green-100 text-green-800'
      case 'Intermediário':
        return 'bg-yellow-100 text-yellow-800'
      case 'Avançado':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryColor = (nr: string) => {
    const colors: { [key: string]: string } = {
      'NR-10': 'bg-yellow-500',
      'NR-12': 'bg-orange-500',
      'NR-35': 'bg-red-500',
      'NR-06': 'bg-blue-500',
      'NR-17': 'bg-green-500',
      'NR-23': 'bg-red-600',
      'NR-33': 'bg-purple-500',
      'NR-18': 'bg-amber-500'
    }
    return colors[nr] || 'bg-gray-500'
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden group">
      {/* Thumbnail */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={template.thumbnail} 
          alt={template.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Overlay com botões */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            {onPreview && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(template)
                }}
                className="bg-white text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1 text-sm font-medium"
              >
                <Play className="w-4 h-4" />
                Preview
              </button>
            )}
            <button
              onClick={() => onSelect(template)}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Usar Template
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          <span className={`${getCategoryColor(template.nr)} text-white px-2 py-1 rounded-full text-xs font-medium`}>
            {template.nr}
          </span>
          {template.isPopular && (
            <span className="bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Star className="w-3 h-3" />
              Popular
            </span>
          )}
          {template.isFree && (
            <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
              Grátis
            </span>
          )}
          {!template.isFree && (
            <span className="bg-gray-800 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Premium
            </span>
          )}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {/* Título */}
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
          {template.title}
        </h3>

        {/* Descrição */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {template.description}
        </p>

        {/* Metadados */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{template.duration} min</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              <span>{template.slides} slides</span>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
            {template.difficulty}
          </span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 3).map((tag, index) => (
            <span 
              key={index}
              className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
            >
              {tag}
            </span>
          ))}
          {template.tags.length > 3 && (
            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
              +{template.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateCard