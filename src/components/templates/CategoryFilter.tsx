import React from 'react'
import { nrCategories } from '../../data/templates'

interface CategoryFilterProps {
  selectedCategory: string | null
  onCategoryChange: (category: string | null) => void
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ 
  selectedCategory, 
  onCategoryChange 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Filtrar por Categoria
      </h3>
      
      <div className="space-y-2">
        {/* Opção "Todas" */}
        <button
          onClick={() => onCategoryChange(null)}
          className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
            selectedCategory === null
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center text-white text-sm font-medium">
              📋
            </div>
            <div>
              <div className="font-medium">Todas as Categorias</div>
              <div className="text-sm text-gray-500">Ver todos os templates</div>
            </div>
          </div>
        </button>

        {/* Categorias NR */}
        {nrCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.name)}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              selectedCategory === category.name
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center text-white text-sm font-medium`}>
                {category.icon}
              </div>
              <div className="flex-1">
                <div className="font-medium">{category.name}</div>
                <div className="text-sm text-gray-500 line-clamp-1">
                  {category.description}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export default CategoryFilter