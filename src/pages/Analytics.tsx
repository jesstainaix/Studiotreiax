import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import RealTimeMetrics from '@/components/analytics/RealTimeMetrics';
import ComplianceReports from '@/components/analytics/ComplianceReports';
import ExecutiveDashboard from '@/components/analytics/ExecutiveDashboard';
import ROIAnalysis from '@/components/analytics/ROIAnalysis';
import SecurityAnalysis from '@/components/analytics/SecurityAnalysis';
import { useAnalytics } from '@/hooks/useAnalytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  Users,
  PlayCircle,
  Award,
  AlertTriangle,
  Download,
  RefreshCw,
  Calendar,
  Target,
  DollarSign
} from 'lucide-react';

interface AnalyticsData {
  engagement: any;
  compliance: any;
  executive: any;
  trainingROI: any;
  safetyPrograms: any;
  certifications: any;
  auditTrail: any;
}

const Analytics: React.FC = () => {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const analytics = useAnalytics();
  
  // Usar hooks do analytics
  const dashboard = analytics.useDashboard();
  const engagement = analytics.useEngagementMetrics();
  const compliance = analytics.useComplianceReporting();
  const systemOverview = analytics.useSystemOverview();
  const realTimeMetrics = analytics.useRealTimeMetrics();
  
  // Estado geral de loading e erro
  const loading = dashboard.loading || engagement.loading || compliance.loading;
  const error = dashboard.error || engagement.error || compliance.error;
  
  // Função para recarregar todos os dados
  const loadAnalyticsData = async () => {
    await Promise.all([
      dashboard.refetch(),
      engagement.refetch(),
      compliance.refetch(),
      systemOverview.refetch(),
      realTimeMetrics.refetch()
    ]);
    setLastRefresh(new Date());
  };
  
  // Dados consolidados para compatibilidade
  const analyticsData = {
    engagement: engagement.data,
    compliance: compliance.data,
    executive: dashboard.data,
    trainingROI: dashboard.data?.trainingROI,
    safetyPrograms: dashboard.data?.safetyPrograms,
    certifications: dashboard.data?.certifications,
    auditTrail: dashboard.data?.auditTrail
  };

  // Exportar relatório
  const exportReport = async (type: string) => {
    try {
      const response = await fetch(`/api/analytics/export?type=${type}&format=xlsx`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error exporting report:', err);
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Cores para gráficos
  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6'
  };

  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
          <span className="ml-2 text-lg">Carregando analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao Carregar Analytics</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={loadAnalyticsData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Última atualização: {lastRefresh.toLocaleString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnalyticsData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => exportReport('complete')}>
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Métricas em Tempo Real */}
      <RealTimeMetrics />

      {/* Tabs principais */}
      <Tabs defaultValue="engagement" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="executive">Executivo</TabsTrigger>
          <TabsTrigger value="roi">ROI</TabsTrigger>
          <TabsTrigger value="safety">Segurança</TabsTrigger>
        </TabsList>

        {/* Tab de Engajamento */}
        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tempo Médio de Visualização</p>
                    <p className="text-2xl font-bold">
                      {analyticsData?.engagement?.averageViewTime || '0'}min
                    </p>
                  </div>
                  <PlayCircle className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                    <p className="text-2xl font-bold">
                      {analyticsData?.engagement?.completionRate || '0'}%
                    </p>
                  </div>
                  <Target className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Usuários Ativos</p>
                    <p className="text-2xl font-bold">
                      {analyticsData?.engagement?.activeUsers || '0'}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Interação</p>
                    <p className="text-2xl font-bold">
                      {analyticsData?.engagement?.interactionRate || '0'}%
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gráfico de Engajamento por Tempo */}
          <Card>
            <CardHeader>
              <CardTitle>Engajamento por Período</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData?.engagement?.timelineData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="views" 
                    stroke={chartColors.primary} 
                    strokeWidth={2}
                    name="Visualizações"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completions" 
                    stroke={chartColors.secondary} 
                    strokeWidth={2}
                    name="Conclusões"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab de Compliance */}
        <TabsContent value="compliance" className="space-y-4">
          <ComplianceReports />
        </TabsContent>

        {/* Tab Executivo */}
        <TabsContent value="executive" className="space-y-4">
          <ExecutiveDashboard />
        </TabsContent>

        {/* Tab ROI */}
        <TabsContent value="roi" className="space-y-4">
          <ROIAnalysis />
        </TabsContent>

        {/* Tab Segurança */}
        <TabsContent value="safety" className="space-y-4">
          <SecurityAnalysis />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;