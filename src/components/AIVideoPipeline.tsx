import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Play, 
  Pause, 
  Square, 
  Upload, 
  Download, 
  Settings, 
  Zap, 
  FileVideo, 
  FileText, 
  Image, 
  Mic, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw,
  Layers,
  Wand2,
  Brain,
  Target
} from 'lucide-react';
import { toast } from 'sonner';

interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  aiEnhanced: boolean;
  estimatedTime?: number;
  actualTime?: number;
  output?: any;
  error?: string;
}

interface VideoProject {
  id: string;
  title: string;
  description: string;
  nrType: string;
  status: 'draft' | 'processing' | 'completed' | 'error';
  createdAt: string;
  stages: PipelineStage[];
  aiSettings: {
    autoGenerate: boolean;
    qualityCheck: boolean;
    optimization: boolean;
    smartCaptions: boolean;
  };
  metadata: {
    duration?: number;
    resolution?: string;
    format?: string;
    size?: number;
  };
}

interface AIEnhancement {
  id: string;
  type: 'script' | 'storyboard' | 'captions' | 'optimization';
  status: 'pending' | 'processing' | 'completed' | 'error';
  input: any;
  output: any;
  confidence: number;
  processingTime: number;
  suggestions: string[];
}

const AIVideoPipeline: React.FC = () => {
  const [projects, setProjects] = useState<VideoProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<VideoProject | null>(null);
  const [aiEnhancements, setAiEnhancements] = useState<AIEnhancement[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineSettings, setPipelineSettings] = useState({
    autoGenerate: true,
    qualityCheck: true,
    optimization: true,
    smartCaptions: true,
    aiModel: 'gpt-4',
    qualityThreshold: 80
  });

  const defaultStages: PipelineStage[] = [
    {
      id: 'script',
      name: 'Geração de Roteiro',
      status: 'pending',
      progress: 0,
      aiEnhanced: true
    },
    {
      id: 'storyboard',
      name: 'Criação de Storyboard',
      status: 'pending',
      progress: 0,
      aiEnhanced: true
    },
    {
      id: 'assets',
      name: 'Preparação de Assets',
      status: 'pending',
      progress: 0,
      aiEnhanced: false
    },
    {
      id: 'recording',
      name: 'Gravação/Edição',
      status: 'pending',
      progress: 0,
      aiEnhanced: false
    },
    {
      id: 'captions',
      name: 'Geração de Legendas',
      status: 'pending',
      progress: 0,
      aiEnhanced: true
    },
    {
      id: 'quality',
      name: 'Análise de Qualidade',
      status: 'pending',
      progress: 0,
      aiEnhanced: true
    },
    {
      id: 'optimization',
      name: 'Otimização Final',
      status: 'pending',
      progress: 0,
      aiEnhanced: true
    }
  ];

  useEffect(() => {
    loadProjects();
    loadAIEnhancements();
  }, []);

  const loadProjects = async () => {
    try {
      const response = await fetch('/api/videos/projects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar projetos');
      }

      const data = await response.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error('Erro ao carregar projetos:', error);
      // Usar dados mock para demonstração
      setProjects(getMockProjects());
    }
  };

  const loadAIEnhancements = async () => {
    try {
      const response = await fetch('/api/ai/enhancements', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar melhorias IA');
      }

      const data = await response.json();
      setAiEnhancements(data.enhancements || []);
    } catch (error) {
      console.error('Erro ao carregar melhorias IA:', error);
      setAiEnhancements([]);
    }
  };

  const createProject = async (projectData: Partial<VideoProject>) => {
    try {
      const response = await fetch('/api/videos/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...projectData,
          aiSettings: pipelineSettings,
          stages: defaultStages
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao criar projeto');
      }

      const data = await response.json();
      setProjects(prev => [data.project, ...prev]);
      setSelectedProject(data.project);
      toast.success('Projeto criado com sucesso!');
      
      // Iniciar pipeline automaticamente se configurado
      if (pipelineSettings.autoGenerate) {
        startPipeline(data.project.id);
      }
    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto.');
    }
  };

  const startPipeline = async (projectId: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/videos/projects/${projectId}/pipeline/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          aiSettings: pipelineSettings
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao iniciar pipeline');
      }

      toast.success('Pipeline iniciado!');
      
      // Monitorar progresso
      monitorPipelineProgress(projectId);
    } catch (error) {
      console.error('Erro ao iniciar pipeline:', error);
      toast.error('Erro ao iniciar pipeline.');
    } finally {
      setIsProcessing(false);
    }
  };

  const monitorPipelineProgress = async (projectId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/videos/projects/${projectId}/status`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Erro ao verificar status');
        }

        const data = await response.json();
        
        // Atualizar projeto na lista
        setProjects(prev => prev.map(p => 
          p.id === projectId ? { ...p, ...data.project } : p
        ));
        
        // Atualizar projeto selecionado
        if (selectedProject?.id === projectId) {
          setSelectedProject(data.project);
        }
        
        // Parar monitoramento se concluído ou com erro
        if (data.project.status === 'completed' || data.project.status === 'error') {
          clearInterval(interval);
          setIsProcessing(false);
          
          if (data.project.status === 'completed') {
            toast.success('Pipeline concluído com sucesso!');
          } else {
            toast.error('Pipeline finalizado com erros.');
          }
        }
      } catch (error) {
        console.error('Erro ao monitorar progresso:', error);
        clearInterval(interval);
        setIsProcessing(false);
      }
    }, 2000);
  };

  const pausePipeline = async (projectId: string) => {
    try {
      const response = await fetch(`/api/videos/projects/${projectId}/pipeline/pause`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao pausar pipeline');
      }

      toast.success('Pipeline pausado.');
      loadProjects();
    } catch (error) {
      console.error('Erro ao pausar pipeline:', error);
      toast.error('Erro ao pausar pipeline.');
    }
  };

  const retryStage = async (projectId: string, stageId: string) => {
    try {
      const response = await fetch(`/api/videos/projects/${projectId}/stages/${stageId}/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao repetir etapa');
      }

      toast.success('Etapa reiniciada.');
      loadProjects();
    } catch (error) {
      console.error('Erro ao repetir etapa:', error);
      toast.error('Erro ao repetir etapa.');
    }
  };

  const applyAIEnhancement = async (projectId: string, enhancementType: string) => {
    try {
      const response = await fetch(`/api/ai/enhance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          projectId,
          enhancementType,
          settings: pipelineSettings
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao aplicar melhoria IA');
      }

      const data = await response.json();
      setAiEnhancements(prev => [data.enhancement, ...prev]);
      toast.success('Melhoria IA aplicada!');
    } catch (error) {
      console.error('Erro ao aplicar melhoria IA:', error);
      toast.error('Erro ao aplicar melhoria IA.');
    }
  };

  const getStageIcon = (stageId: string) => {
    const icons = {
      script: FileText,
      storyboard: Image,
      assets: Layers,
      recording: FileVideo,
      captions: Mic,
      quality: Eye,
      optimization: Wand2
    };
    const Icon = icons[stageId as keyof typeof icons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getMockProjects = (): VideoProject[] => [
    {
      id: 'project_1',
      title: 'Treinamento NR-35 - Trabalho em Altura',
      description: 'Vídeo educativo sobre segurança em trabalho em altura',
      nrType: 'NR-35',
      status: 'processing',
      createdAt: new Date().toISOString(),
      stages: [
        { id: 'script', name: 'Geração de Roteiro', status: 'completed', progress: 100, aiEnhanced: true },
        { id: 'storyboard', name: 'Criação de Storyboard', status: 'completed', progress: 100, aiEnhanced: true },
        { id: 'assets', name: 'Preparação de Assets', status: 'processing', progress: 60, aiEnhanced: false },
        { id: 'recording', name: 'Gravação/Edição', status: 'pending', progress: 0, aiEnhanced: false },
        { id: 'captions', name: 'Geração de Legendas', status: 'pending', progress: 0, aiEnhanced: true },
        { id: 'quality', name: 'Análise de Qualidade', status: 'pending', progress: 0, aiEnhanced: true },
        { id: 'optimization', name: 'Otimização Final', status: 'pending', progress: 0, aiEnhanced: true }
      ],
      aiSettings: {
        autoGenerate: true,
        qualityCheck: true,
        optimization: true,
        smartCaptions: true
      },
      metadata: {
        duration: 0,
        resolution: '1920x1080',
        format: 'mp4'
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pipeline de Vídeo com IA</h2>
          <p className="text-gray-600">Produção automatizada de conteúdo educativo</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => createProject({
              title: 'Novo Projeto',
              description: 'Projeto criado automaticamente',
              nrType: 'NR-35'
            })}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Novo Projeto IA
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Configurações do Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Configurações de IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={pipelineSettings.autoGenerate}
                onChange={(e) => setPipelineSettings(prev => ({ ...prev, autoGenerate: e.target.checked }))}
              />
              <span className="text-sm">Auto-geração</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={pipelineSettings.qualityCheck}
                onChange={(e) => setPipelineSettings(prev => ({ ...prev, qualityCheck: e.target.checked }))}
              />
              <span className="text-sm">Verificação de Qualidade</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={pipelineSettings.optimization}
                onChange={(e) => setPipelineSettings(prev => ({ ...prev, optimization: e.target.checked }))}
              />
              <span className="text-sm">Otimização IA</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={pipelineSettings.smartCaptions}
                onChange={(e) => setPipelineSettings(prev => ({ ...prev, smartCaptions: e.target.checked }))}
              />
              <span className="text-sm">Legendas Inteligentes</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projetos</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="enhancements">Melhorias IA</TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card key={project.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedProject(project)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{project.title}</h3>
                    <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                      {project.status}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{project.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso Geral</span>
                      <span>{Math.round(project.stages.reduce((sum, stage) => sum + stage.progress, 0) / project.stages.length)}%</span>
                    </div>
                    <Progress 
                      value={project.stages.reduce((sum, stage) => sum + stage.progress, 0) / project.stages.length} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-3">
                    <Badge variant="outline">{project.nrType}</Badge>
                    <div className="flex items-center gap-1">
                      {project.aiSettings.autoGenerate && <Brain className="h-3 w-3 text-blue-600" />}
                      {project.aiSettings.qualityCheck && <Target className="h-3 w-3 text-green-600" />}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          {selectedProject ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{selectedProject.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedProject.status === 'processing' ? (
                      <Button 
                        onClick={() => pausePipeline(selectedProject.id)}
                        variant="outline" 
                        size="sm"
                      >
                        <Pause className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button 
                        onClick={() => startPipeline(selectedProject.id)}
                        size="sm"
                        disabled={isProcessing}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedProject.stages.map((stage, index) => (
                    <div key={stage.id} className="flex items-center gap-4 p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getStageIcon(stage.id)}
                        <span className="font-medium">{stage.name}</span>
                        {stage.aiEnhanced && <Brain className="h-3 w-3 text-blue-600" />}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-sm ${getStatusColor(stage.status)}`}>
                            {stage.status}
                          </span>
                          <span className="text-sm">{stage.progress}%</span>
                        </div>
                        <Progress value={stage.progress} className="h-2" />
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {getStatusIcon(stage.status)}
                        {stage.status === 'error' && (
                          <Button 
                            onClick={() => retryStage(selectedProject.id, stage.id)}
                            variant="outline" 
                            size="sm"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Selecione um projeto para visualizar o pipeline</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="enhancements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Melhorias Disponíveis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {['script', 'storyboard', 'captions', 'optimization'].map((type) => (
                  <Button
                    key={type}
                    onClick={() => selectedProject && applyAIEnhancement(selectedProject.id, type)}
                    variant="outline"
                    className="w-full justify-start"
                    disabled={!selectedProject}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    Melhorar {type}
                  </Button>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Histórico de Melhorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiEnhancements.slice(0, 5).map((enhancement) => (
                    <div key={enhancement.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm font-medium">{enhancement.type}</p>
                        <p className="text-xs text-gray-600">
                          Confiança: {(enhancement.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                      <Badge variant={enhancement.status === 'completed' ? 'default' : 'secondary'}>
                        {enhancement.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AIVideoPipeline;