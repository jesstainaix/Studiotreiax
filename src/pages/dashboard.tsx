import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Navigation from '../components/layout/Navigation'
import { toast } from 'sonner'
import { useNavigationDebug } from '../hooks/useNavigationDebug'
import { useDashboardOptimization } from '../hooks/useDashboardOptimization'
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Play, 
  Clock, 
  Users, 
  TrendingUp,
  FileText,
  Video,
  Upload,
  Eye,
  Plus,
  ArrowRight,
  Star,
  Calendar,
  BarChart3,
  Sparkles,
  Edit3,
  Layout,
  Presentation,
  Bot,
  Activity,
  Monitor,
  PieChart,
  Shield,
  Settings,
  Building,
  Zap,
  Users2,
  Layers3,
  Wand2,
  Mic,
  Camera,
  Globe,
  Database,
  Lock,
  BookOpen,
  Headphones,
  Zap as Lightning,
  Cog,
  HardHat,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Target,
  CheckCircle,
  AlertCircle,
  TrendingDown,
  Minus,
  ExternalLink,
  Briefcase,
  Download,
  Heart,
  Bookmark,
  Share2,
  MoreHorizontal,
  XCircle,
  Award,
  Brain,
  Lightbulb
} from 'lucide-react'
import { cn } from '../lib/utils'
import PPTXUpload from '../components/upload/PPTXUpload'
import AIHub from '../components/ai/AIHub'
import AvatarPerformanceDisplay from '../components/avatar/AvatarPerformanceDisplay'

interface Project {
  id: string
  title: string
  category: string
  status: 'draft' | 'processing' | 'completed'
  duration: string
  createdAt: string
  thumbnail?: string
}

interface NRCategory {
  nr: string
  title: string
  description: string
  color: string
  icon: string
  projectCount: number
  completionRate: number
  priority: 'high' | 'medium' | 'low'
  lastUpdated: string
  templates: number
  activeProjects: number
}

interface ModuleCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  route: string
  color: string
  status: 'active' | 'beta' | 'coming-soon'
  category: string
}

interface QuickStat {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'stable'
  icon: React.ReactNode
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentPath, navigate: debugNavigate } = useNavigationDebug()
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'creation' | 'analytics' | 'advanced'>('all')
  const [selectedNR, setSelectedNR] = useState<string>('all')
  // Autenticação removida - não é mais necessária
  const [isLoading, setIsLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAdvancedFeatures, setShowAdvancedFeatures] = useState(false)
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [nrCategories, setNrCategories] = useState<NRCategory[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [modules, setModules] = useState<ModuleCard[]>([])
  const [quickStats, setQuickStats] = useState<QuickStat[]>([])
  const [recentProjects, setRecentProjects] = useState<Project[]>([])
  
  // Initialize optimization service
  const [optimizationService, setOptimizationService] = useState<import('../services/DashboardOptimizationService').DashboardOptimizationService | null>(null);
  
  useEffect(() => {
    // Dynamic import using import() instead of require
    import('../services/DashboardOptimizationService').then(({ DashboardOptimizationService }) => {
      setOptimizationService(new DashboardOptimizationService());
    });
  }, [])
  
  // Módulos organizados por categoria - moved here to fix initialization error
  const modulesByCategory = {
    'Criação de Conteúdo': [
      {
        id: 'editor',
        title: 'Editor de Vídeos',
        description: 'Editor profissional com timeline avançada',
        icon: <Edit3 className="h-6 w-6" />,
        route: '/editor',
        color: 'bg-blue-500',
        status: 'active' as const,
        category: 'creation'
      },
      {
        id: 'templates',
        title: 'Templates NR',
        description: 'Biblioteca de templates para normas regulamentadoras',
        icon: <Layout className="h-6 w-6" />,
        route: '/templates',
        color: 'bg-green-500',
        status: 'active' as const,
        category: 'creation'
      },
      {
        id: 'pptx-studio',
        title: 'PPTX Studio',
        description: 'Conversão inteligente de PowerPoint para vídeo',
        icon: <Presentation className="h-6 w-6" />,
        route: '/pptx-studio',
        color: 'bg-orange-500',
        status: 'active' as const,
        category: 'creation'
      },
      {
        id: 'ai-generative',
        title: 'IA Generativa',
        description: 'Criação automática de conteúdo com IA',
        icon: <Bot className="h-6 w-6" />,
        route: '/ai',
        color: 'bg-purple-500',
        status: 'active' as const,
        category: 'creation'
      }
    ],
    'Análise e Monitoramento': [
      {
        id: 'video-analytics',
        title: 'Video Analytics',
        description: 'Análise detalhada de performance de vídeos',
        icon: <BarChart3 className="h-6 w-6" />,
        route: '/video-analytics',
        color: 'bg-indigo-500',
        status: 'active' as const,
        category: 'analytics'
      },
      {
        id: 'performance-dashboard',
        title: 'Performance Dashboard',
        description: 'Monitoramento de performance do sistema',
        icon: <Activity className="h-6 w-6" />,
        route: '/performance-dashboard',
        color: 'bg-cyan-500',
        status: 'active' as const,
        category: 'analytics'
      }
    ]
  }
  
  // Função para lidar com navegação
  const handleModuleClick = (moduleId: string, route: string) => {
    console.log('[Dashboard] Clique detectado:', { moduleId, route, currentPath })
    
    // Verificar se a rota existe e redirecionar conforme necessário
    const routeMap: Record<string, string> = {
      '/editor': '/editor',
      '/templates': '/templates',
      '/pptx-studio': '/pptx-studio',
      '/video-editor': '/video-editor',
      '/performance-optimizer': '/performance-optimizer',
      '/ai-generative': '/ai-generative',
      '/avatars': '/avatars',
      '/video-analytics': '/video-analytics',
      '/performance-dashboard': '/performance-optimizer',
      '/projects': '/projects',
      '/settings': '/settings'
    }
    
  const targetRoute = routeMap[route] || '/dashboard'
  console.log('[Dashboard] Navegando para:', targetRoute)
    
    try {
      debugNavigate(targetRoute)
      toast.success(`Navegando para ${targetRoute}...`)
    } catch (error) {
      console.error('[Dashboard] Erro na navegação:', error)
      toast.error('Falha ao navegar para a página.')
    }
  }
  // Use optimization hooks
  const {
    virtualizedItems = [], // Ensure default empty array
    memoizedData,
    prefetchData,
    performanceMetrics
  } = useDashboardOptimization({
    items: Object.values(modulesByCategory).flat(),
    searchTerm,
    selectedCategories: [selectedCategory]
  })

  // Autenticação removida - acesso direto permitido

  // Enhanced data loading with optimization service
  useEffect(() => {
    if (!optimizationService) {
      return
    }

    let isActive = true

    const loadDashboardData = async () => {
      setIsLoading(true)
      const startTime = performance.now()

      try {
        if (typeof optimizationService.loadDashboardData !== 'function') {
          console.warn('[Dashboard] Serviço de otimização sem método loadDashboardData; usando dados padrão.')
          if (!isActive) {
            return
          }
          setQuickStats([])
          setProjects([])
          setModules([])
          setNrCategories([])
          setRecentProjects([])
          return
        }

        const dashboardData = await optimizationService.loadDashboardData()

        if (!isActive) {
          return
        }

        setQuickStats(dashboardData.quickStats)
        setProjects(dashboardData.projects)
        setModules(dashboardData.modules)
        setNrCategories(dashboardData.nrCategories)
        setRecentProjects(dashboardData.recentProjects ?? dashboardData.projects?.slice(0, 6) ?? [])

        // Track performance metrics
        const loadTime = performance.now() - startTime
        if (typeof optimizationService.trackPerformance === 'function') {
          optimizationService.trackPerformance('dashboard_load', loadTime)
        }
      } catch (error) {
        console.error('[Dashboard] Erro ao carregar dados:', error)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      isActive = false
    }
  }, [optimizationService])

  // Search functionality
  const handleSearch = (term: string) => {
    setSearchTerm(term)
    if (term.length > 2) {
      const suggestions = Object.values(modulesByCategory)
        .flat()
        .filter(module => 
          module.title.toLowerCase().includes(term.toLowerCase()) ||
          module.description.toLowerCase().includes(term.toLowerCase())
        )
        .map(module => module.title)
        .slice(0, 5)
      setSearchSuggestions(suggestions)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }

  // Filter modules based on search and category
  const filteredModules = useMemo(() => {
    let modules = Object.values(modulesByCategory).flat()
    
    if (selectedCategory !== 'all') {
      modules = modules.filter(module => module.category === selectedCategory)
    }
    
    if (searchTerm) {
      modules = modules.filter(module => 
        module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    return modules
  }, [searchTerm, selectedCategory])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard StudioTreiax
          </h1>
          <p className="text-gray-600">
            Central de controle para criação e análise de conteúdo
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <div 
              key={index} 
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                console.log('[Dashboard] Estatística acionada:', stat.label)
                toast.info(`Estatística selecionada: ${stat.label}`)
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className="text-blue-500">{stat.icon}</div>
              </div>
              <div className="mt-4 flex items-center">
                <span className={`text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 
                  stat.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {showSuggestions && searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg z-10">
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchTerm(suggestion)
                        setShowSuggestions(false)
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas as categorias</option>
              <option value="creation">Criação</option>
              <option value="analytics">Análise</option>
              <option value="advanced">Avançado</option>
            </select>
            
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className={`grid gap-6 mb-8 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            : 'grid-cols-1'
        }`}>
          {filteredModules.map((module) => (
            <div
              key={module.id}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleModuleClick(module.id, module.route)
              }}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group border border-gray-200 hover:border-blue-300"
              style={{ pointerEvents: 'auto', zIndex: 1 }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${module.color} text-white group-hover:scale-110 transition-transform`}>
                  {module.icon}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  module.status === 'active' ? 'bg-green-100 text-green-800' :
                  module.status === 'beta' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {module.status === 'active' ? 'Ativo' :
                   module.status === 'beta' ? 'Beta' : 'Em breve'}
                </span>
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {module.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {module.description}
              </p>
              
              <div className="mt-4 flex items-center text-blue-500 text-sm font-medium">
                Acessar
                <ExternalLink className="ml-1 h-3 w-3" />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Projetos Recentes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.slice(0, 6).map((project) => (
                <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 truncate">{project.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      project.status === 'completed' ? 'bg-green-100 text-green-800' :
                      project.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status === 'completed' ? 'Concluído' :
                       project.status === 'processing' ? 'Processando' : 'Rascunho'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{project.category}</p>
                  <p className="text-xs text-gray-500">{project.createdAt}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}