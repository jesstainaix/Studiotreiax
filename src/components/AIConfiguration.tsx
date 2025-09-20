import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit, Trash2, TestTube, Power, Star, Download, Upload, AlertCircle, CheckCircle, Clock, DollarSign, Activity, Zap } from 'lucide-react';
import { cachedFetch } from '../services/apiCacheService';

// Interfaces
interface AIModel {
  id: string;
  name: string;
  maxTokens: number;
  costPer1k: number;
}

interface ConfigField {
  name: string;
  type: 'number' | 'text' | 'select';
  min?: number;
  max?: number;
  step?: number;
  default: any;
  options?: { value: any; label: string }[];
}

interface AIProvider {
  id: string;
  name: string;
  description: string;
  models: AIModel[];
  supportedFeatures: string[];
  configFields: ConfigField[];
}

interface AIConfiguration {
  id: string;
  name: string;
  description: string;
  provider: string;
  model: string;
  apiKey: string;
  settings: Record<string, any>;
  isActive: boolean;
  isDefault: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UsageStats {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  requestsByProvider: Record<string, number>;
  tokensByProvider: Record<string, number>;
  costByProvider: Record<string, number>;
  dailyUsage: {
    date: string;
    requests: number;
    tokens: number;
    cost: number;
  }[];
}

interface TestResult {
  success: boolean;
  error: string | null;
  latency: number | null;
}

const AIConfiguration: React.FC = () => {
  // Estados
  const [configurations, setConfigurations] = useState<AIConfiguration[]>([]);
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de filtros
  const [filterProvider, setFilterProvider] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState<'configurations' | 'usage'>('configurations');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<AIConfiguration | null>(null);
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    provider: '',
    model: '',
    apiKey: '',
    settings: {} as Record<string, any>,
    isActive: true,
    isDefault: false
  });
  
  // Estados de teste
  const [testingConfig, setTestingConfig] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  
  // Estados de importação
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

  // Carregar dados iniciais
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadConfigurations(),
        loadProviders(),
        loadUsageStats()
      ]);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const loadConfigurations = async () => {
    try {
      const response = await cachedFetch('/api/ai/config', {}, 2 * 60 * 1000); // Cache por 2 minutos
      const data = await response.json();
      setConfigurations(data.configurations);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  };

  const loadProviders = async () => {
    try {
      const response = await cachedFetch('/api/ai/config/meta/providers', {}, 10 * 60 * 1000); // Cache por 10 minutos
      const data = await response.json();
      setProviders(data);
    } catch (err) {
      console.error('Erro ao carregar providers:', err);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await cachedFetch('/api/ai/config/meta/usage', {}, 30 * 1000); // Cache por 30 segundos
      const data = await response.json();
      setUsageStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  // Handlers de configuração
  const handleCreateConfig = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      description: '',
      provider: '',
      model: '',
      apiKey: '',
      settings: {},
      isActive: true,
      isDefault: false
    });
    setShowConfigModal(true);
  };

  const handleEditConfig = (config: AIConfiguration) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      description: config.description,
      provider: config.provider,
      model: config.model,
      apiKey: config.apiKey,
      settings: config.settings,
      isActive: config.isActive,
      isDefault: config.isDefault
    });
    setShowConfigModal(true);
  };

  const handleSaveConfig = async () => {
    try {
      const url = editingConfig 
        ? `/api/ai/config/${editingConfig.id}`
        : '/api/ai/config';
      
      const method = editingConfig ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        await loadConfigurations();
        setShowConfigModal(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (err) {
      setError('Erro ao salvar configuração');
    }
  };

  const handleDeleteConfig = async (configId: string) => {
    if (!confirm('Tem certeza que deseja deletar esta configuração?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/ai/config/${configId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await loadConfigurations();
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (err) {
      setError('Erro ao deletar configuração');
    }
  };

  const handleTestConnection = async (configId: string) => {
    try {
      setTestingConfig(configId);
      
      const response = await fetch(`/api/ai/config/${configId}/test`, {
        method: 'POST'
      });
      
      const result = await response.json();
      setTestResults(prev => ({ ...prev, [configId]: result }));
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        [configId]: { success: false, error: 'Erro ao testar conexão', latency: null }
      }));
    } finally {
      setTestingConfig(null);
    }
  };

  const handleToggleActive = async (configId: string) => {
    try {
      const response = await fetch(`/api/ai/config/${configId}/toggle`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadConfigurations();
      }
    } catch (err) {
      setError('Erro ao alterar status');
    }
  };

  const handleSetDefault = async (configId: string) => {
    try {
      const response = await fetch(`/api/ai/config/${configId}/set-default`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await loadConfigurations();
      }
    } catch (err) {
      setError('Erro ao definir como padrão');
    }
  };

  // Handlers de importação/exportação
  const handleExportConfigs = async () => {
    try {
      const response = await fetch('/api/ai/config/export');
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'ai-configurations.json';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError('Erro ao exportar configurações');
    }
  };

  const handleImportConfigs = async () => {
    if (!importFile) return;
    
    try {
      setImporting(true);
      
      const formData = new FormData();
      formData.append('file', importFile);
      
      const response = await fetch('/api/ai/config/import', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        await loadConfigurations();
        setShowImportModal(false);
        setImportFile(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error);
      }
    } catch (err) {
      setError('Erro ao importar configurações');
    } finally {
      setImporting(false);
    }
  };

  // Filtrar configurações
  const filteredConfigurations = configurations.filter(config => {
    const matchesProvider = !filterProvider || config.provider === filterProvider;
    const matchesActive = !filterActive || config.isActive.toString() === filterActive;
    const matchesSearch = !searchTerm || 
      config.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      config.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesProvider && matchesActive && matchesSearch;
  });

  // Obter provider selecionado
  const selectedProvider = providers.find(p => p.id === formData.provider);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Configuração de IA</h1>
            <p className="text-gray-600">Gerencie provedores e configurações de IA</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportConfigs}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            <span>Exportar</span>
          </button>
          
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            <span>Importar</span>
          </button>
          
          <button
            onClick={handleCreateConfig}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Nova Configuração</span>
          </button>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      {usageStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Requisições</p>
                <p className="text-2xl font-bold text-gray-900">{usageStats.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Tokens</p>
                <p className="text-2xl font-bold text-gray-900">{usageStats.totalTokens.toLocaleString()}</p>
              </div>
              <Zap className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custo Total</p>
                <p className="text-2xl font-bold text-gray-900">${usageStats.totalCost.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Configurações Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{configurations.filter(c => c.isActive).length}</p>
              </div>
              <Settings className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Navegação por abas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('configurations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'configurations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configurações
          </button>
          
          <button
            onClick={() => setActiveTab('usage')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'usage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Estatísticas de Uso
          </button>
        </nav>
      </div>

      {/* Conteúdo das abas */}
      {activeTab === 'configurations' && (
        <div className="space-y-6">
          {/* Filtros */}
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Nome ou descrição..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider
                </label>
                <select
                  value={filterProvider}
                  onChange={(e) => setFilterProvider(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  {providers.map(provider => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filterActive}
                  onChange={(e) => setFilterActive(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos</option>
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterProvider('');
                    setFilterActive('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Limpar Filtros
                </button>
              </div>
            </div>
          </div>

          {/* Lista de configurações */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Configuração
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider/Modelo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Teste
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredConfigurations.map((config) => {
                    const provider = providers.find(p => p.id === config.provider);
                    const model = provider?.models.find(m => m.id === config.model);
                    const testResult = testResults[config.id];
                    
                    return (
                      <tr key={config.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="flex items-center space-x-2">
                                <div className="text-sm font-medium text-gray-900">
                                  {config.name}
                                </div>
                                {config.isDefault && (
                                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {config.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {provider?.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {model?.name}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              config.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {config.isActive ? 'Ativo' : 'Inativo'}
                            </span>
                            
                            <button
                              onClick={() => handleToggleActive(config.id)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <Power className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleTestConnection(config.id)}
                              disabled={testingConfig === config.id}
                              className="flex items-center space-x-1 px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                            >
                              {testingConfig === config.id ? (
                                <Clock className="h-3 w-3 animate-spin" />
                              ) : (
                                <TestTube className="h-3 w-3" />
                              )}
                              <span>Testar</span>
                            </button>
                            
                            {testResult && (
                              <div className="flex items-center space-x-1">
                                {testResult.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                )}
                                {testResult.latency && (
                                  <span className="text-xs text-gray-500">
                                    {testResult.latency}ms
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {!config.isDefault && (
                              <button
                                onClick={() => handleSetDefault(config.id)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Definir como padrão"
                              >
                                <Star className="h-4 w-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleEditConfig(config)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteConfig(config.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredConfigurations.length === 0 && (
              <div className="text-center py-12">
                <Settings className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma configuração encontrada</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {configurations.length === 0 
                    ? 'Comece criando sua primeira configuração de IA.'
                    : 'Tente ajustar os filtros para encontrar o que procura.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'usage' && usageStats && (
        <div className="space-y-6">
          {/* Gráficos de uso por provider */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Requisições por Provider</h3>
              <div className="space-y-3">
                {Object.entries(usageStats.requestsByProvider).map(([provider, requests]) => {
                  const total = usageStats.totalRequests;
                  const percentage = (requests / total) * 100;
                  const providerData = providers.find(p => p.id === provider);
                  
                  return (
                    <div key={provider}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{providerData?.name || provider}</span>
                        <span>{requests.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tokens por Provider</h3>
              <div className="space-y-3">
                {Object.entries(usageStats.tokensByProvider).map(([provider, tokens]) => {
                  const total = usageStats.totalTokens;
                  const percentage = (tokens / total) * 100;
                  const providerData = providers.find(p => p.id === provider);
                  
                  return (
                    <div key={provider}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{providerData?.name || provider}</span>
                        <span>{tokens.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Custo por Provider</h3>
              <div className="space-y-3">
                {Object.entries(usageStats.costByProvider).map(([provider, cost]) => {
                  const total = usageStats.totalCost;
                  const percentage = (cost / total) * 100;
                  const providerData = providers.find(p => p.id === provider);
                  
                  return (
                    <div key={provider}>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{providerData?.name || provider}</span>
                        <span>${cost.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-600 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Gráfico de uso diário */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Uso Diário (Últimos 7 dias)</h3>
            <div className="space-y-4">
              {usageStats.dailyUsage.slice(-7).map((day, index) => {
                const maxRequests = Math.max(...usageStats.dailyUsage.map(d => d.requests));
                const percentage = (day.requests / maxRequests) * 100;
                
                return (
                  <div key={day.date} className="flex items-center space-x-4">
                    <div className="w-20 text-sm text-gray-600">
                      {new Date(day.date).toLocaleDateString('pt-BR', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-blue-600 h-4 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div className="w-32 text-sm text-gray-600 text-right">
                      {day.requests} req
                    </div>
                    
                    <div className="w-24 text-sm text-gray-600 text-right">
                      ${day.cost.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal de configuração */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                {editingConfig ? 'Editar Configuração' : 'Nova Configuração'}
              </h2>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nome da configuração"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Provider *
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        provider: e.target.value,
                        model: '',
                        settings: {}
                      }));
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione um provider</option>
                    {providers.map(provider => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrição da configuração"
                />
              </div>
              
              {selectedProvider && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modelo *
                    </label>
                    <select
                      value={formData.model}
                      onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione um modelo</option>
                      {selectedProvider.models.map(model => (
                        <option key={model.id} value={model.id}>
                          {model.name} (${model.costPer1k}/1k tokens)
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      API Key *
                    </label>
                    <input
                      type="password"
                      value={formData.apiKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Sua API key"
                    />
                  </div>
                </div>
              )}
              
              {selectedProvider && formData.model && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Configurações do Modelo</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedProvider.configFields.map(field => (
                      <div key={field.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                        </label>
                        {field.type === 'number' ? (
                          <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={formData.settings[field.name] ?? field.default}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                [field.name]: parseFloat(e.target.value)
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        ) : field.type === 'select' ? (
                          <select
                            value={formData.settings[field.name] ?? field.default}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                [field.name]: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {field.options?.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={formData.settings[field.name] ?? field.default}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                [field.name]: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Configuração ativa</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Configuração padrão</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {editingConfig ? 'Atualizar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de importação */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Importar Configurações</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Arquivo JSON
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Selecione um arquivo JSON exportado anteriormente.</p>
                <p className="mt-1">As configurações importadas não serão definidas como padrão.</p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleImportConfigs}
                disabled={!importFile || importing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {importing ? 'Importando...' : 'Importar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notificação de erro */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIConfiguration;