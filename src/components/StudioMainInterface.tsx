// Interface Principal do Studio IA Videos - Hub Central de Todas as Funcionalidades
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense, lazy } from 'react';
import { 
  Settings, Monitor, Cloud, Users, FileVideo, Presentation,
  Mic, Layers, Activity, Bell, Search, Sparkles, TestTube, Brain,
  Upload, FolderOpen, Plus, X, Maximize2, Minimize2, Star, User
} from 'lucide-react';
import { OptimizedHeader } from './ui/OptimizedHeader';

// Lazy loading otimizado para componentes pesados
const LazyAdvancedVideoEditor = lazy(() => 
  import('./editor/AdvancedVideoEditor').catch(() => ({ default: () => <div>Erro ao carregar Editor</div> }))
);
const LazyAvatar3DInterface = lazy(() => 
  import('./avatar/Avatar3DInterface').catch(() => ({ default: () => <div>Erro ao carregar Avatares</div> }))
);
const LazyCompletePipelineInterface = lazy(() => 
  import('./pipeline/CompletePipelineInterface').catch(() => ({ default: () => <div>Erro ao carregar Pipeline</div> }))
);
const LazyEnhancedPPTXConverter = lazy(() => 
  import('./converter/EnhancedPPTXConverter').catch(() => ({ default: () => <div>Erro ao carregar Conversor</div> }))
);
const LazyVFXInterface = lazy(() => 
  import('./VFXInterface').catch(() => ({ default: () => <div>Erro ao carregar VFX</div> }))
);
const LazyCloudRenderingInterface = lazy(() => 
  import('./CloudRenderingInterface').catch(() => ({ default: () => <div>Erro ao carregar Cloud</div> }))
);
const LazyPerformanceInterface = lazy(() => 
  import('./PerformanceInterface').catch(() => ({ default: () => <div>Erro ao carregar Performance</div> }))
);
const LazySystemOptimizerInterface = lazy(() => 
  import('./SystemOptimizerInterface').catch(() => ({ default: () => <div>Erro ao carregar Otimizador</div> }))
);
const LazyIntegrationTestsInterface = lazy(() => 
  import('./IntegrationTestsInterface').catch(() => ({ default: () => <div>Erro ao carregar Testes</div> }))
);
const LazyAIIntegratedPanel = lazy(() => 
  import('./ai/AIIntegratedPanel').catch(() => ({ default: () => <div>Erro ao carregar IA Integrada</div> }))
);

// Componente de loading otimizado
const LazyLoadingFallback: React.FC<{ componentName: string }> = ({ componentName }) => (
  <div className="flex items-center justify-center p-4 min-h-[200px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent mx-auto mb-2"></div>
      <p className="text-xs text-gray-500">{componentName}</p>
    </div>
  </div>
);

// Imports normais (apenas componentes não lazy)
import SystemIntegration from '../systems/SystemIntegration';
import DashboardHub from './dashboard/DashboardHub';
import NRTemplateInterface from './templates/NRTemplateInterface';
import PPTXAnalysisInterface from './pptx/PPTXAnalysisInterface';
import PPTXUpload from './upload/PPTXUpload';
import TTSInterface from './tts/TTSInterface';
import PPTXToVideoIntegration from './video-editor/PPTXToVideoIntegration';
import TimelineTest from './editor/TimelineTest';
import ProjectDashboard from './dashboard/ProjectDashboard';
import type { CompletePipelineData } from '../services/pipelineOrchestrationService';

// Interfaces
interface TabConfig {
  id: string;
  name: string;
  icon: React.ReactNode;
  component: React.ComponentType<any>;
  description: string;
  category: 'core' | 'ai' | 'tools' | 'analysis';
  premium?: boolean;
  beta?: boolean;
}

interface SystemStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'error' | 'loading';
  health: number;
  lastUpdate: Date;
}

interface NotificationItem {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actions?: {
    label: string;
    action: () => void;
  }[];
}

interface ProjectItem {
  id: string;
  name: string;
  type: 'video' | 'presentation' | 'training' | 'avatar';
  thumbnail?: string;
  duration?: number;
  created: Date;
  modified: Date;
  status: 'draft' | 'processing' | 'completed' | 'error';
  progress?: number;
}

interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'pt-BR' | 'en-US' | 'es-ES';
  autoSave: boolean;
  notifications: boolean;
  performance: 'low' | 'medium' | 'high' | 'ultra';
  cloudSync: boolean;
  shortcuts: Record<string, string>;
}

// Componentes auxiliares
const StatusIndicator: React.FC<{ status: SystemStatus['status']; size?: 'sm' | 'md' | 'lg' }> = ({ 
  status, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    error: 'bg-red-500',
    loading: 'bg-yellow-500 animate-pulse'
  };
  
  return (
    <div className={`rounded-full ${sizeClasses[size]} ${statusColors[status]}`} />
  );
};

const NotificationBadge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  
  return (
    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </div>
  );
};

const ProjectCard: React.FC<{ project: ProjectItem; onClick: () => void }> = ({ 
  project, 
  onClick 
}) => {
  const typeIcons = {
    video: <FileVideo className="w-4 h-4" />,
    presentation: <Presentation className="w-4 h-4" />,
    training: <Users className="w-4 h-4" />,
    avatar: <User className="w-4 h-4" />
  };
  
  const statusColors = {
    draft: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    error: 'bg-red-100 text-red-600'
  };
  
  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          {typeIcons[project.type]}
          <h3 className="font-medium text-gray-900 truncate">{project.name}</h3>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          {project.status}
        </span>
      </div>
      
      {project.thumbnail && (
        <div className="w-full h-24 bg-gray-100 rounded mb-3 overflow-hidden">
          <img 
            src={project.thumbnail} 
            alt={project.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {project.progress !== undefined && project.status === 'processing' && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progresso</span>
            <span>{project.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${project.progress}%` }}
            />
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Criado: {project.created.toLocaleDateString()}</span>
        {project.duration && (
          <span>{Math.floor(project.duration / 60)}:{(project.duration % 60).toString().padStart(2, '0')}</span>
        )}
      </div>
    </div>
  );
};

// Componente principal
const StudioMainInterface: React.FC = () => {
  
  // Estados principais
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [pptxConversionData, setPptxConversionData] = useState<any | null>(null);
  const [pipelineData, setPipelineData] = useState<CompletePipelineData | null>(null);
  const [systemIntegration, setSystemIntegration] = useState<SystemIntegration | null>(null);
  const [systemStatuses, setSystemStatuses] = useState<SystemStatus[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'pt-BR',
    autoSave: true,
    notifications: true,
    performance: 'high',
    cloudSync: true,
    shortcuts: {}
  });
  const [preloadedComponents, setPreloadedComponents] = useState<Set<string>>(new Set());

  // Preload otimizado apenas para componentes críticos
  const preloadComponent = useCallback(async (componentId: string) => {
    if (preloadedComponents.has(componentId)) return;
    
    try {
      // Preload apenas componentes mais usados
      switch (componentId) {
        case 'video-editor':
          await import('./editor/AdvancedVideoEditor');
          break;
        case 'pipeline-complete':
          await import('./pipeline/CompletePipelineInterface');
          break;
        case 'avatars':
          await import('./avatar/Avatar3DInterface');
          break;
      }
      setPreloadedComponents(prev => new Set([...prev, componentId]));
    } catch (error) {
      // Silenciar erros de preload para não afetar performance
    }
  }, [preloadedComponents]);

  // Handler para hover nas abas (preload)
  const handleTabHover = useCallback((tabId: string) => {
    preloadComponent(tabId);
  }, [preloadComponent]);
  
  // Estados da interface
  const [isLoading, setIsLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  
  // Refs
  const notificationRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  // Configuração das abas
  const tabs: TabConfig[] = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <Monitor className="w-5 h-5" />,
      component: DashboardHub,
      description: 'Visão geral e métricas do sistema',
      category: 'core'
    },
    {
      id: 'projects',
      name: 'Projetos',
      icon: <FolderOpen className="w-5 h-5" />,
      component: ProjectDashboard,
      description: 'Gerenciamento e compartilhamento de projetos',
      category: 'core'
    },
    {
      id: 'video-editor',
      name: 'Editor de Vídeo',
      icon: <FileVideo className="w-5 h-5" />,
      component: LazyAdvancedVideoEditor,
      description: 'Editor profissional com timeline avançada',
      category: 'core'
    },
    {
      id: 'avatars',
      name: 'Avatares 3D',
      icon: <Users className="w-5 h-5" />,
      component: LazyAvatar3DInterface,
      description: 'Sistema de avatares hiper-realistas',
      category: 'ai',
      premium: true
    },
    {
      id: 'templates',
      name: 'Templates NR',
      icon: <Layers className="w-5 h-5" />,
      component: NRTemplateInterface,
      description: 'Templates para Normas Regulamentadoras',
      category: 'tools'
    },
    {
      id: 'pipeline-complete',
      name: 'Pipeline PPTX→Vídeo',
      icon: <Sparkles className="w-5 h-5" />,
      component: LazyCompletePipelineInterface,
      description: 'Pipeline completo: PPTX → Análise IA → TTS → Vídeo Final',
      category: 'core',
      beta: true
    },
    {
      id: 'pptx-upload',
      name: 'Upload PPTX',
      icon: <Upload className="w-5 h-5" />,
      component: PPTXUpload,
      description: 'Upload e conversão de apresentações PowerPoint',
      category: 'core'
    },
    {
      id: 'pptx-analysis',
      name: 'Análise PPTX',
      icon: <Presentation className="w-5 h-5" />,
      component: PPTXAnalysisInterface,
      description: 'Conversão inteligente de apresentações',
      category: 'ai',
      beta: true
    },
    {
      id: 'pptx-studio',
      name: 'PPTX Studio IA',
      icon: <Sparkles className="w-5 h-5" />,
      component: LazyEnhancedPPTXConverter,
      description: 'Conversor avançado PPTX para vídeo com IA e templates NR',
      category: 'ai',
      premium: true
    },
    {
      id: 'tts',
      name: 'Text-to-Speech',
      icon: <Mic className="w-5 h-5" />,
      component: TTSInterface,
      description: 'Síntese de voz premium multi-provider',
      category: 'ai'
    },
    {
      id: 'vfx',
      name: 'Efeitos VFX',
      icon: <Sparkles className="w-5 h-5" />,
      component: LazyVFXInterface,
      description: 'Efeitos visuais e transições avançadas',
      category: 'tools'
    },
    {
      id: 'cloud-render',
      name: 'Renderização Cloud',
      icon: <Cloud className="w-5 h-5" />,
      component: LazyCloudRenderingInterface,
      description: 'Renderização distribuída em nuvem',
      category: 'tools',
      premium: true
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: <Activity className="w-5 h-5" />,
      component: LazyPerformanceInterface,
      description: 'Análise e otimização de performance',
      category: 'analysis'
    },
    {
      id: 'tests',
      name: 'Testes de Integração',
      icon: <TestTube className="w-5 h-5" />,
      component: LazyIntegrationTestsInterface,
      description: 'Testes automatizados de integração',
      category: 'analysis'
    },
    {
      id: 'optimizer',
      name: 'Otimização do Sistema',
      icon: <Settings className="w-5 h-5" />,
      component: LazySystemOptimizerInterface,
      description: 'Otimização inteligente de performance e recursos',
      category: 'analysis'
    },
    {
      id: 'timeline-test',
      name: 'Teste Timeline',
      icon: <FileVideo className="w-5 h-5" />,
      component: TimelineTest,
      description: 'Teste da interface de timeline responsiva',
      category: 'tools',
      beta: true
    },
    {
      id: 'ai-integrated',
      name: 'IA Integrada',
      icon: <Brain className="w-5 h-5" />,
      component: LazyAIIntegratedPanel,
      description: 'Painel completo de IA com análise, legendas, transcrição e sugestões inteligentes',
      category: 'ai',
      premium: true
    }
  ];
  
  // Inicialização
  useEffect(() => {
    initializeSystem();
  }, []);
  
  const initializeSystem = async () => {
    try {
      setIsLoading(true);
      
      // Inicializar sistema de integração (singleton)
      const integration = SystemIntegration.getInstance({
        enabledSystems: ['vfx', 'avatar', 'templates', 'pptx', 'tts', 'performance'],
        autoStart: true,
        performance: {
          enableMonitoring: true,
          alertThresholds: {
            cpu: 80,
            memory: 85,
            responseTime: 5000
          }
        }
      });
      
      await integration.initialize();
      setSystemIntegration(integration);
      
      // Configurar listeners
      integration.on('systemStatusUpdated', (status: any) => {
        setSystemStatuses(prev => {
          const updated = [...prev];
          const index = updated.findIndex(s => s.id === status.id);
          if (index >= 0) {
            updated[index] = status;
          } else {
            updated.push(status);
          }
          return updated;
        });
      });
      
      integration.on('performanceAlert', (alert: any) => {
        addNotification({
          type: 'warning',
          title: 'Alerta de Performance',
          message: alert.message,
          actions: [
            {
              label: 'Ver Detalhes',
              action: () => setActiveTab('performance')
            }
          ]
        });
      });
      
      integration.on('renderCompleted', (job: any) => {
        addNotification({
          type: 'success',
          title: 'Renderização Concluída',
          message: `Projeto ${job.projectId} renderizado com sucesso`
        });
      });
      
      // Carregar dados iniciais
      loadProjects();
      loadNotifications();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao inicializar sistema:', error);
      setIsLoading(false);
      
      addNotification({
        type: 'error',
        title: 'Erro de Inicialização',
        message: 'Falha ao inicializar o sistema. Verifique a conexão.'
      });
    }
  };
  
  const loadProjects = async () => {
    // Simular carregamento de projetos
    const mockProjects: ProjectItem[] = [
      {
        id: '1',
        name: 'Treinamento NR-35',
        type: 'training',
        duration: 180,
        created: new Date('2024-01-15'),
        modified: new Date('2024-01-20'),
        status: 'completed'
      },
      {
        id: '2',
        name: 'Apresentação Corporativa',
        type: 'presentation',
        duration: 120,
        created: new Date('2024-01-18'),
        modified: new Date('2024-01-18'),
        status: 'processing',
        progress: 65
      },
      {
        id: '3',
        name: 'Avatar Instrutor',
        type: 'avatar',
        created: new Date('2024-01-20'),
        modified: new Date('2024-01-20'),
        status: 'draft'
      }
    ];
    
    setProjects(mockProjects);
  };
  
  const loadNotifications = () => {
    const mockNotifications: NotificationItem[] = [
      {
        id: '1',
        type: 'info',
        title: 'Sistema Atualizado',
        message: 'Nova versão do sistema de avatares disponível',
        timestamp: new Date(),
        read: false
      },
      {
        id: '2',
        type: 'success',
        title: 'Renderização Concluída',
        message: 'Projeto "Treinamento NR-35" foi renderizado com sucesso',
        timestamp: new Date(Date.now() - 3600000),
        read: false
      }
    ];
    
    setNotifications(mockNotifications);
  };
  
  const addNotification = (notification: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: NotificationItem = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  };
  
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };
  
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  const createNewProject = async (type: ProjectItem['type']) => {
    if (!systemIntegration) return;
    
    try {
      const projectId = await systemIntegration.createProject({
        name: `Novo ${type === 'video' ? 'Vídeo' : type === 'presentation' ? 'Apresentação' : type === 'training' ? 'Treinamento' : 'Avatar'}`,
        type
      });
      
      addNotification({
        type: 'success',
        title: 'Projeto Criado',
        message: 'Novo projeto criado com sucesso'
      });
      
      loadProjects();
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro',
        message: 'Falha ao criar projeto'
      });
    }
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };
  
  // Filtrar abas por categoria e busca
  const filteredTabs = tabs.filter(tab => {
    if (searchQuery) {
      return tab.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             tab.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });
  
  const unreadNotifications = notifications.filter(n => !n.read).length;
  const activeTabConfig = tabs.find(tab => tab.id === activeTab);
  const ActiveComponent = activeTabConfig?.component;
  
  // Fallback component para quando activeTabConfig é undefined
  const FallbackComponent = () => {
    useEffect(() => {
      const timer = setTimeout(() => {
        setActiveTab('dashboard');
      }, 2000);
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-400 mb-4">
            <Monitor className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Componente não encontrado</h3>
          <p className="text-gray-500">A aba selecionada não foi encontrada. Redirecionando para o dashboard...</p>
        </div>
      </div>
    );
  };
  
  // Função para navegar para o editor com um projeto específico
  const handleNavigateToEditor = (projectId: string) => {
    // Armazenar o ID do projeto atual
    setCurrentProjectId(projectId);
    
    // Mudar para a aba do editor
    setActiveTab('video-editor');
    
    // Adicionar notificação de sucesso
    addNotification({
      type: 'success',
      title: 'Navegando para o Editor',
      message: `Abrindo projeto ${projectId} no editor de vídeo`
    });
  };

  // Função para navegar para o editor com dados PPTX
  const handlePPTXToVideoEditor = (pptxFile: File) => {
    
    // Armazenar arquivo PPTX no estado
    setPptxConversionData({ file: pptxFile });
    
    // Criar ID do projeto baseado no arquivo PPTX
    const projectId = `pptx-${Date.now()}`;
    setCurrentProjectId(projectId);
    
    // Mudar para a aba do editor de vídeo
    setActiveTab('video-editor');
    
    // Adicionar notificação de sucesso
    addNotification({
      type: 'success',
      title: 'PPTX Convertido!',
      message: 'Apresentação carregada no editor de vídeo para finalização'
    });
  };

  // Callback quando PPTX é inicializado no editor
  const handlePPTXInitialized = (pptxProject: any) => {
    
    // Adicionar notificação de sucesso
    addNotification({
      type: 'success',
      title: 'PPTX Carregado!',
      message: `Projeto "${pptxProject.name}" configurado na timeline com ${pptxProject.slidesCount} slides`
    });
    
    // Atualizar métricas ou estado adicional se necessário
    // Aqui você pode adicionar lógica adicional se necessário
  };

  // Callback para cleanup da memória
  const handlePPTXCleanupNeeded = () => {
    
    // Cleanup dos dados de conversão para liberar memória
    setTimeout(() => {
      setPptxConversionData(null);
      setPipelineData(null);
    }, 100); // Delay menor para cleanup mais rápido
  };

  // Callback quando pipeline completo é finalizado
  const handlePipelineComplete = (data: CompletePipelineData) => {
    setPipelineData(data);
    
    addNotification({
      type: 'success',
      title: '🎉 Pipeline Completo!',
      message: `Vídeo "${data.pptxFile.name}" criado com sucesso`
    });
  };

  // Callback para navegar do pipeline para o editor
  const handleNavigateToEditorFromPipeline = (data: CompletePipelineData) => {
    setPipelineData(data);
    setCurrentProjectId(`pipeline-${Date.now()}`);
    setActiveTab('video-editor');
    
    addNotification({
      type: 'info',
      title: '🎬 Abrindo Editor',
      message: 'Vídeo carregado no editor para ajustes finais'
    });
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Inicializando Studio IA Videos</h2>
          <p className="text-gray-600">Carregando sistemas e componentes...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header da Sidebar */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <img 
                src="/attached_assets/Vyond Studio_1_1758158316501.png" 
                alt="Studio IA Logo" 
                className="w-12 h-8 object-contain flex-shrink-0"
              />
                <div>
                  <h1 className="text-xl font-bold text-gray-900 hidden">Studio IA</h1>
                  <p className="text-sm text-gray-500 hidden">Videos Pro</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {sidebarCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Busca */}
        {!sidebarCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar funcionalidades..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}
        
        {/* Navegação */}
        <nav className="flex-1 overflow-y-auto">
          <div className="p-2">
            {['core', 'ai', 'tools', 'analysis'].map(category => {
              const categoryTabs = filteredTabs.filter(tab => tab.category === category);
              if (categoryTabs.length === 0) return null;
              
              const categoryNames = {
                core: 'Principal',
                ai: 'Inteligência Artificial',
                tools: 'Ferramentas',
                analysis: 'Análise'
              };
              
              return (
                <div key={category} className="mb-4">
                  {!sidebarCollapsed && (
                    <h3 className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {categoryNames[category as keyof typeof categoryNames]}
                    </h3>
                  )}
                  
                  {categoryTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      onMouseEnter={() => handleTabHover(tab.id)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                      title={sidebarCollapsed ? tab.name : undefined}
                    >
                      <div className="flex items-center space-x-3">
                        {tab.icon}
                        {!sidebarCollapsed && (
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{tab.name}</span>
                              {tab.premium && (
                                <Star className="w-3 h-3 text-yellow-500" />
                              )}
                              {tab.beta && (
                                <span className="px-1 py-0.5 bg-orange-100 text-orange-600 text-xs rounded">
                                  BETA
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">{tab.description}</p>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </nav>
        
        {/* Status dos Sistemas */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Status dos Sistemas</h4>
            <div className="space-y-2">
              {systemStatuses.slice(0, 3).map(status => (
                <div key={status.id} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <StatusIndicator status={status.status} size="sm" />
                    <span className="text-xs text-gray-600">{status.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">{status.health}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col">
        {/* Header Otimizado */}
        <OptimizedHeader
          activeTabConfig={activeTabConfig}
          showProjects={showProjects}
          setShowProjects={setShowProjects}
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          showSettings={showSettings}
          setShowSettings={setShowSettings}
          projects={projects}
          notifications={notifications}
          unreadNotifications={unreadNotifications}
          preferences={preferences}
          setPreferences={setPreferences}
          createNewProject={createNewProject}
          clearAllNotifications={clearAllNotifications}
          markNotificationAsRead={markNotificationAsRead}
          toggleFullscreen={toggleFullscreen}
          fullscreen={fullscreen}
          notificationRef={notificationRef}
          settingsRef={settingsRef}
        />
        
        {/* Conteúdo da Aba Ativa */}
        <main className="flex-1 overflow-hidden">
          <Suspense fallback={<LazyLoadingFallback componentName={activeTabConfig?.name ? String(activeTabConfig.name) : 'Componente'} />}>
            {ActiveComponent && typeof ActiveComponent === 'function' ? (
               activeTab === 'dashboard' ? (
                 <ActiveComponent systemIntegration={systemIntegration} />
               ) : activeTab === 'pipeline-complete' ? (
                 <ActiveComponent 
                   onPipelineComplete={handlePipelineComplete}
                   onNavigateToEditor={handleNavigateToEditorFromPipeline}
                 />
               ) : activeTab === 'pptx-upload' ? (
                 <ActiveComponent 
                   systemIntegration={systemIntegration} 
                   onNavigateToEditor={handlePPTXToVideoEditor}
                 />
               ) : activeTab === 'pptx-studio' ? (
                 <ActiveComponent 
                   systemIntegration={systemIntegration} 
                   onNavigateToEditor={handlePPTXToVideoEditor}
                 />
               ) : activeTab === 'video-editor' ? (
                 <PPTXToVideoIntegration 
                   pptxFile={pptxConversionData?.file}
                   onBack={() => setActiveTab('dashboard')}
                   className="h-full"
                 />
               ) : (
                 <ActiveComponent systemIntegration={systemIntegration} />
               )
             ) : (
               <FallbackComponent />
             )}
          </Suspense>
        </main>
      </div>
    </div>
  );
};

export default StudioMainInterface;