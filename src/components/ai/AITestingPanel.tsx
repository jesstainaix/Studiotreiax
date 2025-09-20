import React, { useState } from 'react';
import { Play, Square, RefreshCw, CheckCircle, AlertTriangle, XCircle, Clock, Zap, Shield, Link } from 'lucide-react';
import { useAIIntegrationTests, TestSuite, TestResult } from '../../tests/aiIntegrationTest';

// Interface para props do componente
interface AITestingPanelProps {
  className?: string;
  onTestComplete?: (results: TestSuite) => void;
}

// Componente principal do painel de testes
export const AITestingPanel: React.FC<AITestingPanelProps> = ({
  className = '',
  onTestComplete
}) => {
  const {
    isRunning,
    results,
    error,
    runTests,
    runSpecificTest,
    clearResults,
    clearError
  } = useAIIntegrationTests();

  const [selectedTest, setSelectedTest] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<boolean>(false);

  // Lista de testes específicos disponíveis
  const specificTests = [
    { id: 'content-analysis', name: 'Análise de Conteúdo', icon: <Zap className="w-4 h-4" /> },
    { id: 'subtitle', name: 'Geração de Legendas', icon: <CheckCircle className="w-4 h-4" /> },
    { id: 'transcription', name: 'Transcrição de Voz', icon: <Play className="w-4 h-4" /> },
    { id: 'smart-editing', name: 'Edição Inteligente', icon: <RefreshCw className="w-4 h-4" /> },
    { id: 'integration', name: 'Integração de Serviços', icon: <Link className="w-4 h-4" /> },
    { id: 'performance', name: 'Performance', icon: <Zap className="w-4 h-4" /> },
    { id: 'error-handling', name: 'Tratamento de Erros', icon: <Shield className="w-4 h-4" /> }
  ];

  // Executar teste selecionado
  const handleRunTest = async () => {
    clearError();
    
    if (selectedTest === 'all') {
      await runTests();
    } else {
      await runSpecificTest(selectedTest);
    }
    
    if (results && onTestComplete) {
      onTestComplete(results);
    }
  };

  // Obter ícone do status
  const getStatusIcon = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  // Obter cor do status
  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  // Calcular estatísticas dos resultados
  const getResultStats = (results: TestSuite) => {
    const total = results.results.length;
    const successRate = Math.round((results.successCount / total) * 100);
    const avgDuration = Math.round(results.totalDuration / total);
    
    return { total, successRate, avgDuration };
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Testes de Integração IA
              </h2>
              <p className="text-sm text-gray-500">
                Verificar funcionamento dos serviços de IA
              </p>
            </div>
          </div>
          
          {results && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                {showDetails ? 'Ocultar' : 'Mostrar'} Detalhes
              </button>
              <button
                onClick={clearResults}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Limpar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Seleção de Teste */}
      <div className="p-6 border-b border-gray-200">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecionar Teste
            </label>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              disabled={isRunning}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="all">🚀 Executar Todos os Testes</option>
              {specificTests.map(test => (
                <option key={test.id} value={test.id}>
                  {test.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunTest}
            disabled={isRunning}
            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Executando Testes...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Executar Teste</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                Erro na Execução dos Testes
              </h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={clearError}
                className="text-sm text-red-600 hover:text-red-800 mt-2 underline"
              >
                Limpar Erro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resultados */}
      {results && (
        <div className="p-6">
          {/* Resumo dos Resultados */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Resumo dos Resultados
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Duração</span>
                </div>
                <p className="text-2xl font-bold text-blue-900 mt-1">
                  {results.totalDuration}ms
                </p>
              </div>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Sucessos</span>
                </div>
                <p className="text-2xl font-bold text-green-900 mt-1">
                  {results.successCount}
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Avisos</span>
                </div>
                <p className="text-2xl font-bold text-yellow-900 mt-1">
                  {results.warningCount}
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Erros</span>
                </div>
                <p className="text-2xl font-bold text-red-900 mt-1">
                  {results.errorCount}
                </p>
              </div>
            </div>

            {/* Taxa de Sucesso */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Taxa de Sucesso
                </span>
                <span className={`text-lg font-bold ${
                  getResultStats(results).successRate >= 90 ? 'text-green-600' :
                  getResultStats(results).successRate >= 70 ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {getResultStats(results).successRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    getResultStats(results).successRate >= 90 ? 'bg-green-500' :
                    getResultStats(results).successRate >= 70 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${getResultStats(results).successRate}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lista de Resultados Detalhados */}
          {showDetails && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Resultados Detalhados
              </h3>
              
              <div className="space-y-3">
                {results.results.map((result, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {getStatusIcon(result.status)}
                        <div className="flex-1">
                          <h4 className="font-medium">{result.service}</h4>
                          <p className="text-sm mt-1">{result.message}</p>
                          
                          {result.details && (
                            <div className="mt-2 text-xs">
                              <strong>Detalhes:</strong>
                              <pre className="mt-1 bg-white bg-opacity-50 p-2 rounded text-xs overflow-x-auto">
                                {JSON.stringify(result.details, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right text-xs opacity-75">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{result.duration}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recomendações */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              💡 Recomendações
            </h3>
            <div className="text-sm text-blue-700">
              {results.errorCount === 0 && results.warningCount === 0 && (
                <p>🎉 Todos os testes passaram! Sistema pronto para produção.</p>
              )}
              {results.errorCount === 0 && results.warningCount > 0 && (
                <p>✨ Testes concluídos com avisos. Sistema funcional mas pode ser otimizado.</p>
              )}
              {results.errorCount > 0 && (
                <p>🔧 Erros encontrados. Corrija os problemas antes de prosseguir.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {!results && !isRunning && !error && (
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Play className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Pronto para Testar
          </h3>
          <p className="text-gray-500 mb-4">
            Selecione um teste e clique em "Executar Teste" para verificar o funcionamento dos serviços de IA.
          </p>
          <div className="text-sm text-gray-400">
            <p>• Análise de conteúdo e detecção de cenas</p>
            <p>• Geração de legendas com reconhecimento de fala</p>
            <p>• Transcrição de voz com sincronização</p>
            <p>• Sugestões inteligentes de edição</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITestingPanel;