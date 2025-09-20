import React, { useState, useMemo } from 'react'
import { Search, Filter, Grid, List, SortAsc, SortDesc } from 'lucide-react'
import { Template, templates, getTemplatesByCategory, searchTemplates, getPopularTemplates, getFreeTemplates } from '../../data/templates'
import TemplateCard from './TemplateCard'
import CategoryFilter from './CategoryFilter'
import { VirtualizedList } from '../ui/VirtualizedList'

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void
  onPreviewTemplate?: (template: Template) => void
}

type SortOption = 'title' | 'duration' | 'difficulty' | 'created'
type ViewMode = 'grid' | 'list'
type FilterOption = 'all' | 'popular' | 'free' | 'premium'

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ 
  onSelectTemplate, 
  onPreviewTemplate 
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('title')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filter, setFilter] = useState<FilterOption>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filtrar e ordenar templates
  const filteredAndSortedTemplates = useMemo(() => {
    let result = templates

    // Filtrar por categoria
    if (selectedCategory) {
      result = getTemplatesByCategory(selectedCategory)
    }

    // Filtrar por busca
    if (searchQuery.trim()) {
      result = result.filter(template => 
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // Filtrar por tipo
    switch (filter) {
      case 'popular':
        result = result.filter(template => template.isPopular)
        break
      case 'free':
        result = result.filter(template => template.isFree)
        break
      case 'premium':
        result = result.filter(template => !template.isFree)
        break
    }

    // Ordenar
    result.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'duration':
          comparison = a.duration - b.duration
          break
        case 'difficulty':
          const difficultyOrder = { 'Básico': 1, 'Intermediário': 2, 'Avançado': 3 }
          comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty]
          break
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    return result
  }, [searchQuery, selectedCategory, sortBy, sortOrder, filter])

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Gallery de Templates
        </h1>
        <p className="text-gray-600">
          Escolha um template profissional para criar seu vídeo de treinamento em segurança do trabalho
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar com filtros */}
        <div className="lg:w-80 space-y-6">
          <CategoryFilter 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />

          {/* Filtros adicionais */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Filtros
            </h3>
            
            <div className="space-y-4">
              {/* Filtro por tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as FilterOption)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos</option>
                  <option value="popular">Populares</option>
                  <option value="free">Gratuitos</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              {/* Ordenação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <div className="flex gap-2">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="title">Título</option>
                    <option value="duration">Duração</option>
                    <option value="difficulty">Dificuldade</option>
                    <option value="created">Data de criação</option>
                  </select>
                  <button
                    onClick={toggleSortOrder}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    title={`Ordenar ${sortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
                  >
                    {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1">
          {/* Barra de busca e controles */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Controles de visualização */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Visualização em grade"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title="Visualização em lista"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Resultados */}
          <div className="mb-4">
            <p className="text-gray-600">
              {filteredAndSortedTemplates.length} template{filteredAndSortedTemplates.length !== 1 ? 's' : ''} encontrado{filteredAndSortedTemplates.length !== 1 ? 's' : ''}
              {selectedCategory && ` em ${selectedCategory}`}
              {searchQuery && ` para "${searchQuery}"`}
            </p>
          </div>

          {/* Grid de templates */}
          {filteredAndSortedTemplates.length > 0 ? (
            <VirtualizedList
              items={filteredAndSortedTemplates}
              itemHeight={viewMode === 'grid' ? 320 : 120}
              containerHeight={600}
              keyExtractor={(template) => template.id}
              renderItem={(template) => (
                <div className={viewMode === 'grid' ? 'p-3' : 'mb-4'}>
                  <TemplateCard
                    template={template}
                    onSelect={onSelectTemplate}
                    onPreview={onPreviewTemplate}
                  />
                </div>
              )}
              className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-4'}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum template encontrado
              </h3>
              <p className="text-gray-600 mb-4">
                Tente ajustar os filtros ou termos de busca
              </p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory(null)
                  setFilter('all')
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Limpar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TemplateGallery