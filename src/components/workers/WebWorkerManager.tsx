import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  Download,
  FileVideo,
  Image,
  Loader2,
  Music,
  Pause,
  Play,
  Plus,
  Settings,
  Square,
  Trash2,
  Users,
  X,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { useWebWorkers, WorkerTask, VideoProcessingTask, VideoOperation } from '@/hooks/useWebWorkers';

interface WebWorkerManagerProps {
  className?: string;
  onClose?: () => void;
}

const WebWorkerManager: React.FC<WebWorkerManagerProps> = ({ className, onClose }) => {
  const { state, config, actions } = useWebWorkers();
  const [activeTab, setActiveTab] = useState('overview');
  const [showSettings, setShowSettings] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [videoOperations, setVideoOperations] = useState<VideoOperation[]>([]);
  const [processingTasks, setProcessingTasks] = useState<Map<string, number>>(new Map());
  const [newOperation, setNewOperation] = useState<Partial<VideoOperation>>({});
  const [showAddOperation, setShowAddOperation] = useState(false);

  // Função para formatar tempo
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  // Função para formatar bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Função para obter cor baseada no status
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      case 'queued': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  // Função para obter ícone do tipo de worker
  const getWorkerIcon = (type: string) => {
    switch (type) {
      case 'video': return <FileVideo className="h-4 w-4" />;
      case 'image': return <Image className="h-4 w-4" />;
      case 'audio': return <Music className="h-4 w-4" />;
      case 'data': return <Cpu className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  // Função para processar vídeo
  const handleVideoProcessing = async () => {
    if (!selectedFile) {
      toast.error('Selecione um arquivo de vídeo');
      return;
    }

    if (videoOperations.length === 0) {
      toast.error('Adicione pelo menos uma operação');
      return;
    }

    const taskId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const videoTask: VideoProcessingTask = {
      id: taskId,
      file: selectedFile,
      operations: videoOperations,
      outputFormat: 'mp4',
      quality: 'high'
    };

    try {
      setProcessingTasks(prev => new Map(prev.set(taskId, 0)));
      
      const result = await actions.processVideo(videoTask);
      
      setProcessingTasks(prev => {
        const newMap = new Map(prev);
        newMap.delete(taskId);
        return newMap;
      });
      
      toast.success('Vídeo processado com sucesso!');
      
      // Download do resultado
      const a = document.createElement('a');
      a.href = result;
      a.download = `processed-${selectedFile.name}`;
      a.click();
      
    } catch (error) {
      setProcessingTasks(prev => {
        const newMap = new Map(prev);
        newMap.delete(taskId);
        return newMap;
      });
      
      toast.error(`Erro no processamento: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Função para adicionar operação de vídeo
  const handleAddOperation = () => {
    if (!newOperation.type) {
      toast.error('Selecione o tipo de operação');
      return;
    }

    const operation: VideoOperation = {
      type: newOperation.type as any,
      params: newOperation.params || {},
      timestamp: newOperation.timestamp
    };

    setVideoOperations(prev => [...prev, operation]);
    setNewOperation({});
    setShowAddOperation(false);
    toast.success('Operação adicionada!');
  };

  // Função para remover operação
  const removeOperation = (index: number) => {
    setVideoOperations(prev => prev.filter((_, i) => i !== index));
  };

  // Componente de visão geral
  const OverviewSection = () => {
    const stats = actions.getStats();
    
    return (
      <div className="space-y-6">
        {/* Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalWorkers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.busyWorkers} ocupados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tarefas na Fila</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.queuedTasks}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando processamento
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completedTasks}</div>
              <p className="text-xs text-muted-foreground">
                Taxa de sucesso: {stats.successRate.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Falharam</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.failedTasks}</div>
              <p className="text-xs text-muted-foreground">
                Requer atenção
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Status dos Pools */}
        <Card>
          <CardHeader>
            <CardTitle>Status dos Pools de Workers</CardTitle>
            <CardDescription>
              {stats.totalPools} pool(s) ativo(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pools.map((pool) => (
                <div key={pool.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getWorkerIcon(pool.id)}
                      <h4 className="font-medium">{pool.name}</h4>
                      <Badge variant="outline">{pool.workers} workers</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={pool.activeTasks > 0 ? "default" : "secondary"}>
                        {pool.activeTasks} ativas
                      </Badge>
                      <Badge variant="outline">
                        {pool.queuedTasks} na fila
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="font-medium">{pool.stats.totalTasks}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Concluídas</div>
                      <div className="font-medium text-green-600">{pool.stats.completedTasks}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Falharam</div>
                      <div className="font-medium text-red-600">{pool.stats.failedTasks}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Última Atividade</div>
                      <div className="font-medium">
                        {pool.stats.lastActivity ? 
                          pool.stats.lastActivity.toLocaleTimeString() : 
                          'Nunca'
                        }
                      </div>
                    </div>
                  </div>
                  
                  {pool.workers > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Utilização</span>
                        <span>{((pool.activeTasks / pool.workers) * 100).toFixed(0)}%</span>
                      </div>
                      <Progress value={(pool.activeTasks / pool.workers) * 100} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Performance */}
        {stats.completedTasks > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Tarefas por Pool</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.pools.map(pool => ({
                      name: pool.name,
                      value: pool.stats.completedTasks,
                      fill: pool.id === 'video' ? '#8884d8' :
                            pool.id === 'image' ? '#82ca9d' :
                            pool.id === 'audio' ? '#ffc658' : '#ff7300'
                    }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.pools.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#8884d8', '#82ca9d', '#ffc658', '#ff7300'
                      ][index % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Componente de processamento de vídeo
  const VideoProcessingSection = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileVideo className="h-5 w-5" />
            Processamento de Vídeo
          </CardTitle>
          <CardDescription>
            Processe vídeos com operações avançadas usando Web Workers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seleção de Arquivo */}
          <div>
            <Label htmlFor="video-file">Arquivo de Vídeo</Label>
            <Input
              id="video-file"
              type="file"
              accept="video/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setSelectedFile(file);
                  toast.success(`Arquivo selecionado: ${file.name}`);
                }
              }}
            />
            {selectedFile && (
              <div className="mt-2 text-sm text-muted-foreground">
                {selectedFile.name} ({formatBytes(selectedFile.size)})
              </div>
            )}
          </div>

          {/* Operações */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Operações</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddOperation(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </div>

            {showAddOperation && (
              <div className="p-3 border rounded-lg mb-3 bg-muted/50">
                <h4 className="font-medium mb-3">Nova Operação</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="operation-type">Tipo</Label>
                    <Select
                      value={newOperation.type || ''}
                      onValueChange={(value) => setNewOperation(prev => ({ ...prev, type: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="trim">Cortar</SelectItem>
                        <SelectItem value="resize">Redimensionar</SelectItem>
                        <SelectItem value="filter">Filtro</SelectItem>
                        <SelectItem value="overlay">Sobreposição</SelectItem>
                        <SelectItem value="audio">Áudio</SelectItem>
                        <SelectItem value="transition">Transição</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newOperation.type === 'trim' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="start-time">Início (s)</Label>
                        <Input
                          id="start-time"
                          type="number"
                          placeholder="0"
                          onChange={(e) => setNewOperation(prev => ({
                            ...prev,
                            params: { ...prev.params, start: parseFloat(e.target.value) || 0 }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-time">Fim (s)</Label>
                        <Input
                          id="end-time"
                          type="number"
                          placeholder="10"
                          onChange={(e) => setNewOperation(prev => ({
                            ...prev,
                            params: { ...prev.params, end: parseFloat(e.target.value) || 10 }
                          }))}
                        />
                      </div>
                    </div>
                  )}

                  {newOperation.type === 'resize' && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label htmlFor="width">Largura</Label>
                        <Input
                          id="width"
                          type="number"
                          placeholder="1920"
                          onChange={(e) => setNewOperation(prev => ({
                            ...prev,
                            params: { ...prev.params, width: parseInt(e.target.value) || 1920 }
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="height">Altura</Label>
                        <Input
                          id="height"
                          type="number"
                          placeholder="1080"
                          onChange={(e) => setNewOperation(prev => ({
                            ...prev,
                            params: { ...prev.params, height: parseInt(e.target.value) || 1080 }
                          }))}
                        />
                      </div>
                    </div>
                  )}

                  {newOperation.type === 'filter' && (
                    <div>
                      <Label htmlFor="filter-type">Filtro</Label>
                      <Select
                        onValueChange={(value) => setNewOperation(prev => ({
                          ...prev,
                          params: { ...prev.params, filter: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o filtro" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="blur">Desfoque</SelectItem>
                          <SelectItem value="brightness">Brilho</SelectItem>
                          <SelectItem value="contrast">Contraste</SelectItem>
                          <SelectItem value="saturation">Saturação</SelectItem>
                          <SelectItem value="sepia">Sépia</SelectItem>
                          <SelectItem value="grayscale">Escala de Cinza</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleAddOperation} size="sm">
                      Adicionar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowAddOperation(false);
                        setNewOperation({});
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <ScrollArea className="h-48">
              <div className="space-y-2">
                {videoOperations.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <FileVideo className="h-8 w-8 mx-auto mb-2" />
                    Nenhuma operação adicionada
                  </div>
                ) : (
                  videoOperations.map((operation, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium capitalize">{operation.type}</h4>
                          <div className="text-sm text-muted-foreground">
                            {JSON.stringify(operation.params)}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOperation(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Botão de Processamento */}
          <Button
            onClick={handleVideoProcessing}
            disabled={!selectedFile || videoOperations.length === 0 || processingTasks.size > 0}
            className="w-full"
          >
            {processingTasks.size > 0 ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Processar Vídeo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Tarefas em Processamento */}
      {processingTasks.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Tarefas em Processamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(processingTasks.entries()).map(([taskId, progress]) => (
                <div key={taskId} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tarefa {taskId.split('-')[1]}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Componente de tarefas ativas
  const ActiveTasksSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Tarefas Ativas
        </CardTitle>
        <CardDescription>
          {state.activeTasks.size} tarefa(s) em execução
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          {state.activeTasks.size === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Activity className="h-8 w-8 mx-auto mb-2" />
              Nenhuma tarefa ativa
            </div>
          ) : (
            <div className="space-y-3">
              {Array.from(state.activeTasks.entries()).map(([taskId, task]) => (
                <div key={taskId} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getWorkerIcon(task.type.split('-')[0])}
                      <h4 className="font-medium">{task.id}</h4>
                      <Badge variant="outline">{task.type}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={task.priority === 'critical' ? 'destructive' : 
                                   task.priority === 'high' ? 'default' : 'secondary'}>
                        {task.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => actions.cancelTask(taskId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    Timeout: {task.timeout ? formatTime(task.timeout) : 'Sem limite'}
                  </div>
                  
                  {task.retries !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      Tentativas restantes: {task.retries}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );

  // Componente de configurações
  const SettingsPanel = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Web Workers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="max-workers">Máximo de Workers por Pool</Label>
          <Input
            id="max-workers"
            type="number"
            value={config.maxWorkersPerPool}
            onChange={(e) => actions.updateConfig({ maxWorkersPerPool: parseInt(e.target.value) || 4 })}
            min="1"
            max="16"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="task-timeout">Timeout de Tarefa (ms)</Label>
          <Input
            id="task-timeout"
            type="number"
            value={config.taskTimeout}
            onChange={(e) => actions.updateConfig({ taskTimeout: parseInt(e.target.value) || 300000 })}
            min="1000"
            max="3600000"
            step="1000"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="max-retries">Máximo de Tentativas</Label>
          <Input
            id="max-retries"
            type="number"
            value={config.maxRetries}
            onChange={(e) => actions.updateConfig({ maxRetries: parseInt(e.target.value) || 3 })}
            min="0"
            max="10"
          />
        </div>
        
        <Separator />
        
        <div className="flex items-center justify-between">
          <Label htmlFor="enable-logging">Logging</Label>
          <Switch
            id="enable-logging"
            checked={config.enableLogging}
            onCheckedChange={(checked) => actions.updateConfig({ enableLogging: checked })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-scaling">Auto Scaling</Label>
          <Switch
            id="auto-scaling"
            checked={config.autoScaling}
            onCheckedChange={(checked) => actions.updateConfig({ autoScaling: checked })}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="priority-queuing">Fila por Prioridade</Label>
          <Switch
            id="priority-queuing"
            checked={config.priorityQueuing}
            onCheckedChange={(checked) => actions.updateConfig({ priorityQueuing: checked })}
          />
        </div>
        
        <Separator />
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const stats = actions.getStats();
              const data = JSON.stringify(stats, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `worker-stats-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Stats
          </Button>
          
          <Button
            variant="destructive"
            onClick={() => {
              actions.cleanup();
              toast.success('Workers limpos!');
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Tudo
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Web Worker Manager</h2>
          <p className="text-muted-foreground">
            Gerenciamento avançado de Web Workers para processamento em background
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center gap-4">
        <Badge variant={state.isSupported ? "default" : "destructive"}>
          {state.isSupported ? 'Suportado' : 'Não Suportado'}
        </Badge>
        {state.lastUpdate && (
          <span className="text-sm text-muted-foreground">
            Última atualização: {state.lastUpdate.toLocaleTimeString()}
          </span>
        )}
        {state.busyWorkers > 0 && (
          <Badge variant="default">
            {state.busyWorkers} worker(s) ocupado(s)
          </Badge>
        )}
      </div>

      {/* Configurações (se visível) */}
      {showSettings && <SettingsPanel />}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="video">Processamento</TabsTrigger>
          <TabsTrigger value="tasks">Tarefas Ativas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewSection />
        </TabsContent>

        <TabsContent value="video">
          <VideoProcessingSection />
        </TabsContent>

        <TabsContent value="tasks">
          <ActiveTasksSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WebWorkerManager;