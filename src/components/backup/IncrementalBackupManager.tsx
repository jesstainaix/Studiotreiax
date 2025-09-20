import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  Download,
  Upload,
  HardDrive,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Settings,
  BarChart3,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Eye,
  Shield,
  Zap,
  Database,
  Activity,
  TrendingUp,
  TrendingDown,
  Gauge,
  Target,
  Archive,
  FolderOpen,
  Server,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  useIncrementalBackup,
  useIncrementalBackupStats,
  useIncrementalBackupAnalytics,
  useIncrementalBackupMonitoring
} from '../../hooks/useIncrementalBackup';

const IncrementalBackupManager: React.FC = () => {
  // Main hook
  const {
    snapshots,
    destinations,
    schedules,
    alerts,
    filter,
    searchQuery,
    selectedSnapshotId,
    isBackingUp,
    isRestoring,
    currentProgress,
    loading,
    filteredSnapshots,
    successfulSnapshots,
    failedSnapshots,
    runningSnapshots,
    activeDestinations,
    activeSchedules,
    unreadAlerts,
    criticalAlerts,
    totalSize,
    totalCompressedSize,
    compressionRatio,
    successRate,
    storageUsage,
    backupHealth,
    lastBackup,
    nextScheduledBackup,
    actions,
    quickActions,
    throttledActions,
    hasError,
    error,
    clearError,
    autoRefresh
  } = useIncrementalBackup();
  
  // Specialized hooks
  const { stats } = useIncrementalBackupStats();
  const analyticsData = useIncrementalBackupAnalytics();
  const monitoring = useIncrementalBackupMonitoring();
  
  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (autoRefresh.enabled) {
        autoRefresh.forceRefresh();
      }
    }, autoRefresh.interval);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);
  
  // Filtered and sorted data
  const sortedSnapshots = useMemo(() => {
    return [...filteredSnapshots].sort((a, b) => {
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }, [filteredSnapshots]);
  
  const sortedDestinations = useMemo(() => {
    return [...destinations].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  }, [destinations]);
  
  const sortedSchedules = useMemo(() => {
    return [...schedules].sort((a, b) => {
      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }
      return a.nextRun.getTime() - b.nextRun.getTime();
    });
  }, [schedules]);
  
  // Status cards data
  const statusCards = [
    {
      title: 'Snapshots Totais',
      value: snapshots.length.toString(),
      description: `${successfulSnapshots.length} bem-sucedidos`,
      icon: Archive,
      color: 'blue',
      trend: snapshots.length > 0 ? '+12%' : '0%'
    },
    {
      title: 'Taxa de Sucesso',
      value: `${successRate.toFixed(1)}%`,
      description: `${failedSnapshots.length} falhas`,
      icon: Target,
      color: successRate >= 90 ? 'green' : successRate >= 70 ? 'yellow' : 'red',
      trend: successRate >= 90 ? '+5%' : '-2%'
    },
    {
      title: 'Armazenamento',
      value: formatBytes(totalSize),
      description: `${compressionRatio > 0 ? (compressionRatio * 100).toFixed(1) : 0}% compressão`,
      icon: HardDrive,
      color: 'purple',
      trend: '+8%'
    },
    {
      title: 'Saúde do Sistema',
      value: `${backupHealth.score}%`,
      description: getHealthStatusText(backupHealth.status),
      icon: Shield,
      color: getHealthStatusColor(backupHealth.status),
      trend: backupHealth.score >= 90 ? '+3%' : '-1%'
    }
  ];
  
  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: BarChart3 },
    { id: 'snapshots', label: 'Snapshots', icon: Archive },
    { id: 'destinations', label: 'Destinos', icon: Server },
    { id: 'schedules', label: 'Agendamentos', icon: Calendar },
    { id: 'monitoring', label: 'Monitoramento', icon: Activity },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];
  
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sistema de Backup Incremental</h1>
          <p className="text-gray-600 mt-1">
            Gerencie backups automáticos com compressão inteligente e versionamento avançado
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={autoRefresh.toggle}
            className={autoRefresh.enabled ? 'bg-green-50 border-green-200' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh.enabled ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
          
          <Button
            onClick={() => quickActions.createFullBackup()}
            disabled={isBackingUp || isRestoring}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Backup
          </Button>
        </div>
      </div>
      
      {/* Error Alert */}
      {hasError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearError}
              className="ml-2 h-6 px-2 text-red-600 hover:text-red-700"
            >
              Dispensar
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Carregando dados do backup...</span>
        </div>
      )}
      
      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statusCards.map((card, index) => {
          const IconComponent = card.icon;
          return (
            <Card key={index} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <IconComponent className={`h-4 w-4 text-${card.color}-600`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{card.value}</div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-600">{card.description}</p>
                  <span className={`text-xs font-medium ${
                    card.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.trend}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Saúde do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Score Geral</span>
                  <span className={`text-lg font-bold ${
                    getHealthStatusColor(backupHealth.status) === 'green' ? 'text-green-600' :
                    getHealthStatusColor(backupHealth.status) === 'yellow' ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {backupHealth.score}%
                  </span>
                </div>
                <Progress value={backupHealth.score} className="h-2" />
                
                {backupHealth.issues.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-gray-700">Problemas Identificados:</span>
                    {backupHealth.issues.map((issue, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                        <AlertTriangle className="h-4 w-4" />
                        {issue}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Atividade Recente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sortedSnapshots.slice(0, 5).map((snapshot) => (
                    <div key={snapshot.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center gap-3">
                        {getSnapshotStatusIcon(snapshot.status)}
                        <div>
                          <div className="text-sm font-medium">{snapshot.id}</div>
                          <div className="text-xs text-gray-500">
                            {formatDate(snapshot.timestamp)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatBytes(snapshot.totalSize)}</div>
                        <div className="text-xs text-gray-500">{formatDuration(snapshot.duration)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Storage Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5 text-purple-600" />
                  Uso de Armazenamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Usado</span>
                    <span>{formatBytes(storageUsage.used)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Disponível</span>
                    <span>{formatBytes(storageUsage.available)}</span>
                  </div>
                  <Progress value={storageUsage.percentage} className="h-2" />
                  <div className="text-center text-xs text-gray-500">
                    {storageUsage.percentage.toFixed(1)}% utilizado
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Ações Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => quickActions.createFullBackup()}
                  disabled={isBackingUp}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Backup Completo
                </Button>
                
                <Button
                  onClick={() => quickActions.createIncrementalBackup()}
                  disabled={isBackingUp}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Database className="h-4 w-4 mr-2" />
                  Backup Incremental
                </Button>
                
                <Button
                  onClick={() => quickActions.restoreLatest()}
                  disabled={isRestoring || successfulSnapshots.length === 0}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Restaurar Último
                </Button>
                
                <Button
                  onClick={() => quickActions.cleanupOldBackups()}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Limpar Antigos
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Snapshots Tab */}
        <TabsContent value="snapshots" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filtros e Busca
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                >
                  {showAdvancedFilters ? 'Ocultar' : 'Avançado'}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar snapshots..."
                    value={searchQuery}
                    onChange={(e) => throttledActions.setSearch(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button onClick={actions.clearFilters} variant="outline">
                  Limpar
                </Button>
              </div>
              
              {showAdvancedFilters && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <select
                      value={filter.status || ''}
                      onChange={(e) => actions.setFilter({ ...filter, status: e.target.value || undefined })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Todos</option>
                      <option value="completed">Completo</option>
                      <option value="running">Em Execução</option>
                      <option value="failed">Falhou</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo</label>
                    <select
                      value={filter.type || ''}
                      onChange={(e) => actions.setFilter({ ...filter, type: e.target.value || undefined })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="">Todos</option>
                      <option value="full">Completo</option>
                      <option value="incremental">Incremental</option>
                      <option value="differential">Diferencial</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Ordenar por</label>
                    <select
                      value={filter.sortBy || 'timestamp'}
                      onChange={(e) => actions.setFilter({ ...filter, sortBy: e.target.value as any })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="timestamp">Data</option>
                      <option value="size">Tamanho</option>
                      <option value="duration">Duração</option>
                      <option value="name">Nome</option>
                      <option value="status">Status</option>
                    </select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Snapshots List */}
          <Card>
            <CardHeader>
              <CardTitle>Snapshots ({filteredSnapshots.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sortedSnapshots.map((snapshot) => (
                  <div
                    key={snapshot.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedSnapshotId === snapshot.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => actions.setSelectedSnapshot(snapshot.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getSnapshotStatusIcon(snapshot.status)}
                        <div>
                          <div className="font-medium">{snapshot.id}</div>
                          <div className="text-sm text-gray-500">
                            {getSnapshotTypeText(snapshot.type)} • {formatDate(snapshot.timestamp)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatBytes(snapshot.totalSize)}</div>
                          <div className="text-xs text-gray-500">
                            Comprimido: {formatBytes(snapshot.compressedSize)}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium">{formatDuration(snapshot.duration)}</div>
                          <div className="text-xs text-gray-500">
                            {snapshot.filesCount} arquivos
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          
                          {snapshot.status === 'completed' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                actions.restoreSnapshot(snapshot.id);
                              }}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              actions.deleteSnapshot(snapshot.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {snapshot.status === 'running' && (
                      <div className="mt-3">
                        <Progress value={currentProgress} className="h-2" />
                        <div className="text-xs text-gray-500 mt-1">
                          {currentProgress.toFixed(1)}% concluído
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                {sortedSnapshots.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum snapshot encontrado</p>
                    <p className="text-sm">Crie seu primeiro backup para começar</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Destinations Tab */}
        <TabsContent value="destinations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Destinos de Backup ({destinations.length})
                </span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Destino
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedDestinations.map((destination) => (
                  <div key={destination.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {destination.isActive ? (
                          <Wifi className="h-5 w-5 text-green-600" />
                        ) : (
                          <WifiOff className="h-5 w-5 text-gray-400" />
                        )}
                        <div>
                          <div className="font-medium">{destination.name}</div>
                          <div className="text-sm text-gray-500">
                            {getDestinationTypeText(destination.type)} • {destination.path}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {formatBytes(destination.usedSpace)} / {formatBytes(destination.usedSpace + destination.availableSpace)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {((destination.usedSpace / (destination.usedSpace + destination.availableSpace)) * 100).toFixed(1)}% usado
                          </div>
                        </div>
                        
                        <Badge variant={destination.isActive ? 'default' : 'secondary'}>
                          {destination.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <Progress 
                        value={(destination.usedSpace / (destination.usedSpace + destination.availableSpace)) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Schedules Tab */}
        <TabsContent value="schedules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Agendamentos ({schedules.length})
                </span>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedSchedules.map((schedule) => (
                  <div key={schedule.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className={`h-5 w-5 ${schedule.isActive ? 'text-green-600' : 'text-gray-400'}`} />
                        <div>
                          <div className="font-medium">{schedule.name}</div>
                          <div className="text-sm text-gray-500">
                            {schedule.frequency} • Próxima execução: {formatDate(schedule.nextRun)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Badge variant={schedule.isActive ? 'default' : 'secondary'}>
                          {schedule.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                        
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real-time Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Status em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Operações Ativas</span>
                  <span className="text-lg font-bold">{monitoring.realTimeData.activeOperations}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Throughput</span>
                  <span className="text-lg font-bold">{monitoring.realTimeData.throughput.toFixed(1)} MB/s</span>
                </div>
                
                {monitoring.realTimeData.eta && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">ETA</span>
                    <span className="text-lg font-bold">{formatDate(monitoring.realTimeData.eta)}</span>
                  </div>
                )}
                
                {monitoring.isActive && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso</span>
                      <span>{monitoring.currentProgress.toFixed(1)}%</span>
                    </div>
                    <Progress value={monitoring.currentProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-purple-600" />
                  Métricas do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">99.5%</div>
                    <div className="text-xs text-gray-500">Uptime</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">720h</div>
                    <div className="text-xs text-gray-500">MTBF</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">50MB/s</div>
                    <div className="text-xs text-gray-500">Avg Speed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">25%</div>
                    <div className="text-xs text-gray-500">Compression</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Tendências
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Backups Diários</span>
                    <span className="font-medium">{analyticsData.trends.dailyBackups.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Taxa de Sucesso (30d)</span>
                    <span className="font-medium">{analyticsData.trends.successRate30Days.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Duração Média</span>
                    <span className="font-medium">{formatDuration(analyticsData.trends.avgDuration30Days)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Tamanho Total (30d)</span>
                    <span className="font-medium">{formatBytes(analyticsData.trends.totalSize30Days)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Efficiency */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Eficiência
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Compressão</span>
                    <span className="font-medium">{analyticsData.efficiency.compressionEfficiency.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Utilização Storage</span>
                    <span className="font-medium">{analyticsData.efficiency.storageUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Deduplicação</span>
                    <span className="font-medium">{analyticsData.efficiency.deduplicationSavings}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações do Sistema
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Configurações Gerais</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto-refresh</div>
                        <div className="text-sm text-gray-500">Atualizar dados automaticamente</div>
                      </div>
                      <Button
                        variant={autoRefresh.enabled ? 'default' : 'outline'}
                        onClick={autoRefresh.toggle}
                      >
                        {autoRefresh.enabled ? 'Ativado' : 'Desativado'}
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Intervalo de Refresh</div>
                        <div className="text-sm text-gray-500">Frequência de atualização em ms</div>
                      </div>
                      <Input
                        type="number"
                        value={autoRefresh.interval}
                        onChange={(e) => autoRefresh.setInterval(Number(e.target.value))}
                        className="w-24"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-4">Ações do Sistema</h3>
                  <div className="space-y-3">
                    <Button onClick={() => quickActions.testAllDestinations()} className="w-full justify-start" variant="outline">
                      <Shield className="h-4 w-4 mr-2" />
                      Testar Todos os Destinos
                    </Button>
                    
                    <Button onClick={() => quickActions.optimizeStorage()} className="w-full justify-start" variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Otimizar Armazenamento
                    </Button>
                    
                    <Button onClick={() => quickActions.cleanupOldBackups()} className="w-full justify-start" variant="outline">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Limpar Backups Antigos
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

function getSnapshotStatusIcon(status: string) {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    case 'running':
      return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    case 'failed':
      return <XCircle className="h-5 w-5 text-red-600" />;
    default:
      return <Clock className="h-5 w-5 text-gray-400" />;
  }
}

function getSnapshotTypeText(type: string): string {
  switch (type) {
    case 'full': return 'Completo';
    case 'incremental': return 'Incremental';
    case 'differential': return 'Diferencial';
    default: return type;
  }
}

function getDestinationTypeText(type: string): string {
  switch (type) {
    case 'local': return 'Local';
    case 'network': return 'Rede';
    case 'cloud': return 'Nuvem';
    default: return type;
  }
}

function getHealthStatusText(status: string): string {
  switch (status) {
    case 'excellent': return 'Excelente';
    case 'good': return 'Bom';
    case 'warning': return 'Atenção';
    case 'critical': return 'Crítico';
    default: return status;
  }
}

function getHealthStatusColor(status: string): string {
  switch (status) {
    case 'excellent': return 'green';
    case 'good': return 'green';
    case 'warning': return 'yellow';
    case 'critical': return 'red';
    default: return 'gray';
  }
}

export default IncrementalBackupManager;