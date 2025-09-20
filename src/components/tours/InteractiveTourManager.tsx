import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Activity,
  BarChart3,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit,
  Eye,
  EyeOff,
  FileText,
  Filter,
  Gamepad2,
  HelpCircle,
  Loader2,
  MapPin,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  SkipForward,
  Star,
  Target,
  Trash2,
  TrendingUp,
  Upload,
  User,
  Users,
  X,
  Zap,
  Award,
  Calendar,
  CheckCircle,
  Circle,
  PlayCircle,
  StopCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useInteractiveTour, Tour, TourStep, TourProgress } from '@/hooks/useInteractiveTour';

interface InteractiveTourManagerProps {
  className?: string;
  onClose?: () => void;
}

const InteractiveTourManager: React.FC<InteractiveTourManagerProps> = ({
  className,
  onClose
}) => {
  const { state, actions, utils } = useInteractiveTour({
    enableAnalytics: true,
    enableKeyboardNavigation: true,
    enableVoiceOver: true,
    autoSave: true,
    onTourStart: (tour) => {
      toast.success(`Tour "${tour.name}" iniciado`);
    },
    onTourComplete: (tour, progress) => {
      toast.success(`Tour "${tour.name}" concluído em ${Math.round(progress.timeSpent / 60)} minutos!`);
    },
    onStepChange: (step, stepIndex) => {
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTour, setSelectedTour] = useState<Tour | null>(null);
  const [isCreatingTour, setIsCreatingTour] = useState(false);
  const [isEditingTour, setIsEditingTour] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [newTour, setNewTour] = useState<Partial<Tour>>({
    name: '',
    description: '',
    category: 'feature',
    difficulty: 'beginner',
    estimatedTime: 5,
    steps: [],
    tags: [],
    version: '1.0.0',
    author: 'Studio Treiax',
    lastUpdated: new Date(),
    isActive: true,
    repeatable: false
  });
  const [newStep, setNewStep] = useState<Partial<TourStep>>({
    title: '',
    content: '',
    target: '',
    position: 'bottom',
    skippable: true,
    required: false,
    highlight: true,
    animation: 'fade',
    autoAdvance: false
  });
  const [showStepEditor, setShowStepEditor] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  // Dados para gráficos
  const categoryData = [
    { name: 'Onboarding', value: state.availableTours.filter(t => t.category === 'onboarding').length, color: '#3b82f6' },
    { name: 'Features', value: state.availableTours.filter(t => t.category === 'feature').length, color: '#10b981' },
    { name: 'Avançado', value: state.availableTours.filter(t => t.category === 'advanced').length, color: '#f59e0b' },
    { name: 'Troubleshooting', value: state.availableTours.filter(t => t.category === 'troubleshooting').length, color: '#ef4444' }
  ];

  const completionData = Array.from(state.progress.entries()).map(([tourId, progress]) => {
    const tour = state.availableTours.find(t => t.id === tourId);
    return {
      name: tour?.name || tourId,
      completed: progress.completedSteps.length,
      total: tour?.steps.length || 0,
      percentage: tour ? (progress.completedSteps.length / tour.steps.length) * 100 : 0,
      timeSpent: progress.timeSpent / 60 // em minutos
    };
  });

  // Filtrar tours
  const filteredTours = state.availableTours.filter(tour => {
    const matchesSearch = tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tour.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tour.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || tour.category === filterCategory;
    const matchesDifficulty = filterDifficulty === 'all' || tour.difficulty === filterDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Função para obter cor da categoria
  const getCategoryColor = (category: Tour['category']): string => {
    const colors = {
      onboarding: 'bg-blue-100 text-blue-800',
      feature: 'bg-green-100 text-green-800',
      advanced: 'bg-yellow-100 text-yellow-800',
      troubleshooting: 'bg-red-100 text-red-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  // Função para obter cor da dificuldade
  const getDifficultyColor = (difficulty: Tour['difficulty']): string => {
    const colors = {
      beginner: 'bg-green-100 text-green-800',
      intermediate: 'bg-yellow-100 text-yellow-800',
      advanced: 'bg-red-100 text-red-800'
    };
    return colors[difficulty] || 'bg-gray-100 text-gray-800';
  };

  // Função para obter ícone da categoria
  const getCategoryIcon = (category: Tour['category']) => {
    const icons = {
      onboarding: <User className="h-4 w-4" />,
      feature: <Zap className="h-4 w-4" />,
      advanced: <Target className="h-4 w-4" />,
      troubleshooting: <HelpCircle className="h-4 w-4" />
    };
    return icons[category] || <BookOpen className="h-4 w-4" />;
  };

  // Função para criar tour
  const handleCreateTour = useCallback(() => {
    if (!newTour.name || !newTour.description || !newTour.steps?.length) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const tour: Tour = {
      id: `tour_${Date.now()}`,
      name: newTour.name,
      description: newTour.description,
      category: newTour.category as Tour['category'],
      difficulty: newTour.difficulty as Tour['difficulty'],
      estimatedTime: newTour.estimatedTime || 5,
      steps: newTour.steps as TourStep[],
      tags: newTour.tags || [],
      version: newTour.version || '1.0.0',
      author: newTour.author || 'Studio Treiax',
      lastUpdated: new Date(),
      isActive: newTour.isActive !== false,
      repeatable: newTour.repeatable || false
    };

    actions.addTour(tour);
    setIsCreatingTour(false);
    setNewTour({
      name: '',
      description: '',
      category: 'feature',
      difficulty: 'beginner',
      estimatedTime: 5,
      steps: [],
      tags: [],
      version: '1.0.0',
      author: 'Studio Treiax',
      lastUpdated: new Date(),
      isActive: true,
      repeatable: false
    });
  }, [newTour, actions]);

  // Função para adicionar passo
  const handleAddStep = useCallback(() => {
    if (!newStep.title || !newStep.content || !newStep.target) {
      toast.error('Preencha todos os campos obrigatórios do passo');
      return;
    }

    const step: TourStep = {
      id: `step_${Date.now()}`,
      title: newStep.title,
      content: newStep.content,
      target: newStep.target,
      position: newStep.position || 'bottom',
      skippable: newStep.skippable !== false,
      required: newStep.required || false,
      highlight: newStep.highlight !== false,
      animation: newStep.animation || 'fade',
      autoAdvance: newStep.autoAdvance || false,
      delay: newStep.delay,
      actionDuration: newStep.actionDuration,
      action: newStep.action,
      conditions: newStep.conditions,
      media: newStep.media,
      interactive: newStep.interactive
    };

    if (editingStepIndex !== null) {
      // Editando passo existente
      const updatedSteps = [...(newTour.steps || [])];
      updatedSteps[editingStepIndex] = step;
      setNewTour(prev => ({ ...prev, steps: updatedSteps }));
      setEditingStepIndex(null);
      toast.success('Passo atualizado');
    } else {
      // Adicionando novo passo
      setNewTour(prev => ({
        ...prev,
        steps: [...(prev.steps || []), step]
      }));
      toast.success('Passo adicionado');
    }

    setNewStep({
      title: '',
      content: '',
      target: '',
      position: 'bottom',
      skippable: true,
      required: false,
      highlight: true,
      animation: 'fade',
      autoAdvance: false
    });
    setShowStepEditor(false);
  }, [newStep, newTour.steps, editingStepIndex]);

  // Função para editar passo
  const handleEditStep = useCallback((stepIndex: number) => {
    const step = newTour.steps?.[stepIndex];
    if (step) {
      setNewStep(step);
      setEditingStepIndex(stepIndex);
      setShowStepEditor(true);
    }
  }, [newTour.steps]);

  // Função para remover passo
  const handleRemoveStep = useCallback((stepIndex: number) => {
    const updatedSteps = [...(newTour.steps || [])];
    updatedSteps.splice(stepIndex, 1);
    setNewTour(prev => ({ ...prev, steps: updatedSteps }));
    toast.success('Passo removido');
  }, [newTour.steps]);

  // Função para exportar dados
  const handleExportData = useCallback(() => {
    const data = actions.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tours-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [actions]);

  // Função para importar dados
  const handleImportData = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      actions.importData(content);
    };
    reader.readAsText(file);
  }, [actions]);

  // Componente do Dashboard
  const DashboardSection = () => (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Tours</p>
                <p className="text-2xl font-bold">{state.availableTours.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tours Concluídos</p>
                <p className="text-2xl font-bold text-green-600">{state.completedTours.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(state.analytics.averageCompletionTime / 60)}min
                </p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-purple-600">
                  {state.analytics.totalToursStarted > 0 
                    ? Math.round((state.analytics.totalToursCompleted / state.analytics.totalToursStarted) * 100)
                    : 0}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status do Tour Ativo */}
      {state.activeTour && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tour Ativo: {state.activeTour.name}</span>
              <div className="flex items-center gap-2">
                {state.isPaused ? (
                  <Button size="sm" onClick={actions.resumeTour}>
                    <Play className="h-4 w-4 mr-2" />
                    Continuar
                  </Button>
                ) : (
                  <Button size="sm" onClick={actions.pauseTour}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                )}
                <Button size="sm" variant="outline" onClick={actions.stopTour}>
                  <StopCircle className="h-4 w-4 mr-2" />
                  Parar
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Progresso</span>
                <span className="text-sm font-medium">
                  {state.currentStep + 1} de {state.activeTour.steps.length}
                </span>
              </div>
              <Progress 
                value={((state.currentStep + 1) / state.activeTour.steps.length) * 100} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Passo atual: {state.activeTour.steps[state.currentStep]?.title}</span>
                <span>
                  {state.isPlaying ? (
                    state.isPaused ? 'Pausado' : 'Em andamento'
                  ) : 'Parado'}
                </span>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={actions.previousStep}
                  disabled={state.currentStep === 0}
                >
                  Anterior
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={actions.skipStep}
                >
                  <SkipForward className="h-4 w-4 mr-2" />
                  Pular
                </Button>
                <Button 
                  size="sm" 
                  onClick={actions.nextStep}
                >
                  Próximo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tours por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {categoryData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">{entry.name}</span>
                  </div>
                  <span className="text-sm font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Progresso dos Tours</CardTitle>
          </CardHeader>
          <CardContent>
            {completionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <BarChart3 className="h-8 w-8 mx-auto mb-2" />
                Nenhum progresso registrado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tours Recomendados */}
      <Card>
        <CardHeader>
          <CardTitle>Tours Recomendados</CardTitle>
          <CardDescription>
            Baseado no seu progresso e preferências
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {utils.getRecommendedTours().map((tour) => (
              <Card key={tour.id} className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTour(tour)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(tour.category)}
                      <h4 className="font-medium">{tour.name}</h4>
                    </div>
                    <Badge className={getCategoryColor(tour.category)}>
                      {tour.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {tour.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{tour.estimatedTime} min</span>
                    <span>{tour.steps.length} passos</span>
                    <Badge className={getDifficultyColor(tour.difficulty)} variant="outline">
                      {tour.difficulty}
                    </Badge>
                  </div>
                  
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.startTour(tour);
                    }}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Iniciar Tour
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {utils.getRecommendedTours().length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Award className="h-8 w-8 mx-auto mb-2" />
              Parabéns! Você completou todos os tours disponíveis.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Componente da Biblioteca de Tours
  const LibrarySection = () => (
    <div className="space-y-6">
      {/* Filtros e Busca */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar tours..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="feature">Features</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
                <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="beginner">Iniciante</SelectItem>
                <SelectItem value="intermediate">Intermediário</SelectItem>
                <SelectItem value="advanced">Avançado</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={() => setIsCreatingTour(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Tour
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tours */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTours.map((tour) => {
          const progress = state.progress.get(tour.id);
          const isCompleted = state.completedTours.includes(tour.id);
          const completionPercentage = progress 
            ? (progress.completedSteps.length / tour.steps.length) * 100 
            : 0;

          return (
            <Card key={tour.id} className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedTour(tour)}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(tour.category)}
                    <h3 className="font-semibold">{tour.name}</h3>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {!tour.isActive && <EyeOff className="h-4 w-4 text-gray-400" />}
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {tour.description}
                </p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={getCategoryColor(tour.category)}>
                    {tour.category}
                  </Badge>
                  <Badge className={getDifficultyColor(tour.difficulty)} variant="outline">
                    {tour.difficulty}
                  </Badge>
                  {tour.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                {progress && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Progresso</span>
                      <span>{Math.round(completionPercentage)}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {tour.estimatedTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {tour.steps.length} passos
                    </span>
                  </div>
                  
                  {tour.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{tour.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.startTour(tour);
                    }}
                    disabled={!tour.isActive}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    {isCompleted && tour.repeatable ? 'Repetir' : 'Iniciar'}
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTour(tour);
                      setIsEditingTour(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.removeTour(tour.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {filteredTours.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Nenhum tour encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Tente ajustar os filtros ou criar um novo tour.
            </p>
            <Button onClick={() => setIsCreatingTour(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Tour
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Componente de Configurações
  const SettingsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações dos Tours
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Preferências do Usuário */}
        <div>
          <h4 className="text-sm font-medium mb-4">Preferências</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto-play">Reprodução Automática</Label>
              <Switch
                id="auto-play"
                checked={state.userPreferences.autoPlay}
                onCheckedChange={(checked) => 
                  actions.updatePreferences({ autoPlay: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="show-hints">Mostrar Dicas</Label>
              <Switch
                id="show-hints"
                checked={state.userPreferences.showHints}
                onCheckedChange={(checked) => 
                  actions.updatePreferences({ showHints: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="skip-intro">Pular Introdução</Label>
              <Switch
                id="skip-intro"
                checked={state.userPreferences.skipIntro}
                onCheckedChange={(checked) => 
                  actions.updatePreferences({ skipIntro: checked })
                }
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="sound-enabled">Som Habilitado</Label>
              <Switch
                id="sound-enabled"
                checked={state.userPreferences.soundEnabled}
                onCheckedChange={(checked) => 
                  actions.updatePreferences({ soundEnabled: checked })
                }
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Velocidade de Animação */}
        <div>
          <Label htmlFor="animation-speed">Velocidade de Animação</Label>
          <Select 
            value={state.userPreferences.animationSpeed} 
            onValueChange={(value: 'slow' | 'normal' | 'fast') => 
              actions.updatePreferences({ animationSpeed: value })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="slow">Lenta</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="fast">Rápida</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Estilo de Destaque */}
        <div>
          <Label htmlFor="highlight-style">Estilo de Destaque</Label>
          <Select 
            value={state.userPreferences.highlightStyle} 
            onValueChange={(value: 'subtle' | 'normal' | 'bold') => 
              actions.updatePreferences({ highlightStyle: value })
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="subtle">Sutil</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="bold">Destacado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        {/* Ações */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
          
          <Button variant="outline" asChild>
            <label>
              <Upload className="h-4 w-4 mr-2" />
              Importar Dados
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              if (confirm('Tem certeza que deseja resetar todo o progresso?')) {
                actions.resetProgress();
              }
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar Progresso
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`} data-tour-container>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gerenciador de Tours Interativos</h2>
          <p className="text-muted-foreground">
            Crie, gerencie e execute tours interativos para guiar os usuários
          </p>
        </div>
        <div className="flex items-center gap-2">
          {state.activeTour && (
            <Badge variant="outline" className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Tour Ativo
            </Badge>
          )}
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="library">Biblioteca</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <DashboardSection />
        </TabsContent>

        <TabsContent value="library">
          <LibrarySection />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsSection />
        </TabsContent>
      </Tabs>

      {/* Dialog para Criar/Editar Tour */}
      <Dialog open={isCreatingTour || isEditingTour} onOpenChange={(open) => {
        if (!open) {
          setIsCreatingTour(false);
          setIsEditingTour(false);
          setSelectedTour(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditingTour ? 'Editar Tour' : 'Criar Novo Tour'}
            </DialogTitle>
            <DialogDescription>
              Configure as informações básicas e os passos do tour.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tour-name">Nome do Tour *</Label>
                <Input
                  id="tour-name"
                  value={newTour.name}
                  onChange={(e) => setNewTour(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do tour"
                />
              </div>
              
              <div>
                <Label htmlFor="tour-category">Categoria</Label>
                <Select 
                  value={newTour.category} 
                  onValueChange={(value: Tour['category']) => 
                    setNewTour(prev => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                    <SelectItem value="troubleshooting">Troubleshooting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="tour-difficulty">Dificuldade</Label>
                <Select 
                  value={newTour.difficulty} 
                  onValueChange={(value: Tour['difficulty']) => 
                    setNewTour(prev => ({ ...prev, difficulty: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Iniciante</SelectItem>
                    <SelectItem value="intermediate">Intermediário</SelectItem>
                    <SelectItem value="advanced">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="tour-time">Tempo Estimado (min)</Label>
                <Input
                  id="tour-time"
                  type="number"
                  value={newTour.estimatedTime}
                  onChange={(e) => setNewTour(prev => ({ ...prev, estimatedTime: parseInt(e.target.value) || 5 }))}
                  min="1"
                  max="120"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="tour-description">Descrição *</Label>
              <Textarea
                id="tour-description"
                value={newTour.description}
                onChange={(e) => setNewTour(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o objetivo e conteúdo do tour"
                rows={3}
              />
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="tour-active"
                  checked={newTour.isActive}
                  onCheckedChange={(checked) => setNewTour(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="tour-active">Tour Ativo</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="tour-repeatable"
                  checked={newTour.repeatable}
                  onCheckedChange={(checked) => setNewTour(prev => ({ ...prev, repeatable: checked }))}
                />
                <Label htmlFor="tour-repeatable">Repetível</Label>
              </div>
            </div>
            
            {/* Passos do Tour */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium">Passos do Tour</h4>
                <Button onClick={() => setShowStepEditor(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Passo
                </Button>
              </div>
              
              {newTour.steps && newTour.steps.length > 0 ? (
                <div className="space-y-2">
                  {newTour.steps.map((step, index) => (
                    <div key={step.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{index + 1}. {step.title}</h5>
                          <p className="text-sm text-muted-foreground">{step.content}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{step.target}</Badge>
                            <Badge variant="outline">{step.position}</Badge>
                            {step.required && <Badge variant="destructive">Obrigatório</Badge>}
                            {step.skippable && <Badge variant="secondary">Pulável</Badge>}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditStep(index)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveStep(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8 border-2 border-dashed rounded-lg">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  Nenhum passo adicionado ainda
                </div>
              )}
            </div>
            
            {/* Botões de Ação */}
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreatingTour(false);
                  setIsEditingTour(false);
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleCreateTour}>
                {isEditingTour ? 'Salvar Alterações' : 'Criar Tour'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog para Adicionar/Editar Passo */}
      <Dialog open={showStepEditor} onOpenChange={setShowStepEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingStepIndex !== null ? 'Editar Passo' : 'Adicionar Passo'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="step-title">Título *</Label>
                <Input
                  id="step-title"
                  value={newStep.title}
                  onChange={(e) => setNewStep(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Título do passo"
                />
              </div>
              
              <div>
                <Label htmlFor="step-target">Seletor CSS *</Label>
                <Input
                  id="step-target"
                  value={newStep.target}
                  onChange={(e) => setNewStep(prev => ({ ...prev, target: e.target.value }))}
                  placeholder="#id, .class, [data-attr]"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="step-content">Conteúdo *</Label>
              <Textarea
                id="step-content"
                value={newStep.content}
                onChange={(e) => setNewStep(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Descrição do que o usuário deve fazer"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="step-position">Posição</Label>
                <Select 
                  value={newStep.position} 
                  onValueChange={(value: TourStep['position']) => 
                    setNewStep(prev => ({ ...prev, position: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Acima</SelectItem>
                    <SelectItem value="bottom">Abaixo</SelectItem>
                    <SelectItem value="left">Esquerda</SelectItem>
                    <SelectItem value="right">Direita</SelectItem>
                    <SelectItem value="center">Centro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="step-animation">Animação</Label>
                <Select 
                  value={newStep.animation} 
                  onValueChange={(value: TourStep['animation']) => 
                    setNewStep(prev => ({ ...prev, animation: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fade">Fade</SelectItem>
                    <SelectItem value="slide">Slide</SelectItem>
                    <SelectItem value="bounce">Bounce</SelectItem>
                    <SelectItem value="pulse">Pulse</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="step-skippable"
                  checked={newStep.skippable}
                  onCheckedChange={(checked) => setNewStep(prev => ({ ...prev, skippable: checked }))}
                />
                <Label htmlFor="step-skippable">Pulável</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="step-required"
                  checked={newStep.required}
                  onCheckedChange={(checked) => setNewStep(prev => ({ ...prev, required: checked }))}
                />
                <Label htmlFor="step-required">Obrigatório</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="step-highlight"
                  checked={newStep.highlight}
                  onCheckedChange={(checked) => setNewStep(prev => ({ ...prev, highlight: checked }))}
                />
                <Label htmlFor="step-highlight">Destacar</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="step-auto-advance"
                  checked={newStep.autoAdvance}
                  onCheckedChange={(checked) => setNewStep(prev => ({ ...prev, autoAdvance: checked }))}
                />
                <Label htmlFor="step-auto-advance">Avançar Auto</Label>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowStepEditor(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddStep}>
                {editingStepIndex !== null ? 'Salvar Passo' : 'Adicionar Passo'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InteractiveTourManager;