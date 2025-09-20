import React from 'react'
import { 
  Filter, 
  Search, 
  Calendar, 
  Tag, 
  X,
  ChevronDown,
  Clock,
  Star,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import type { 
  ProjectFilters, 
  ProjectSortBy
} from '../../types/project'
import { nrCategories } from '../../data/templates'

interface ProjectFiltersProps {
  filters: ProjectFilters
  sort: ProjectSortBy
  onFiltersChange: (filters: ProjectFilters) => void
  onSortChange: (sort: ProjectSortBy) => void
  onClearFilters: () => void
}

const statusOptions = [
  { value: 'draft', label: 'Rascunho' },
  { value: 'in_progress', label: 'Em Progresso' },
  { value: 'completed', label: 'Concluído' },
  { value: 'published', label: 'Publicado' }
]

const difficultyOptions = [
  { value: 'Básico', label: 'Básico' },
  { value: 'Intermediário', label: 'Intermediário' },
  { value: 'Avançado', label: 'Avançado' }
]

// Filtros rápidos pré-definidos
const quickFilters = [
  {
    label: 'Recentes',
    icon: Clock,
    filters: {
      dateRange: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    } as ProjectFilters
  },
  {
    label: 'Em Progresso',
    icon: AlertTriangle,
    filters: {
      status: ['in_progress' as const]
    } as ProjectFilters
  },
  {
    label: 'Concluídos',
    icon: CheckCircle,
    filters: {
      status: ['completed' as const]
    } as ProjectFilters
  },
  {
    label: 'Segurança',
    icon: Star,
    filters: {
      nrCategory: ['nr12']
    } as ProjectFilters
  }
]

export default function ProjectFilters({
  filters,
  sort,
  onFiltersChange,
  onSortChange,
  onClearFilters
}: ProjectFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState(filters.search || '')

  // Helper function to clean filters
  const cleanFilters = React.useCallback((filterObj: Partial<ProjectFilters>): ProjectFilters => {
    const clean: ProjectFilters = {}
    
    if (filterObj.status?.length) clean.status = filterObj.status
    if (filterObj.category?.length) clean.category = filterObj.category
    if (filterObj.nrCategory?.length) clean.nrCategory = filterObj.nrCategory
    if (filterObj.difficulty?.length) clean.difficulty = filterObj.difficulty
    if (filterObj.tags?.length) clean.tags = filterObj.tags
    if (filterObj.search?.trim()) clean.search = filterObj.search.trim()
    if (filterObj.createdAfter?.trim()) clean.createdAfter = filterObj.createdAfter.trim()
    if (filterObj.createdBefore?.trim()) clean.createdBefore = filterObj.createdBefore.trim()
    if (filterObj.dateRange?.start || filterObj.dateRange?.end) {
      clean.dateRange = {
        ...(filterObj.dateRange.start && { start: filterObj.dateRange.start }),
        ...(filterObj.dateRange.end && { end: filterObj.dateRange.end })
      }
    }
    
    return clean
  }, [])

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      const newFilters = { ...filters }
      if (searchValue.trim()) {
        newFilters.search = searchValue.trim()
      } else {
        delete newFilters.search
      }
      onFiltersChange(cleanFilters(newFilters))
    }, 300)

    return () => clearTimeout(timer)
  }, [searchValue, onFiltersChange, cleanFilters])

  const hasActiveFilters = React.useMemo(() => {
    return Object.entries(filters).some(([key, value]) => {
      if (key === 'search') return Boolean(value && value.trim())
      if (Array.isArray(value)) return value.length > 0
      return Boolean(value)
    })
  }, [filters])

  const activeFiltersCount = React.useMemo(() => {
    return Object.entries(filters).reduce((count, [key, value]) => {
      if (key === 'search') return count + (value && value.trim() ? 1 : 0)
      if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0)
      return count + (value ? 1 : 0)
    }, 0)
  }, [filters])

  const handleStatusChange = (status: string, checked: boolean) => {
    const currentStatus = filters.status || []
    const newStatus = checked
      ? [...currentStatus, status as any]
      : currentStatus.filter(s => s !== status)
    
    const newFilters = { ...filters }
    if (newStatus.length > 0) {
      newFilters.status = newStatus
    } else {
      delete newFilters.status
    }
    
    onFiltersChange(cleanFilters(newFilters))
  }

  const handleCategoryChange = (category: string, checked: boolean) => {
    const currentCategories = filters.nrCategory || []
    const newCategories = checked
      ? [...currentCategories, category]
      : currentCategories.filter(c => c !== category)
    
    const newFilters = { ...filters }
    if (newCategories.length > 0) {
      newFilters.nrCategory = newCategories
    } else {
      delete newFilters.nrCategory
    }
    
    onFiltersChange(cleanFilters(newFilters))
  }

  const handleDifficultyChange = (difficulty: string, checked: boolean) => {
    const currentDifficulty = filters.difficulty || []
    const newDifficulty = checked
      ? [...currentDifficulty, difficulty as any]
      : currentDifficulty.filter(d => d !== difficulty)
    
    const newFilters = { ...filters }
    if (newDifficulty.length > 0) {
      newFilters.difficulty = newDifficulty
    } else {
      delete newFilters.difficulty
    }
    
    onFiltersChange(cleanFilters(newFilters))
  }

  const handleTagsChange = (tagsString: string) => {
    const tags = tagsString
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
    
    const newFilters = { ...filters }
    if (tags.length > 0) {
      newFilters.tags = tags
    } else {
      delete newFilters.tags
    }
    
    onFiltersChange(cleanFilters(newFilters))
  }

  const handleDateChange = (field: 'createdAfter' | 'createdBefore', value: string) => {
    const newFilters = { ...filters }
    if (value.trim()) {
      newFilters[field] = value.trim()
    } else {
      delete newFilters[field]
    }
    
    onFiltersChange(cleanFilters(newFilters))
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filtros</h3>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
              {activeFiltersCount} {activeFiltersCount === 1 ? 'filtro ativo' : 'filtros ativos'}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-gray-100"
          >
            Avançado
            <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          
          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-md transition-colors hover:bg-red-50"
            >
              <X className="w-4 h-4" />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Filtros rápidos */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map(filter => (
          <button
            key={filter.label}
            onClick={() => onFiltersChange(filter.filters)}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors flex items-center gap-1"
          >
            <filter.icon className="w-3 h-3" />
            {filter.label}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar projetos..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Ordenação */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Ordenar por:</label>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as ProjectSortBy)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="updatedAt_desc">Última Modificação (Recente)</option>
          <option value="updatedAt_asc">Última Modificação (Antigo)</option>
          <option value="createdAt_desc">Data de Criação (Recente)</option>
          <option value="createdAt_asc">Data de Criação (Antigo)</option>
          <option value="title_asc">Título (A-Z)</option>
          <option value="title_desc">Título (Z-A)</option>
          <option value="status_asc">Status (A-Z)</option>
          <option value="status_desc">Status (Z-A)</option>
          <option value="duration_asc">Duração (Menor)</option>
          <option value="duration_desc">Duração (Maior)</option>
        </select>
      </div>

      {/* Filtros básicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <div className="space-y-2">
            {statusOptions.map(option => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.status?.includes(option.value as any) || false}
                  onChange={(e) => handleStatusChange(option.value, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Categorias NR */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Categoria NR</label>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {Object.entries(nrCategories).map(([key, category]) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.nrCategory?.includes(key) || false}
                  onChange={(e) => handleCategoryChange(key, e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{category.name}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Filtros avançados */}
      {showAdvanced && (
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dificuldade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Dificuldade</label>
              <div className="space-y-2">
                {difficultyOptions.map(option => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.difficulty?.includes(option.value as any) || false}
                      onChange={(e) => handleDifficultyChange(option.value, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 inline mr-1" />
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                placeholder="ex: segurança, altura, equipamentos"
                value={filters.tags?.join(', ') || ''}
                onChange={(e) => handleTagsChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Período */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Criado após
              </label>
              <input
                type="date"
                value={filters.createdAfter || ''}
                onChange={(e) => handleDateChange('createdAfter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Criado antes
              </label>
              <input
                type="date"
                value={filters.createdBefore || ''}
                onChange={(e) => handleDateChange('createdBefore', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}