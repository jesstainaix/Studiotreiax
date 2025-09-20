import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Play, 
  Upload, 
  Zap, 
  TrendingUp, 
  Clock, 
  Users, 
  Star, 
  Download, 
  Eye, 
  Share2, 
  BarChart3, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  ArrowRight, 
  Sparkles, 
  Video, 
  FileText, 
  Mic, 
  Image as ImageIcon,
  Calendar,
  Filter,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  ChevronRight,
  Settings
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Lazy load heavy components for better performance
const LazyVideoPreview = lazy(() => import('./LazyVideoPreview'))
const LazyPerformanceChart = lazy(() => import('./LazyPerformanceChart'))

interface VideoProject {
  id: string
  title: string
  thumbnail: string
  duration: string
  status: 'processing' | 'completed' | 'error' | 'draft'
  progress?: number
  views: number
  likes: number
  createdAt: string
  updatedAt: string
  size: string
  format: string
  description?: string
  tags: string[]
}

interface DashboardStats {
  totalProjects: number
  completedProjects: number
  processingProjects: number
  totalViews: number
  totalDuration: string
  storageUsed: string
  storageLimit: string
  conversionTime: string
}

interface ComplianceItem {
  id: string
  title: string
  status: 'compliant' | 'warning' | 'non-compliant'
  description: string
  lastCheck: string
  category: 'performance' | 'accessibility' | 'security' | 'quality'
}

const MOCK_PROJECTS: VideoProject[] = [
  {
    id: '1',
    title: 'Apresentação Corporativa Q4 2024',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20corporate%20presentation%20thumbnail%20with%20charts%20and%20graphs%20modern%20blue%20theme&image_size=landscape_16_9',
    duration: '5:42',
    status: 'completed',
    views: 1247,
    likes: 89,
    createdAt: '2024-01-15',
    updatedAt: '2024-01-15',
    size: '45.2 MB',
    format: 'MP4',
    description: 'Apresentação dos resultados do quarto trimestre com análises detalhadas',
    tags: ['corporativo', 'resultados', 'Q4']
  },
  {
    id: '2',
    title: 'Tutorial de Produto - Funcionalidades Avançadas',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=product%20tutorial%20video%20thumbnail%20with%20software%20interface%20modern%20tech%20style&image_size=landscape_16_9',
    duration: '12:18',
    status: 'processing',
    progress: 67,
    views: 0,
    likes: 0,
    createdAt: '2024-01-16',
    updatedAt: '2024-01-16',
    size: '128.7 MB',
    format: 'MP4',
    description: 'Guia completo das funcionalidades avançadas do produto',
    tags: ['tutorial', 'produto', 'avançado']
  },
  {
    id: '3',
    title: 'Webinar - Tendências de Mercado 2025',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=webinar%20thumbnail%20with%20market%20trends%20charts%20professional%20business%20style&image_size=landscape_16_9',
    duration: '45:30',
    status: 'completed',
    views: 3421,
    likes: 234,
    createdAt: '2024-01-14',
    updatedAt: '2024-01-14',
    size: '892.1 MB',
    format: 'MP4',
    description: 'Análise das principais tendências de mercado para 2025',
    tags: ['webinar', 'mercado', 'tendências']
  }
]

const MOCK_STATS: DashboardStats = {
  totalProjects: 24,
  completedProjects: 18,
  processingProjects: 3,
  totalViews: 15680,
  totalDuration: '4h 32m',
  storageUsed: '2.4 GB',
  storageLimit: '10 GB',
  conversionTime: '< 30s'
}

const MOCK_COMPLIANCE: ComplianceItem[] = [
  {
    id: '1',
    title: 'Tempo de Carregamento',
    status: 'compliant',
    description: 'Dashboard carrega em menos de 2 segundos',
    lastCheck: '2024-01-16 14:30',
    category: 'performance'
  },
  {
    id: '2',
    title: 'Processamento PPTX',
    status: 'compliant',
    description: 'Conversão de 50 slides em menos de 30 segundos',
    lastCheck: '2024-01-16 14:25',
    category: 'performance'
  },
  {
    id: '3',
    title: 'Detecção OCR',
    status: 'warning',
    description: 'Precisão de 94% (meta: 95%)',
    lastCheck: '2024-01-16 14:20',
    category: 'quality'
  },
  {
    id: '4',
    title: 'Acessibilidade',
    status: 'compliant',
    description: 'WCAG 2.1 AA compliance verificado',
    lastCheck: '2024-01-16 14:15',
    category: 'accessibility'
  }
]

interface DashboardHubProps {
  onCreateProject?: () => void
  onOpenProject?: (projectId: string) => void
  className?: string
}

export default function DashboardHub({ 
  onCreateProject, 
  onOpenProject, 
  className 
}: DashboardHubProps) {
  const [projects, setProjects] = useState<VideoProject[]>(MOCK_PROJECTS)
  const [stats, setStats] = useState<DashboardStats>(MOCK_STATS)
  const [compliance, setCompliance] = useState<ComplianceItem[]>(MOCK_COMPLIANCE)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Optimized loading with performance tracking and preloading
  useEffect(() => {
    const startTime = performance.now()
    
    // Preload critical resources
    const preloadImages = () => {
      const imageUrls = projects.map(p => p.thumbnail)
      imageUrls.forEach(url => {
        const img = new Image()
        img.src = url
      })
    }
    
    // Immediate state updates for critical path
    const timer = setTimeout(() => {
      setIsLoading(false)
      const loadTime = Date.now() - startTime;
    }, 100);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 lg:p-8">
      {/* Hero Section - Optimized with Enhanced CTA and Performance Metrics */}
      <Card className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white shadow-2xl">
        <CardContent className="p-8 lg:p-12">
          <div className="flex items-center justify-between">
            <div className="space-y-8 flex-1">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    Estúdio IA de Vídeos
                  </h1>
                  <p className="text-lg opacity-90 mt-1">Plataforma de Treinamento Corporativo</p>
                </div>
              </div>
              
              <p className="text-xl lg:text-2xl opacity-95 max-w-3xl leading-relaxed">
                Transforme suas apresentações PPTX em vídeos de treinamento profissionais com IA avançada. 
                <span className="font-semibold text-yellow-300">Processamento &lt; 30s</span>, detecção automática de NR e qualidade superior.
              </p>
              
              {/* Enhanced Real-time Statistics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-2xl">
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-yellow-300">{stats.totalProjects}</div>
                  <div className="text-sm opacity-80">Projetos Ativos</div>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-green-300">{stats.conversionTime}</div>
                  <div className="text-sm opacity-80">Tempo Conversão</div>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-blue-300">{performanceMetrics.complianceScore}%</div>
                  <div className="text-sm opacity-80">Conformidade</div>
                </div>
                <div className="text-center p-4 bg-white/10 rounded-lg backdrop-blur-sm">
                  <div className="text-3xl font-bold text-purple-300">{stats.totalViews.toLocaleString()}</div>
                  <div className="text-sm opacity-80">Visualizações</div>
                </div>
              </div>
              
              {/* Enhanced Primary CTA with Secondary Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 hover:from-yellow-300 hover:to-orange-400 shadow-xl transform hover:scale-105 transition-all duration-300 font-bold text-lg px-8 py-4"
                  onClick={handleCreateProject}
                >
                  <Upload className="h-6 w-6 mr-3" />
                  Criar Vídeo de Treinamento
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-200"
                  onClick={() => toast.info('Navegando para templates...')}
                >
                  <Eye className="h-5 w-5 mr-2" />
                  Ver Templates NR
                </Button>
              </div>
              
              {/* Quick Access Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  🚀 Processamento Rápido
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  🎯 Detecção Automática NR
                </Badge>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                  ⚡ IA Avançada
                </Badge>
              </div>
            </div>
            
            {/* Enhanced Visual Element */}
            <div className="hidden lg:block ml-8">
              <div className="relative">
                <div className="w-40 h-40 bg-gradient-to-br from-white/30 to-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Video className="h-20 w-20 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-800" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Projetos</p>
                <p className="text-2xl font-bold">{stats.totalProjects}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Visualizações</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo de Conversão</p>
                <p className="text-2xl font-bold">{stats.conversionTime}</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Armazenamento</p>
                <p className="text-2xl font-bold">{stats.storageUsed}</p>
                <p className="text-xs text-gray-500">de {stats.storageLimit}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Template Gallery Section */}
      <Card className="mb-6 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Video className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <span className="text-xl font-bold">Galeria de Templates NR</span>
                  <p className="text-sm text-gray-600 font-normal mt-1">
                    Templates prontos para treinamentos de segurança do trabalho • Processamento &lt; 30s
                  </p>
                </div>
              </CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar templates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-48"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Filtrar por NR" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as NRs</SelectItem>
                  <SelectItem value="nr-6">NR-6 (EPI)</SelectItem>
                  <SelectItem value="nr-10">NR-10 (Elétrica)</SelectItem>
                  <SelectItem value="nr-12">NR-12 (Máquinas)</SelectItem>
                  <SelectItem value="nr-17">NR-17 (Ergonomia)</SelectItem>
                  <SelectItem value="nr-18">NR-18 (Construção)</SelectItem>
                  <SelectItem value="nr-23">NR-23 (Incêndio)</SelectItem>
                  <SelectItem value="nr-33">NR-33 (Espaços Confinados)</SelectItem>
                  <SelectItem value="nr-35">NR-35 (Altura)</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros Avançados
              </Button>
            </div>
          </div>
          
          {/* Quick Filter Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100">
              🔥 Mais Populares
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-green-100">
              ⚡ Processamento Rápido
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-purple-100">
              🎯 Alta Conformidade
            </Badge>
            <Badge variant="secondary" className="cursor-pointer hover:bg-orange-100">
              📊 Com Analytics
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Enhanced Template Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <Suspense fallback={<div className="animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-80"></div>}>
              <div className="group relative bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-blue-600 text-white font-semibold">NR-6</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700">8:45</Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-200">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">Equipamentos de Proteção Individual</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">Treinamento completo sobre uso correto de EPIs conforme NR-6</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      1.2k visualizações
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      95% conformidade
                    </span>
                  </div>
                </div>
              </div>
            </Suspense>

            <Suspense fallback={<div className="animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-80"></div>}>
              <div className="group relative bg-gradient-to-br from-yellow-50 to-orange-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="aspect-video bg-gradient-to-br from-yellow-500 to-orange-500 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-yellow-600 text-white font-semibold">NR-10</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700">12:30</Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-200">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-yellow-600 transition-colors">Segurança em Instalações Elétricas</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">Procedimentos de segurança para trabalhos elétricos conforme NR-10</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      2.1k visualizações
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      98% conformidade
                    </span>
                  </div>
                </div>
              </div>
            </Suspense>

            <Suspense fallback={<div className="animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-80"></div>}>
              <div className="group relative bg-gradient-to-br from-red-50 to-red-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="aspect-video bg-gradient-to-br from-red-500 to-red-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-red-600 text-white font-semibold">NR-12</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700">15:20</Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-200">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-red-600 transition-colors">Segurança no Trabalho em Máquinas</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">Proteções e dispositivos de segurança conforme NR-12</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      1.8k visualizações
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      92% conformidade
                    </span>
                  </div>
                </div>
              </div>
            </Suspense>

            <Suspense fallback={<div className="animate-pulse bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl h-80"></div>}>
              <div className="group relative bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="aspect-video bg-gradient-to-br from-purple-500 to-purple-600 relative overflow-hidden">
                  <div className="absolute inset-0 bg-black/20"></div>
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-purple-600 text-white font-semibold">NR-35</Badge>
                  </div>
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700">10:15</Badge>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-200">
                      <Play className="h-8 w-8 text-white ml-1" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 group-hover:text-purple-600 transition-colors">Trabalho em Altura</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">Procedimentos e equipamentos para trabalho seguro conforme NR-35</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      3.2k visualizações
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      96% conformidade
                    </span>
                  </div>
                </div>
              </div>
            </Suspense>
          </div>
          
          {/* Enhanced Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
              <Upload className="h-5 w-5 mr-2" />
              Criar Template Personalizado
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              Ver Todos os Templates
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="projects" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Conformidade</TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Galeria de Projetos
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Buscar projetos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-md text-sm"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="completed">Concluídos</option>
                    <option value="processing">Processando</option>
                    <option value="draft">Rascunhos</option>
                    <option value="error">Com Erro</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum projeto encontrado</h3>
                  <p className="text-gray-500 mb-4">Comece criando seu primeiro projeto de vídeo</p>
                  <Button onClick={handleCreateProject}>
                    <Upload className="h-4 w-4 mr-2" />
                    Criar Projeto
                  </Button>
                </div>
              ) : (
                <div className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                    : "space-y-4"
                )}>
                  {filteredProjects.map((project) => (
                    <Card 
                      key={project.id} 
                      className={cn(
                        "cursor-pointer hover:shadow-lg transition-shadow",
                        viewMode === 'list' && "flex items-center p-4"
                      )}
                      onClick={() => handleProjectClick(project.id)}
                    >
                      {viewMode === 'grid' ? (
                        <>
                          <div className="relative">
                            <img
                              src={project.thumbnail}
                              alt={project.title}
                              className="w-full h-48 object-cover rounded-t-lg"
                              loading="lazy"
                              decoding="async"
                              onLoad={(e) => {
                                e.currentTarget.style.opacity = '1'
                              }}
                              style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                            />
                            <div className="absolute top-2 right-2">
                              <Badge className={getStatusColor(project.status)}>
                                {project.status === 'completed' && 'Concluído'}
                                {project.status === 'processing' && 'Processando'}
                                {project.status === 'error' && 'Erro'}
                                {project.status === 'draft' && 'Rascunho'}
                              </Badge>
                            </div>
                            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                              {project.duration}
                            </div>
                            {project.status === 'processing' && project.progress && (
                              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2">
                                <Progress value={project.progress} className="h-2" />
                                <p className="text-white text-xs mt-1">{project.progress}% concluído</p>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold mb-2 line-clamp-2">{project.title}</h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {project.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {project.likes}
                                </span>
                              </div>
                              <span>{project.size}</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {project.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </>
                      ) : (
                        <>
                          <img
                            src={project.thumbnail}
                            alt={project.title}
                            className="w-24 h-16 object-cover rounded mr-4"
                            loading="lazy"
                            decoding="async"
                            onLoad={(e) => {
                              e.currentTarget.style.opacity = '1'
                            }}
                            style={{ opacity: 0, transition: 'opacity 0.3s ease' }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h3 className="font-semibold">{project.title}</h3>
                              <Badge className={getStatusColor(project.status)}>
                                {project.status === 'completed' && 'Concluído'}
                                {project.status === 'processing' && 'Processando'}
                                {project.status === 'error' && 'Erro'}
                                {project.status === 'draft' && 'Rascunho'}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{project.description}</p>
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <div className="flex items-center gap-4">
                                <span>{project.duration}</span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {project.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="h-3 w-3" />
                                  {project.likes}
                                </span>
                              </div>
                              <span>{project.size}</span>
                            </div>
                          </div>
                        </>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Taxa de Conclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{performanceMetrics.completionRate}%</div>
                <Progress value={performanceMetrics.completionRate} className="mb-2" />
                <p className="text-xs text-gray-600">
                  {stats.completedProjects} de {stats.totalProjects} projetos
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Uso de Armazenamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{performanceMetrics.storageUsage}%</div>
                <Progress value={performanceMetrics.storageUsage} className="mb-2" />
                <p className="text-xs text-gray-600">
                  {stats.storageUsed} de {stats.storageLimit}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Score de Conformidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold mb-2">{performanceMetrics.complianceScore}%</div>
                <Progress value={performanceMetrics.complianceScore} className="mb-2" />
                <p className="text-xs text-gray-600">
                  {compliance.filter(item => item.status === 'compliant').length} de {compliance.length} itens
                </p>
              </CardContent>
            </Card>
          </div>

          <Suspense fallback={<div className="animate-pulse bg-gray-200 rounded-lg h-32 mb-8"></div>}>
            <LazyPerformanceChart className="mb-8" />
          </Suspense>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Tempos de Processamento</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Carregamento do Dashboard</span>
                      <Badge variant="outline" className="text-green-600">&lt; 2s</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Conversão PPTX (50 slides)</span>
                      <Badge variant="outline" className="text-green-600">&lt; 30s</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Detecção OCR</span>
                      <Badge variant="outline" className="text-blue-600">&lt; 5s</Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Qualidade</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Precisão OCR</span>
                      <Badge variant="outline" className="text-yellow-600">94%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Taxa de Sucesso</span>
                      <Badge variant="outline" className="text-green-600">98.5%</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Satisfação do Usuário</span>
                      <Badge variant="outline" className="text-green-600">4.8/5</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          {/* Training Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Funcionários Treinados</p>
                    <p className="text-2xl font-bold text-green-600">847</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">de 1.200 funcionários</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Conformidade</p>
                    <p className="text-2xl font-bold text-blue-600">78%</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">+5% este mês</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Certificações Válidas</p>
                    <p className="text-2xl font-bold text-purple-600">623</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">156 vencem em 30 dias</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendências</p>
                    <p className="text-2xl font-bold text-red-600">89</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
                <p className="text-xs text-gray-500 mt-2">Requer ação imediata</p>
              </CardContent>
            </Card>
          </div>

          {/* NR Training Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Progresso de Treinamento por NR
              </CardTitle>
              <p className="text-sm text-gray-600">Percentual de funcionários treinados em cada Norma Regulamentadora</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* NR-6 Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-600">NR-6</Badge>
                      <span className="font-medium">Equipamentos de Proteção Individual</span>
                    </div>
                    <span className="text-sm font-medium">92% (1.104/1.200)</span>
                  </div>
                  <Progress value={92} className="h-2" />
                  <p className="text-xs text-gray-500">96 funcionários pendentes • Próximo vencimento: 15/03/2025</p>
                </div>

                {/* NR-10 Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-yellow-600">NR-10</Badge>
                      <span className="font-medium">Segurança em Instalações Elétricas</span>
                    </div>
                    <span className="text-sm font-medium">78% (234/300)</span>
                  </div>
                  <Progress value={78} className="h-2" />
                  <p className="text-xs text-gray-500">66 funcionários pendentes • Próximo vencimento: 22/02/2025</p>
                </div>

                {/* NR-12 Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-red-600">NR-12</Badge>
                      <span className="font-medium">Segurança no Trabalho em Máquinas</span>
                    </div>
                    <span className="text-sm font-medium">85% (340/400)</span>
                  </div>
                  <Progress value={85} className="h-2" />
                  <p className="text-xs text-gray-500">60 funcionários pendentes • Próximo vencimento: 10/04/2025</p>
                </div>

                {/* NR-17 Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-green-600">NR-17</Badge>
                      <span className="font-medium">Ergonomia</span>
                    </div>
                    <span className="text-sm font-medium">71% (568/800)</span>
                  </div>
                  <Progress value={71} className="h-2" />
                  <p className="text-xs text-gray-500">232 funcionários pendentes • Próximo vencimento: 05/05/2025</p>
                </div>

                {/* NR-35 Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-purple-600">NR-35</Badge>
                      <span className="font-medium">Trabalho em Altura</span>
                    </div>
                    <span className="text-sm font-medium">89% (178/200)</span>
                  </div>
                  <Progress value={89} className="h-2" />
                  <p className="text-xs text-gray-500">22 funcionários pendentes • Próximo vencimento: 18/03/2025</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Compliance Status Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Status de Conformidade Detalhado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {compliance.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(item.status)}
                      <div>
                        <h4 className="font-medium">{String(item.title)}</h4>
                        <p className="text-sm text-gray-600">{String(item.description)}</p>
                        <p className="text-xs text-gray-500">Última verificação: {String(item.lastCheck)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          item.status === 'compliant' && 'text-green-600 border-green-600',
                          item.status === 'warning' && 'text-yellow-600 border-yellow-600',
                          item.status === 'non-compliant' && 'text-red-600 border-red-600'
                        )}
                      >
                        {String(item.category)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}