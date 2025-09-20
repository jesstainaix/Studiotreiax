import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Wifi, 
  WifiOff, 
  Monitor, 
  Activity, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Zap, 
  Download, 
  Upload, 
  RefreshCw, 
  Filter, 
  Search, 
  MoreHorizontal,
  TrendingUp,
  Signal,
  Gauge,
  Video,
  Users,
  Globe,
  Shield,
  Target,
  Layers,
  Eye,
  RotateCcw
} from 'lucide-react';
import { 
  useAdaptiveStreaming,
  useStreamingStats,
  useStreamingConfig,
  useStreamingAlerts,
  useStreamingQualities,
  useStreamingMetrics,
  useStreamingRealtime,
  useStreamingAnalytics
} from '../../hooks/useAdaptiveStreaming';
import { StreamingSession, StreamQuality, NetworkMetrics } from '../../services/adaptiveStreamingService';

const AdaptiveStreamingManager: React.FC = () => {
  // Hooks
  const {
    streams,
    activeStreams,
    qualities,
    networkMetrics,
    alerts,
    isStreaming,
    isBuffering,
    isAdapting,
    connectionStatus,
    error,
    filter,
    searchQuery,
    selectedStreamId,
    isAutoRefreshEnabled,
    hasActiveStreams,
    hasUnresolvedAlerts,
    networkHealthStatus,
    bufferHealthStatus,
    adaptationEfficiency,
    totalStreamDuration,
    averageSatisfaction,
    setFilter,
    setSearch,
    clearFilters,
    setSelectedStreamId,
    setIsAutoRefreshEnabled,
    startStream,
    stopStream,
    pauseStream,
    resumeStream,
    changeQuality,
    handleQuickAction,
    handlePredictQuality,
    handleAnalyzeNetwork,
    refreshStreams,
    utilities,
    configHelpers,
    analyticsHelpers,
    debugHelpers
  } = useAdaptiveStreaming();

  const stats = useStreamingStats();
  const { config } = useStreamingConfig();
  const { unresolvedAlerts, criticalAlerts } = useStreamingAlerts();
  const { sortedQualities, getOptimalQuality } = useStreamingQualities();
  const { networkStability, bufferHealth } = useStreamingMetrics();
  const { realtimeData } = useStreamingRealtime();
  const { analytics, report, loadAnalytics, generateReport } = useStreamingAnalytics();

  // Local state
  const [activeTab, setActiveTab] = useState('overview');
  const [showFilters, setShowFilters] = useState(false);
  const [showQualityModal, setShowQualityModal] = useState(false);
  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<StreamQuality | null>(null);

  // Auto-refresh demo data
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAutoRefreshEnabled) {
        // Simulate real-time updates
        const demoUpdates = {
          bandwidth: 3000000 + Math.random() * 5000000,
          latency: 30 + Math.random() * 50,
          packetLoss: Math.random() * 2
        };
        // Note: In a real app, this would come from actual network monitoring
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAutoRefreshEnabled]);

  // Filtered and sorted data
  const filteredStreams = streams.filter(stream => {
    if (searchQuery && !stream.videoId.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const sortedStreams = filteredStreams.sort((a, b) => b.startTime - a.startTime);

  // Status cards data
  const statusCards = [
    {
      title: 'Streams Ativos',
      value: stats.activeStreams.toString(),
      icon: Video,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeColor: 'text-green-600'
    },
    {
      title: 'Largura de Banda',
      value: utilities.formatBandwidth(networkMetrics.bandwidth),
      icon: Wifi,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: networkHealthStatus,
      changeColor: networkStability > 80 ? 'text-green-600' : 'text-yellow-600'
    },
    {
      title: 'Saúde do Buffer',
      value: `${bufferHealth}%`,
      icon: Gauge,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      change: bufferHealthStatus,
      changeColor: bufferHealth > 80 ? 'text-green-600' : 'text-red-600'
    },
    {
      title: 'Satisfação',
      value: `${Math.round(averageSatisfaction)}%`,
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: adaptationEfficiency,
      changeColor: 'text-blue-600'
    }
  ];

  // Tab configuration
  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: Monitor },
    { id: 'streams', label: 'Streams', icon: Video },
    { id: 'quality', label: 'Qualidade', icon: Settings },
    { id: 'network', label: 'Rede', icon: Wifi },
    { id: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Configurações', icon: Settings }
  ];

  const handleStartDemoStream = async () => {
    const videoId = `video_${Date.now()}`;
    const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
    await startStream(videoId, userId);
  };

  const handleStopStream = async (sessionId: string) => {
    await stopStream(sessionId);
  };

  const handleQualityChange = async (sessionId: string, qualityId: string) => {
    await changeQuality(sessionId, qualityId);
    setShowQualityModal(false);
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Real-time metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conexões Ativas</p>
              <p className="text-2xl font-bold text-blue-600">{realtimeData.activeConnections}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bandwidth Total</p>
              <p className="text-2xl font-bold text-green-600">
                {utilities.formatBandwidth(realtimeData.totalBandwidth)}
              </p>
            </div>
            <Signal className="h-8 w-8 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Latência Média</p>
              <p className="text-2xl font-bold text-purple-600">{Math.round(realtimeData.averageLatency)}ms</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Status da Rede</p>
              <p className="text-2xl font-bold text-orange-600">{networkStability}%</p>
            </div>
            <Gauge className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Active streams */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Video className="h-5 w-5" />
            Streams Ativos
          </h3>
        </div>
        <div className="p-4">
          {Array.from(activeStreams.values()).length === 0 ? (
            <div className="text-center py-8">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">Nenhum stream ativo no momento</p>
              <button
                onClick={handleStartDemoStream}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Iniciar Stream Demo
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(activeStreams.values()).map((stream) => (
                <div key={stream.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="font-medium">{stream.videoId}</p>
                      <p className="text-sm text-gray-600">Usuário: {stream.userId}</p>
                      <p className="text-sm text-gray-600">Qualidade: {stream.averageQuality}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => pauseStream(stream.id)}
                      className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                    >
                      <Pause className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleStopStream(stream.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Square className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Network analysis */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Análise de Rede
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{networkMetrics.bandwidth ? utilities.formatBandwidth(networkMetrics.bandwidth) : 'N/A'}</div>
              <div className="text-sm text-gray-600">Largura de Banda</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{networkMetrics.latency}ms</div>
              <div className="text-sm text-gray-600">Latência</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{networkMetrics.packetLoss.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">Perda de Pacotes</div>
            </div>
          </div>
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleAnalyzeNetwork}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Analisar Padrões de Rede
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStreamsTab = () => (
    <div className="space-y-6">
      {/* Streams list */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Histórico de Streams</h3>
            <button
              onClick={handleStartDemoStream}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Novo Stream
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Vídeo ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Usuário</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Duração</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Qualidade</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Mudanças</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Satisfação</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedStreams.map((stream) => (
                <tr key={stream.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{stream.videoId}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{stream.userId}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {Math.round(stream.totalDuration / 60000)}min
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${utilities.formatQuality ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                      {stream.averageQuality}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{stream.qualitySwitches}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${stream.satisfaction}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600">{stream.satisfaction}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      stream.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {stream.completed ? 'Concluído' : 'Em andamento'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedStreamId(stream.id)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-600 hover:bg-gray-50 rounded transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderQualityTab = () => (
    <div className="space-y-6">
      {/* Quality levels */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Níveis de Qualidade
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sortedQualities.map((quality) => {
              const optimalBandwidth = getOptimalQuality(networkMetrics.bandwidth);
              const isOptimal = optimalBandwidth?.id === quality.id;
              
              return (
                <div 
                  key={quality.id} 
                  className={`p-4 rounded-lg border-2 transition-colors ${
                    isOptimal ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-center">
                    <h4 className="font-semibold text-lg">{quality.label}</h4>
                    <p className="text-sm text-gray-600">{quality.width}x{quality.height}</p>
                    <p className="text-sm text-gray-600">{Math.round(quality.bitrate / 1000)} Kbps</p>
                    <p className="text-sm text-gray-600">{quality.fps} FPS</p>
                    {isOptimal && (
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          Recomendado
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quality optimization */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Otimização de Qualidade
          </h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Configurações Adaptativas</h4>
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={config.adaptiveEnabled}
                    onChange={(e) => configHelpers.updateStreamingConfig({ adaptiveEnabled: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Streaming Adaptativo</span>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={config.autoQuality}
                    onChange={(e) => configHelpers.updateStreamingConfig({ autoQuality: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Qualidade Automática</span>
                </label>
                <label className="flex items-center gap-3">
                  <input 
                    type="checkbox" 
                    checked={config.lowLatencyMode}
                    onChange={(e) => configHelpers.updateStreamingConfig({ lowLatencyMode: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm">Modo Baixa Latência</span>
                </label>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3">Limites de Buffer</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Buffer Alvo (segundos)</label>
                  <input 
                    type="number" 
                    value={config.bufferTarget}
                    onChange={(e) => configHelpers.updateStreamingConfig({ bufferTarget: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="5"
                    max="120"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Buffer Máximo (segundos)</label>
                  <input 
                    type="number" 
                    value={config.maxBufferSize}
                    onChange={(e) => configHelpers.updateStreamingConfig({ maxBufferSize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                    min="10"
                    max="300"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAlertsTab = () => (
    <div className="space-y-6">
      {/* Alert summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              <p className="text-sm text-red-600">Alertas Críticos</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-600">{unresolvedAlerts.length}</p>
              <p className="text-sm text-yellow-600">Não Resolvidos</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-green-600">{alerts.filter(a => a.resolved).length}</p>
              <p className="text-sm text-green-600">Resolvidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts list */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Alertas Recentes</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {alerts.slice(0, 10).map((alert) => (
            <div key={alert.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                    alert.severity === 'critical' ? 'text-red-600' :
                    alert.severity === 'high' ? 'text-orange-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <div>
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-600">Session: {alert.sessionId}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    alert.resolved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {alert.resolved ? 'Resolvido' : 'Ativo'}
                  </span>
                  {!alert.resolved && (
                    <button className="text-blue-600 hover:text-blue-800 text-sm">
                      Resolver
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Video className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Streaming Adaptativo</h1>
              </div>
              {connectionStatus !== 'connected' && (
                <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                  <WifiOff className="h-4 w-4" />
                  {connectionStatus === 'reconnecting' ? 'Reconectando...' : 'Desconectado'}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  isStreaming ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <span className="text-sm text-gray-600">
                  {isStreaming ? 'Streaming Ativo' : 'Inativo'}
                </span>
              </div>
              
              <button
                onClick={() => setIsAutoRefreshEnabled(!isAutoRefreshEnabled)}
                className={`p-2 rounded-lg transition-colors ${
                  isAutoRefreshEnabled 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <RefreshCw className={`h-4 w-4 ${isAutoRefreshEnabled ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Filter className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {(isBuffering || isAdapting) && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
              <p className="text-blue-800">
                {isBuffering ? 'Carregando buffer...' : 'Adaptando qualidade...'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statusCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <div key={index} className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                    <p className={`text-sm ${card.changeColor}`}>{card.change}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg border">
          <div className="border-b">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && renderOverviewTab()}
            {activeTab === 'streams' && renderStreamsTab()}
            {activeTab === 'quality' && renderQualityTab()}
            {activeTab === 'alerts' && renderAlertsTab()}
            {activeTab === 'network' && (
              <div className="text-center py-8">
                <Wifi className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Análise de rede em desenvolvimento...</p>
              </div>
            )}
            {activeTab === 'analytics' && (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Analytics avançados em desenvolvimento...</p>
              </div>
            )}
            {activeTab === 'settings' && (
              <div className="text-center py-8">
                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Configurações avançadas em desenvolvimento...</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdaptiveStreamingManager;