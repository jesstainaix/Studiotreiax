import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Archive,
  BarChart3,
  CheckCircle,
  Clock,
  Compress,
  Download,
  FileImage,
  Gauge,
  HardDrive,
  Image,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  Wifi,
  X,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, BarChart, Bar } from 'recharts';
import { useAssetCompression, CompressionTask, CompressionConfig } from '@/hooks/useAssetCompression';

interface AssetCompressionManagerProps {
  className?: string;
  onClose?: () => void;
}

const AssetCompressionManager: React.FC<AssetCompressionManagerProps> = ({
  className,
  onClose
}) => {
  const { state, config, metrics, actions } = useAssetCompression({
    quality: 0.8,
    format: 'webp',
    enableProgressive: true,
    compressionLevel: 6
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [compressionHistory, setCompressionHistory] = useState<Array<{
    time: string;
    originalSize: number;
    compressedSize: number;
    ratio: number;
    tasks: number;
  }>>([]);
  const [localConfig, setLocalConfig] = useState<CompressionConfig>(config);

  // Atualizar histórico de compressão
  useEffect(() => {
    const updateHistory = () => {
      const now = new Date();
      const timeString = now.toLocaleTimeString();
      
      setCompressionHistory(prev => {
        const newEntry = {
          time: timeString,
          originalSize: metrics.totalOriginalSize / (1024 * 1024), // MB
          compressedSize: metrics.totalCompressedSize / (1024 * 1024), // MB
          ratio: metrics.averageCompressionRatio,
          tasks: metrics.completedTasks
        };
        
        const updated = [...prev, newEntry];
        return updated.slice(-20); // Manter apenas os últimos 20 pontos
      });
    };
    
    if (metrics.completedTasks > 0) {
      updateHistory();
    }
  }, [metrics.completedTasks, metrics.totalOriginalSize, metrics.totalCompressedSize, metrics.averageCompressionRatio]);

  // Função para formatar bytes
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para formatar tempo
  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Função para obter cor do status
  const getStatusColor = (task: CompressionTask): string => {
    switch (task.status) {
      case 'completed': return 'text-green-600';
      case 'processing': return 'text-blue-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Função para obter ícone do status
  const getStatusIcon = (task: CompressionTask) => {
    switch (task.status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed': return <X className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  // Função para obter cor da prioridade
  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para lidar com upload de arquivos
  const handleFileUpload = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    setSelectedFiles(prev => [...prev, ...fileArray]);
    
    // Adicionar arquivos à fila de compressão
    fileArray.forEach(file => {
      const taskId = actions.addToQueue(file, localConfig);
      toast.success(`${file.name} adicionado à fila de compressão`);
    });
  }, [actions, localConfig]);

  // Função para lidar com drag and drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Função para lidar com drag over
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  // Função para lidar com drag leave
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  // Função para comprimir arquivos selecionados
  const handleCompressSelected = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione arquivos para comprimir');
      return;
    }
    
    try {
      const results = await actions.batchCompress(selectedFiles, localConfig);
      toast.success(`${results.length} arquivos comprimidos com sucesso!`);
      setSelectedFiles([]);
    } catch (error) {
      toast.error('Erro ao comprimir arquivos');
    }
  }, [selectedFiles, actions, localConfig]);

  // Função para otimizar configuração
  const handleOptimizeConfig = useCallback((type: 'bandwidth' | 'quality', value: number) => {
    let optimizedConfig: CompressionConfig;
    
    if (type === 'bandwidth') {
      optimizedConfig = actions.optimizeForBandwidth(value);
      toast.success(`Configuração otimizada para ${value} Mbps`);
    } else {
      optimizedConfig = actions.optimizeForQuality(value);
      toast.success(`Configuração otimizada para qualidade ${(value * 100).toFixed(0)}%`);
    }
    
    setLocalConfig(optimizedConfig);
    actions.updateConfig(optimizedConfig);
  }, [actions]);

  // Função para baixar arquivo comprimido
  const handleDownloadCompressed = useCallback((task: CompressionTask) => {
    if (!task.result) return;
    
    const link = document.createElement('a');
    link.href = task.result.url;
    link.download = `compressed_${task.file instanceof File ? task.file.name : 'file'}`;
    link.click();
  }, []);

  // Dados para gráficos
  const statusData = [
    { name: 'Concluídas', value: metrics.completedTasks, color: '#10b981' },
    { name: 'Falharam', value: metrics.failedTasks, color: '#ef4444' },
    { name: 'Pendentes', value: state.queue.length, color: '#6b7280' },
    { name: 'Processando', value: state.processing.length, color: '#3b82f6' }
  ];

  const compressionData = compressionHistory.map(entry => ({
    ...entry,
    savings: entry.originalSize - entry.compressedSize
  }));

  // Componente de visão geral
  const OverviewSection = () => (
    <div className="space-y-6">
      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Tarefas</p>
                <p className="text-2xl font-bold">{metrics.totalTasks}</p>
              </div>
              <Archive className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Economia de Banda</p>
                <p className="text-2xl font-bold text-green-600">{formatBytes(metrics.bandwidthSaved)}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Taxa de Compressão</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.averageCompressionRatio.toFixed(1)}%</p>
              </div>
              <Compress className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Tempo Médio</p>
                <p className="text-2xl font-bold text-purple-600">{formatTime(metrics.averageProcessingTime)}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso Atual */}
      {state.isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Processamento em Andamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Fila: {state.queue.length} | Processando: {state.processing.length}</span>
                <span>Máximo Simultâneo: {state.maxConcurrent}</span>
              </div>
              
              {state.processing.map(taskId => {
                const task = state.tasks.get(taskId);
                if (!task) return null;
                
                return (
                  <div key={taskId} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="truncate">
                        {task.file instanceof File ? task.file.name : 'Arquivo'}
                      </span>
                      <span>{task.progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas de Compressão */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="grid grid-cols-2 gap-2 mt-4">
              {statusData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Capacidades do Navegador</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(state.capabilities).map(([capability, supported]) => (
                <div key={capability} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {capability.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <Badge variant={supported ? "default" : "secondary"}>
                    {supported ? 'Suportado' : 'Não Suportado'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Compressão */}
      {compressionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Compressão</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={compressionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="originalSize" 
                  stackId="1"
                  stroke="#ef4444" 
                  fill="#ef4444"
                  name="Tamanho Original (MB)"
                />
                <Area 
                  type="monotone" 
                  dataKey="compressedSize" 
                  stackId="1"
                  stroke="#10b981" 
                  fill="#10b981"
                  name="Tamanho Comprimido (MB)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Economia de Dados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Economia de Dados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatBytes(metrics.totalOriginalSize)}
              </div>
              <div className="text-sm text-muted-foreground">Tamanho Original</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatBytes(metrics.totalCompressedSize)}
              </div>
              <div className="text-sm text-muted-foreground">Tamanho Comprimido</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatBytes(metrics.bandwidthSaved)}
              </div>
              <div className="text-sm text-muted-foreground">Economia Total</div>
            </div>
          </div>
          
          {metrics.totalOriginalSize > 0 && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Economia de Banda</span>
                <span>{metrics.averageCompressionRatio.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.averageCompressionRatio} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  // Componente de upload e compressão
  const CompressionSection = () => (
    <div className="space-y-6">
      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivos</CardTitle>
          <CardDescription>
            Arraste arquivos aqui ou clique para selecionar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">
              {dragOver ? 'Solte os arquivos aqui' : 'Arraste arquivos para comprimir'}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Suporta imagens, documentos e outros tipos de arquivo
            </p>
            
            <input
              type="file"
              multiple
              accept="*/*"
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            
            <Button asChild>
              <label htmlFor="file-upload" className="cursor-pointer">
                Selecionar Arquivos
              </label>
            </Button>
          </div>
          
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {selectedFiles.length} arquivo(s) selecionado(s)
                </span>
                <Button
                  size="sm"
                  onClick={() => setSelectedFiles([])}
                  variant="outline"
                >
                  Limpar
                </Button>
              </div>
              
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                    <div className="flex items-center gap-2">
                      <FileImage className="h-4 w-4" />
                      <span className="text-sm truncate">{file.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(file.size)}
                    </span>
                  </div>
                ))}
              </div>
              
              <Button
                className="w-full mt-4"
                onClick={handleCompressSelected}
                disabled={state.isProcessing}
              >
                {state.isProcessing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Compress className="h-4 w-4 mr-2" />
                )}
                Comprimir Arquivos
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Otimização Rápida */}
      <Card>
        <CardHeader>
          <CardTitle>Otimização Rápida</CardTitle>
          <CardDescription>
            Configure automaticamente para diferentes cenários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Otimizar para Largura de Banda (Mbps)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[5]}
                onValueChange={([value]) => handleOptimizeConfig('bandwidth', value)}
                max={50}
                min={0.5}
                step={0.5}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16">5 Mbps</span>
            </div>
          </div>
          
          <div>
            <Label>Otimizar para Qualidade</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[0.8]}
                onValueChange={([value]) => handleOptimizeConfig('quality', value)}
                max={1}
                min={0.1}
                step={0.1}
                className="flex-1"
              />
              <span className="text-sm font-medium w-16">80%</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOptimizeConfig('bandwidth', 1)}
            >
              <Wifi className="h-4 w-4 mr-2" />
              Conexão Lenta
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOptimizeConfig('quality', 0.9)}
            >
              <Image className="h-4 w-4 mr-2" />
              Alta Qualidade
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOptimizeConfig('bandwidth', 10)}
            >
              <Zap className="h-4 w-4 mr-2" />
              Balanceado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Tarefas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Tarefas de Compressão</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={state.isProcessing ? actions.pauseProcessing : actions.resumeProcessing}
              >
                {state.isProcessing ? (
                  <Pause className="h-4 w-4 mr-2" />
                ) : (
                  <Play className="h-4 w-4 mr-2" />
                )}
                {state.isProcessing ? 'Pausar' : 'Retomar'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={actions.clearQueue}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Fila
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96">
            {state.tasks.size === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Archive className="h-8 w-8 mx-auto mb-2" />
                Nenhuma tarefa de compressão
              </div>
            ) : (
              <div className="space-y-3">
                {Array.from(state.tasks.values()).map((task) => (
                  <div key={task.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <FileImage className="h-4 w-4" />
                        <div>
                          <div className="font-medium truncate max-w-xs">
                            {task.file instanceof File ? task.file.name : 'Arquivo'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {task.file instanceof File ? formatBytes(task.file.size) : 'Tamanho desconhecido'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        
                        {getStatusIcon(task)}
                      </div>
                    </div>
                    
                    {task.status === 'processing' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso</span>
                          <span>{task.progress.toFixed(0)}%</span>
                        </div>
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}
                    
                    {task.result && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Original:</span>
                          <span className="ml-2 font-medium">{formatBytes(task.result.originalSize)}</span>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Comprimido:</span>
                          <span className="ml-2 font-medium">{formatBytes(task.result.compressedSize)}</span>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Economia:</span>
                          <span className="ml-2 font-medium text-green-600">
                            {task.result.compressionRatio.toFixed(1)}%
                          </span>
                        </div>
                        
                        <div>
                          <span className="text-muted-foreground">Tempo:</span>
                          <span className="ml-2 font-medium">{formatTime(task.result.processingTime)}</span>
                        </div>
                      </div>
                    )}
                    
                    {task.error && (
                      <div className="text-sm text-red-600 mb-3 p-2 bg-red-50 rounded">
                        <strong>Erro:</strong> {task.error}
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {task.result && (
                        <Button
                          size="sm"
                          onClick={() => handleDownloadCompressed(task)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                      )}
                      
                      {task.status === 'failed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            actions.removeFromQueue(task.id);
                            actions.addToQueue(task.file, task.config, task.priority);
                          }}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Tentar Novamente
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => actions.removeFromQueue(task.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );

  // Componente de configurações
  const SettingsSection = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Compressão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quality">Qualidade ({(localConfig.quality * 100).toFixed(0)}%)</Label>
            <Slider
              value={[localConfig.quality]}
              onValueChange={([value]) => {
                const newConfig = { ...localConfig, quality: value };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
              max={1}
              min={0.1}
              step={0.1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="compression-level">Nível de Compressão ({localConfig.compressionLevel})</Label>
            <Slider
              value={[localConfig.compressionLevel]}
              onValueChange={([value]) => {
                const newConfig = { ...localConfig, compressionLevel: value };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
              max={9}
              min={0}
              step={1}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="max-width">Largura Máxima (px)</Label>
            <Input
              id="max-width"
              type="number"
              value={localConfig.maxWidth || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                const newConfig = { ...localConfig, maxWidth: value };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
              placeholder="1920"
            />
          </div>
          
          <div>
            <Label htmlFor="max-height">Altura Máxima (px)</Label>
            <Input
              id="max-height"
              type="number"
              value={localConfig.maxHeight || ''}
              onChange={(e) => {
                const value = e.target.value ? parseInt(e.target.value) : undefined;
                const newConfig = { ...localConfig, maxHeight: value };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
              placeholder="1080"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="format">Formato de Saída</Label>
          <Select 
            value={localConfig.format} 
            onValueChange={(value: any) => {
              const newConfig = { ...localConfig, format: value };
              setLocalConfig(newConfig);
              actions.updateConfig(newConfig);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {state.supportedFormats.map(format => (
                <SelectItem key={format} value={format}>
                  {format.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Separator />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="progressive">JPEG Progressivo</Label>
            <Switch
              id="progressive"
              checked={localConfig.enableProgressive}
              onCheckedChange={(checked) => {
                const newConfig = { ...localConfig, enableProgressive: checked };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="lossless">Compressão Sem Perdas</Label>
            <Switch
              id="lossless"
              checked={localConfig.enableLossless}
              onCheckedChange={(checked) => {
                const newConfig = { ...localConfig, enableLossless: checked };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="webp">Habilitar WebP</Label>
            <Switch
              id="webp"
              checked={localConfig.enableWebP}
              onCheckedChange={(checked) => {
                const newConfig = { ...localConfig, enableWebP: checked };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
              disabled={!state.capabilities.webp}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="avif">Habilitar AVIF</Label>
            <Switch
              id="avif"
              checked={localConfig.enableAVIF}
              onCheckedChange={(checked) => {
                const newConfig = { ...localConfig, enableAVIF: checked };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
              disabled={!state.capabilities.avif}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="brotli">Habilitar Brotli</Label>
            <Switch
              id="brotli"
              checked={localConfig.enableBrotli}
              onCheckedChange={(checked) => {
                const newConfig = { ...localConfig, enableBrotli: checked };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
              disabled={!state.capabilities.brotli}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="gzip">Habilitar Gzip</Label>
            <Switch
              id="gzip"
              checked={localConfig.enableGzip}
              onCheckedChange={(checked) => {
                const newConfig = { ...localConfig, enableGzip: checked };
                setLocalConfig(newConfig);
                actions.updateConfig(newConfig);
              }}
              disabled={!state.capabilities.gzip}
            />
          </div>
        </div>
        
        <Separator />
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              const defaultConfig: CompressionConfig = {
                quality: 0.8,
                format: 'webp',
                maxWidth: 1920,
                maxHeight: 1080,
                enableProgressive: true,
                enableLossless: false,
                compressionLevel: 6,
                enableWebP: true,
                enableAVIF: true,
                enableBrotli: true,
                enableGzip: true
              };
              setLocalConfig(defaultConfig);
              actions.updateConfig(defaultConfig);
              toast.success('Configurações restauradas para o padrão');
            }}
          >
            Restaurar Padrão
          </Button>
          
          <Button
            variant="outline"
            onClick={() => {
              const data = actions.exportMetrics();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `compression-metrics-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar Métricas
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
          <h2 className="text-2xl font-bold">Gerenciador de Compressão de Assets</h2>
          <p className="text-muted-foreground">
            Comprima e otimize arquivos para melhor performance
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={actions.clearMetrics}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Limpar Métricas
          </Button>
          
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Status Rápido */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2">
          {state.isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <span className="text-sm font-medium">
            {state.isProcessing ? `Processando ${state.processing.length} tarefa(s)` : 'Pronto'}
          </span>
        </div>
        
        <Separator orientation="vertical" className="h-4" />
        
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Fila: {state.queue.length}
          </span>
        </div>
        
        <Separator orientation="vertical" className="h-4" />
        
        <div className="flex items-center gap-2">
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Economia: {formatBytes(metrics.bandwidthSaved)}
          </span>
        </div>
        
        <Separator orientation="vertical" className="h-4" />
        
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            Taxa: {metrics.averageCompressionRatio.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="compression">Compressão</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewSection />
        </TabsContent>

        <TabsContent value="compression">
          <CompressionSection />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssetCompressionManager;