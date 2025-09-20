import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import { 
  Zap, 
  ArrowLeft,
  TrendingUp,
  Database,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Activity,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

const PerformanceOptimizer: React.FC = () => {
  const navigate = useNavigate();
  const [isOptimizing, setIsOptimizing] = useState(false);

  const performanceMetrics = [
    { label: 'CPU Usage', value: '45%', status: 'good', color: 'green' },
    { label: 'Memory Usage', value: '67%', status: 'warning', color: 'yellow' },
    { label: 'Disk I/O', value: '23%', status: 'good', color: 'green' },
    { label: 'Network', value: '89%', status: 'critical', color: 'red' }
  ];

  const optimizationTasks = [
    { id: 1, name: 'Limpeza de cache temporário', status: 'completed', time: '2.3s' },
    { id: 2, name: 'Otimização de banco de dados', status: 'completed', time: '5.7s' },
    { id: 3, name: 'Compressão de imagens', status: 'running', time: '12.1s' },
    { id: 4, name: 'Minificação de assets', status: 'pending', time: '--' },
    { id: 5, name: 'Otimização de queries', status: 'pending', time: '--' }
  ];

  const handleOptimize = () => {
    setIsOptimizing(true);
    setTimeout(() => setIsOptimizing(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="performance-optimizer" />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Otimizador de Performance
            </h1>
            <p className="text-gray-600">
              Monitore e otimize o desempenho do seu sistema em tempo real
            </p>
          </div>
          <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-4 rounded-xl text-white">
            <Zap className="w-8 h-8" />
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {performanceMetrics.map((metric, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  metric.color === 'green' ? 'bg-green-100' :
                  metric.color === 'yellow' ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  {index === 0 && <Cpu className={`w-5 h-5 ${
                    metric.color === 'green' ? 'text-green-600' :
                    metric.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`} />}
                  {index === 1 && <Activity className={`w-5 h-5 ${
                    metric.color === 'green' ? 'text-green-600' :
                    metric.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`} />}
                  {index === 2 && <HardDrive className={`w-5 h-5 ${
                    metric.color === 'green' ? 'text-green-600' :
                    metric.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`} />}
                  {index === 3 && <Wifi className={`w-5 h-5 ${
                    metric.color === 'green' ? 'text-green-600' :
                    metric.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                  }`} />}
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  metric.status === 'good' ? 'bg-green-100 text-green-800' :
                  metric.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {metric.status === 'good' ? 'Bom' :
                   metric.status === 'warning' ? 'Atenção' : 'Crítico'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{metric.label}</h3>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Optimization Tasks */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Tarefas de Otimização
                </h2>
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    isOptimizing
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                  }`}
                >
                  {isOptimizing ? 'Otimizando...' : 'Iniciar Otimização'}
                </button>
              </div>

              <div className="space-y-4">
                {optimizationTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`p-1 rounded-full ${
                        task.status === 'completed' ? 'bg-green-100' :
                        task.status === 'running' ? 'bg-yellow-100' : 'bg-gray-100'
                      }`}>
                        {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {task.status === 'running' && <Clock className="w-4 h-4 text-yellow-600 animate-spin" />}
                        {task.status === 'pending' && <Clock className="w-4 h-4 text-gray-400" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{task.name}</p>
                        <p className="text-sm text-gray-500">
                          {task.status === 'completed' ? 'Concluído' :
                           task.status === 'running' ? 'Em execução' : 'Aguardando'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{task.time}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
                  <span className="text-sm font-medium text-gray-700">40%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Performance Score */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Score de Performance
              </h3>
              <div className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-4">
                  <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 24 24">
                    <circle
                      className="text-gray-200"
                      strokeWidth="2"
                      stroke="currentColor"
                      fill="transparent"
                      r="10"
                      cx="12"
                      cy="12"
                    />
                    <circle
                      className="text-yellow-500"
                      strokeWidth="2"
                      strokeDasharray={62.8}
                      strokeDashoffset={25.12}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="10"
                      cx="12"
                      cy="12"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">75</span>
                  </div>
                </div>
                <p className="text-gray-600">Desempenho Bom</p>
                <p className="text-sm text-gray-500 mt-1">+12 pontos esta semana</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estatísticas Rápidas
              </h3>
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, label: 'Melhoria Total', value: '+23%', color: 'green' },
                  { icon: Database, label: 'Cache Hits', value: '94.2%', color: 'blue' },
                  { icon: BarChart3, label: 'Tempo de Resposta', value: '145ms', color: 'yellow' },
                  { icon: AlertTriangle, label: 'Alertas Ativos', value: '3', color: 'red' }
                ].map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        stat.color === 'green' ? 'bg-green-100' :
                        stat.color === 'blue' ? 'bg-blue-100' :
                        stat.color === 'yellow' ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <stat.icon className={`w-4 h-4 ${
                          stat.color === 'green' ? 'text-green-600' :
                          stat.color === 'blue' ? 'text-blue-600' :
                          stat.color === 'yellow' ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <span className="text-gray-700">{stat.label}</span>
                    </div>
                    <span className="font-semibold text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Recomendações
              </h3>
              <div className="space-y-3">
                {[
                  'Ativar compressão GZIP',
                  'Implementar lazy loading',
                  'Otimizar consultas SQL',
                  'Reduzir bundle JavaScript'
                ].map((recommendation, index) => (
                  <div key={index} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-yellow-800">{recommendation}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceOptimizer;