import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Database, 
  Clock, 
  TrendingUp, 
  Trash2, 
  RefreshCw, 
  Settings, 
  BarChart3, 
  Filter, 
  Download, 
  Upload,
  Eye,
  AlertCircle,
  CheckCircle,
  XCircle,
  Zap
} from 'lucide-react';
import { cachedFetch } from '../services/apiCacheService';

// Interfaces
interface CacheEntry {
  id: string;
  key: string;
  prompt: string;
  category: string;
  tags: string[];
  hitCount: number;
  lastAccessed: string;
  expiresAt: string;
  createdAt: string;
  size: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  totalSizeBytes: number;
  avgEntrySize: number;
  estimatedSavings: number;
  categoriesStats: Record<string, {
    entries: number;
    hits: number;
    avgResponseTime: number;
  }>;
  dailyStats: Array<{
    date: string;
    hits: number;
    misses: number;
    created: number;
  }>;
  config: {
    maxEntries: number;
    maxSizeBytes: number;
    defaultTTL: number;
  };
}

interface CacheConfig {
  defaultTTL: number;
  maxEntries: number;
  maxSizeBytes: number;
  categories: Record<string, { ttl: number }>;
}

interface WarmupData {
  category: string;
  prompts: Array<{
    prompt: string;
    params?: Record<string, any>;
    response: any;
    tags?: string[];
  }>;
}

const AICache: React.FC = () => {
  // Estados
  const [entries, setEntries] = useState<CacheEntry[]>([]);
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [config, setConfig] = useState<CacheConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('lastAccessed');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [statsPeriod, setStatsPeriod] = useState<'7d' | '30d'>('7d');
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'entries' | 'stats' | 'config'>('entries');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showWarmupModal, setShowWarmupModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<CacheEntry | null>(null);
  
  // Estados de formulários
  const [configForm, setConfigForm] = useState<Partial<CacheConfig>>({});
  const [warmupForm, setWarmupForm] = useState<WarmupData>({
    category: '',
    prompts: []
  });
  
  const categories = [
    'script-generation',
    'storyboard-generation', 
    'content-improvement',
    'captions-transcriptions',
    'prompt-templates'
  ];
  
  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);
  
  // Recarregar entradas quando filtros mudam
  useEffect(() => {
    loadEntries();
  }, [searchTerm, selectedCategory, sortBy, sortOrder, currentPage]);
  
  // Recarregar estatísticas quando período muda
  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
  }, [statsPeriod, activeTab]);
  
  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadEntries(),
        loadStats(),
        loadConfig()
      ]);
    } catch (error) {
      setError('Erro ao carregar dados do cache');
    } finally {
      setLoading(false);
    }
  };
  
  const loadEntries = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        sortBy,
        sortOrder
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (selectedCategory) params.append('category', selectedCategory);
      
      const response = await cachedFetch(`/api/ai/cache/entries?${params}`, {}, 30 * 1000); // Cache por 30 segundos
      const data = await response.json();
      
      if (response.ok) {
        setEntries(data.entries);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar entradas do cache');
    }
  };
  
  const loadStats = async () => {
    try {
      const response = await cachedFetch(`/api/ai/cache/stats?period=${statsPeriod}`, {}, 15 * 1000); // Cache por 15 segundos
      const data = await response.json();
      
      if (response.ok) {
        setStats(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar estatísticas do cache');
    }
  };
  
  const loadConfig = async () => {
    try {
      const response = await cachedFetch('/api/ai/cache/config', {}, 5 * 60 * 1000); // Cache por 5 minutos
      const data = await response.json();
      
      if (response.ok) {
        setConfig(data);
        setConfigForm(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar configurações do cache');
    }
  };
  
  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta entrada do cache?')) return;
    
    try {
      const response = await fetch(`/api/ai/cache/entries/${entryId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadEntries();
        await loadStats();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao deletar entrada do cache');
    }
  };
  
  const handleClearCategory = async (category: string) => {
    if (!confirm(`Tem certeza que deseja limpar todo o cache da categoria '${category}'?`)) return;
    
    try {
      const response = await fetch(`/api/ai/cache/categories/${category}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadEntries();
        await loadStats();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao limpar cache da categoria');
    }
  };
  
  const handleCleanupExpired = async () => {
    try {
      const response = await fetch('/api/ai/cache/cleanup', {
        method: 'POST'
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`${data.cleanedCount} entradas expiradas foram removidas`);
        await loadEntries();
        await loadStats();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao limpar entradas expiradas');
    }
  };
  
  const handleClearAllCache = async () => {
    if (!confirm('Tem certeza que deseja limpar TODO o cache? Esta ação não pode ser desfeita.')) return;
    
    try {
      const response = await fetch('/api/ai/cache/clear', {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadEntries();
        await loadStats();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao limpar cache');
    }
  };
  
  const handleSaveConfig = async () => {
    try {
      const response = await fetch('/api/ai/cache/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(configForm)
      });
      
      if (response.ok) {
        await loadConfig();
        setShowConfigModal(false);
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao salvar configurações');
    }
  };
  
  const handleWarmupCache = async () => {
    try {
      const response = await fetch('/api/ai/cache/warmup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(warmupForm)
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`${data.warmedUpIds.length} entradas foram pré-aquecidas no cache`);
        setShowWarmupModal(false);
        setWarmupForm({ category: '', prompts: [] });
        await loadEntries();
        await loadStats();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao pré-aquecer cache');
    }
  };
  
  const handleViewEntry = async (entryId: string) => {
    try {
      const response = await fetch(`/api/ai/cache/entries/${entryId}`);
      const data = await response.json();
      
      if (response.ok) {
        setSelectedEntry(data);
        setShowEntryModal(true);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      setError('Erro ao carregar detalhes da entrada');
    }
  };
  
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const formatDuration = (ms: number) => {
    const days = Math.floor(ms / (24 * 60 * 60 * 1000));
    const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return '<1h';
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cache de IA</h1>
          <p className="text-gray-600">Gerencie o cache de respostas da IA para otimizar performance</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleCleanupExpired}
            className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Limpar Expirados
          </button>
          
          <button
            onClick={() => setShowWarmupModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Zap className="w-4 h-4 mr-2" />
            Pré-aquecer
          </button>
          
          <button
            onClick={() => setShowConfigModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </button>
        </div>
      </div>
      
      {/* Estatísticas Rápidas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Entradas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Acerto</p>
                <p className="text-2xl font-bold text-green-600">
                  {(stats.hitRate * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamanho Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatBytes(stats.totalSizeBytes)}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Economia Estimada</p>
                <p className="text-2xl font-bold text-green-600">
                  ${stats.estimatedSavings.toFixed(2)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>
      )}
      
      {/* Navegação por Abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'entries', label: 'Entradas do Cache', icon: Database },
            { id: 'stats', label: 'Estatísticas', icon: BarChart3 },
            { id: 'config', label: 'Configurações', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Conteúdo das Abas */}
      {activeTab === 'entries' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Buscar
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por prompt ou tags..."
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="lastAccessed">Último Acesso</option>
                  <option value="createdAt">Data de Criação</option>
                  <option value="hitCount">Número de Acessos</option>
                  <option value="size">Tamanho</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ordem
                </label>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Decrescente</option>
                  <option value="asc">Crescente</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Lista de Entradas */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prompt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acessos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tamanho
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Último Acesso
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expira em
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => {
                    const isExpired = new Date() > new Date(entry.expiresAt);
                    const timeToExpire = new Date(entry.expiresAt).getTime() - Date.now();
                    
                    return (
                      <tr key={entry.id} className={isExpired ? 'bg-red-50' : ''}>
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {entry.prompt}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.tags.slice(0, 3).map((tag, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                >
                                  {tag}
                                </span>
                              ))}
                              {entry.tags.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{entry.tags.length - 3} mais
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {entry.category.replace('-', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.hitCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatBytes(entry.size)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(entry.lastAccessed)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {isExpired ? (
                              <XCircle className="w-4 h-4 text-red-500 mr-1" />
                            ) : timeToExpire < 24 * 60 * 60 * 1000 ? (
                              <AlertCircle className="w-4 h-4 text-yellow-500 mr-1" />
                            ) : (
                              <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                            )}
                            <span className={`text-sm ${
                              isExpired ? 'text-red-600' : 
                              timeToExpire < 24 * 60 * 60 * 1000 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {isExpired ? 'Expirado' : formatDuration(timeToExpire)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewEntry(entry.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Deletar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {entries.length === 0 && (
              <div className="text-center py-12">
                <Database className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma entrada encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Não há entradas de cache que correspondam aos filtros selecionados.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Controles de Período */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Estatísticas do Cache</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setStatsPeriod('7d')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    statsPeriod === '7d'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  7 dias
                </button>
                <button
                  onClick={() => setStatsPeriod('30d')}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    statsPeriod === '30d'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  30 dias
                </button>
              </div>
            </div>
          </div>
          
          {/* Estatísticas por Categoria */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Estatísticas por Categoria</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entradas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total de Acessos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tempo Médio de Resposta
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(stats.categoriesStats).map(([category, categoryStats]) => (
                    <tr key={category}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {category.replace('-', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {categoryStats.entries}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {categoryStats.hits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {categoryStats.avgResponseTime.toFixed(2)}s
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleClearCategory(category)}
                          className="text-red-600 hover:text-red-900"
                          title="Limpar categoria"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Estatísticas Diárias */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Estatísticas Diárias</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acertos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Erros
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxa de Acerto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entradas Criadas
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.dailyStats.map((dayStat) => {
                    const hitRate = dayStat.hits / (dayStat.hits + dayStat.misses);
                    return (
                      <tr key={dayStat.date}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(dayStat.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          {dayStat.hits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          {dayStat.misses}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {(hitRate * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {dayStat.created}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'config' && config && (
        <div className="space-y-6">
          {/* Configurações Gerais */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Configurações do Cache</h3>
              <button
                onClick={handleClearAllCache}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Todo Cache
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TTL Padrão (dias)
                </label>
                <input
                  type="number"
                  value={Math.floor(config.defaultTTL / (24 * 60 * 60 * 1000))}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Máximo de Entradas
                </label>
                <input
                  type="number"
                  value={config.maxEntries}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tamanho Máximo
                </label>
                <input
                  type="text"
                  value={formatBytes(config.maxSizeBytes)}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                />
              </div>
            </div>
          </div>
          
          {/* Configurações por Categoria */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h4 className="text-lg font-medium text-gray-900 mb-4">TTL por Categoria</h4>
            <div className="space-y-4">
              {Object.entries(config.categories).map(([category, categoryConfig]) => (
                <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h5>
                    <p className="text-sm text-gray-500">
                      TTL: {Math.floor(categoryConfig.ttl / (24 * 60 * 60 * 1000))} dias
                    </p>
                  </div>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Configurações */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Configurações do Cache</h3>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    TTL Padrão (ms)
                  </label>
                  <input
                    type="number"
                    value={configForm.defaultTTL || ''}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      defaultTTL: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de Entradas
                  </label>
                  <input
                    type="number"
                    value={configForm.maxEntries || ''}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      maxEntries: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho Máximo (bytes)
                  </label>
                  <input
                    type="number"
                    value={configForm.maxSizeBytes || ''}
                    onChange={(e) => setConfigForm({
                      ...configForm,
                      maxSizeBytes: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveConfig}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Pré-aquecimento */}
      {showWarmupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Pré-aquecer Cache</h3>
              <button
                onClick={() => setShowWarmupModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria
                </label>
                <select
                  value={warmupForm.category}
                  onChange={(e) => setWarmupForm({
                    ...warmupForm,
                    category: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dados JSON
                </label>
                <textarea
                  value={JSON.stringify(warmupForm.prompts, null, 2)}
                  onChange={(e) => {
                    try {
                      const prompts = JSON.parse(e.target.value);
                      setWarmupForm({ ...warmupForm, prompts });
                    } catch (error) {
                      // Ignorar erros de parsing durante a digitação
                    }
                  }}
                  placeholder={`[
  {
    "prompt": "Exemplo de prompt",
    "response": "Resposta do exemplo",
    "tags": ["tag1", "tag2"]
  }
]`}
                  rows={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowWarmupModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleWarmupCache}
                  disabled={!warmupForm.category || warmupForm.prompts.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pré-aquecer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal de Visualização de Entrada */}
      {showEntryModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Detalhes da Entrada</h3>
              <button
                onClick={() => setShowEntryModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ID
                  </label>
                  <p className="text-sm text-gray-900 font-mono">{selectedEntry.id}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedEntry.category}
                  </span>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Acessos
                  </label>
                  <p className="text-sm text-gray-900">{selectedEntry.hitCount}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho
                  </label>
                  <p className="text-sm text-gray-900">{formatBytes(selectedEntry.size)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Criado em
                  </label>
                  <p className="text-sm text-gray-900">{formatDate(selectedEntry.createdAt)}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Último Acesso
                  </label>
                  <p className="text-sm text-gray-900">{formatDate(selectedEntry.lastAccessed)}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompt
                </label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedEntry.prompt}</p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedEntry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Notificação de Erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-500 hover:text-red-700"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AICache;