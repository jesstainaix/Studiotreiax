import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navigation from '../components/layout/Navigation';
import { 
  BarChart3, 
  ArrowLeft,
  TrendingUp,
  Eye,
  Users,
  Clock,
  Download,
  Share2,
  Filter,
  Calendar,
  PlayCircle,
  Pause,
  Heart,
  MessageCircle,
  ThumbsUp
} from 'lucide-react';

const VideoAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('7d');

  const analyticsData = {
    totalViews: 125420,
    uniqueViewers: 89340,
    avgWatchTime: '3:42',
    engagement: 78.5,
    retention: 65.2,
    shares: 2847
  };

  const topVideos = [
    { id: 1, title: 'Treinamento de Segurança NR-12', views: 15420, duration: '12:34', engagement: 85.2 },
    { id: 2, title: 'Procedimentos de Emergência', views: 12850, duration: '8:45', engagement: 78.9 },
    { id: 3, title: 'Uso de EPIs', views: 9680, duration: '6:20', engagement: 82.1 },
    { id: 4, title: 'Operação de Máquinas', views: 8940, duration: '15:12', engagement: 76.4 },
    { id: 5, title: 'Primeiros Socorros', views: 7850, duration: '10:08', engagement: 89.3 }
  ];

  const engagementData = [
    { time: '0s', retention: 100 },
    { time: '30s', retention: 87 },
    { time: '1m', retention: 75 },
    { time: '2m', retention: 68 },
    { time: '3m', retention: 62 },
    { time: '4m', retention: 58 },
    { time: '5m', retention: 52 }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentPage="video-analytics" />
      
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
              Analytics de Vídeo
            </h1>
            <p className="text-gray-600">
              Acompanhe o desempenho e engajamento dos seus vídeos
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="90d">Últimos 90 dias</option>
              </select>
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Filter className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 rounded-xl text-white">
              <BarChart3 className="w-8 h-8" />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          {[
            { label: 'Visualizações Totais', value: analyticsData.totalViews.toLocaleString(), icon: Eye, change: '+12.5%', color: 'blue' },
            { label: 'Espectadores Únicos', value: analyticsData.uniqueViewers.toLocaleString(), icon: Users, change: '+8.2%', color: 'green' },
            { label: 'Tempo Médio', value: analyticsData.avgWatchTime, icon: Clock, change: '+0:15', color: 'yellow' },
            { label: 'Engajamento', value: `${analyticsData.engagement}%`, icon: Heart, change: '+2.1%', color: 'red' },
            { label: 'Retenção', value: `${analyticsData.retention}%`, icon: TrendingUp, change: '+1.8%', color: 'purple' },
            { label: 'Compartilhamentos', value: analyticsData.shares.toLocaleString(), icon: Share2, change: '+15.3%', color: 'orange' }
          ].map((metric, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${
                  metric.color === 'blue' ? 'bg-blue-100' :
                  metric.color === 'green' ? 'bg-green-100' :
                  metric.color === 'yellow' ? 'bg-yellow-100' :
                  metric.color === 'red' ? 'bg-red-100' :
                  metric.color === 'purple' ? 'bg-purple-100' : 'bg-orange-100'
                }`}>
                  <metric.icon className={`w-5 h-5 ${
                    metric.color === 'blue' ? 'text-blue-600' :
                    metric.color === 'green' ? 'text-green-600' :
                    metric.color === 'yellow' ? 'text-yellow-600' :
                    metric.color === 'red' ? 'text-red-600' :
                    metric.color === 'purple' ? 'text-purple-600' : 'text-orange-600'
                  }`} />
                </div>
                <span className="text-sm font-medium text-green-600">{metric.change}</span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{metric.label}</h3>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Top Videos */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Vídeos com Melhor Performance
                </h2>
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {topVideos.map((video) => (
                  <div key={video.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center">
                        <PlayCircle className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{video.title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{video.views.toLocaleString()} visualizações</span>
                          <span>{video.duration}</span>
                          <span>{video.engagement}% engajamento</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Retention Chart */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Curva de Retenção de Audiência
              </h2>
              <div className="space-y-4">
                <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Gráfico de Retenção</p>
                    <p className="text-sm text-gray-500 mt-2">Mostra quando os usuários param de assistir</p>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-xs text-gray-600">
                  {engagementData.map((point, index) => (
                    <div key={index} className="text-center">
                      <div className="text-gray-900 font-medium">{point.retention}%</div>
                      <div>{point.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Real-time Stats */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estatísticas em Tempo Real
              </h3>
              <div className="space-y-4">
                {[
                  { label: 'Assistindo agora', value: '47', icon: Eye, color: 'green' },
                  { label: 'Novos seguidores', value: '+23', icon: Users, color: 'blue' },
                  { label: 'Comentários hoje', value: '156', icon: MessageCircle, color: 'yellow' },
                  { label: 'Likes hoje', value: '892', icon: ThumbsUp, color: 'red' }
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

            {/* Performance Insights */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Insights de Performance
              </h3>
              <div className="space-y-3">
                {[
                  { 
                    insight: 'Vídeos de 5-8 min têm melhor retenção',
                    type: 'positive',
                    action: 'Otimizar duração'
                  },
                  { 
                    insight: 'Horário de pico: 14h-16h',
                    type: 'info',
                    action: 'Agendar publicações'
                  },
                  { 
                    insight: 'Thumbnails com texto aumentam CTR em 23%',
                    type: 'positive',
                    action: 'Melhorar thumbnails'
                  },
                  { 
                    insight: 'Engagement cai após 3min',
                    type: 'warning',
                    action: 'Revisar introduções'
                  }
                ].map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}>
                    <p className={`text-sm font-medium ${
                      insight.type === 'positive' ? 'text-green-800' :
                      insight.type === 'warning' ? 'text-yellow-800' :
                      'text-blue-800'
                    }`}>{insight.insight}</p>
                    <p className={`text-xs mt-1 ${
                      insight.type === 'positive' ? 'text-green-600' :
                      insight.type === 'warning' ? 'text-yellow-600' :
                      'text-blue-600'
                    }`}>{insight.action}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Export Options */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Exportar Relatórios
              </h3>
              <div className="space-y-3">
                {[
                  'Relatório Completo (PDF)',
                  'Dados Brutos (CSV)',
                  'Apresentação (PPT)',
                  'Dashboard Personalizado'
                ].map((option, index) => (
                  <button 
                    key={index}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{option}</span>
                    <Download className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalytics;