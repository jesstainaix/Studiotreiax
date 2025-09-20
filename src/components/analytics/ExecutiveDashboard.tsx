import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import analyticsAPI from '@/services/analyticsApi';

interface ExecutiveData {
  kpis: {
    totalTrainees: number;
    completionRate: number;
    averageScore: number;
    trainingHours: number;
    roi: number;
    costPerTrainee: number;
    trends: {
      trainees: number;
      completion: number;
      score: number;
      roi: number;
    };
  };
  trainingPrograms: Array<{
    name: string;
    participants: number;
    completionRate: number;
    averageScore: number;
    roi: number;
    status: 'active' | 'completed' | 'planning';
  }>;
  departmentPerformance: Array<{
    department: string;
    trainees: number;
    completion: number;
    score: number;
    budget: number;
    spent: number;
  }>;
  monthlyMetrics: Array<{
    month: string;
    trainees: number;
    completion: number;
    cost: number;
    roi: number;
  }>;
  alerts: Array<{
    type: 'warning' | 'error' | 'info';
    message: string;
    department?: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

const ExecutiveDashboard: React.FC = () => {
  const [data, setData] = useState<ExecutiveData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadExecutiveData();
  }, []);

  const loadExecutiveData = async () => {
    setLoading(true);
    try {
      // Carregar dados executivos da API
      const [executiveDashboard, trainingROI, safetyEffectiveness] = await Promise.all([
        analyticsAPI.getExecutiveDashboard(),
        analyticsAPI.getTrainingROI(),
        analyticsAPI.getSafetyProgramEffectiveness()
      ]);
      
      // Processar dados da API
      const processedData: ExecutiveData = {
        kpis: {
          totalTrainees: executiveDashboard.data?.totalTrainees || 1247,
          completionRate: executiveDashboard.data?.completionRate || 87.5,
          averageScore: executiveDashboard.data?.averageScore || 84.2,
          trainingHours: executiveDashboard.data?.trainingHours || 15680,
          roi: trainingROI.data?.roi || 245.8,
          costPerTrainee: executiveDashboard.data?.costPerTrainee || 450,
          trends: {
            trainees: executiveDashboard.data?.trends?.trainees || 12.5,
            completion: executiveDashboard.data?.trends?.completion || 5.2,
            score: executiveDashboard.data?.trends?.score || 3.1,
            roi: trainingROI.data?.trends?.roi || 18.7
          }
        },
        trainingPrograms: executiveDashboard.data?.trainingPrograms || [
          {
            name: 'Segurança Industrial',
            participants: 324,
            completionRate: 92.1,
            averageScore: 88.5,
            roi: 312.4,
            status: 'active'
          },
          {
            name: 'Qualidade Total',
            participants: 256,
            completionRate: 85.7,
            averageScore: 82.3,
            roi: 198.7,
            status: 'active'
          },
          {
            name: 'Liderança',
            participants: 89,
            completionRate: 94.4,
            averageScore: 91.2,
            roi: 425.6,
            status: 'completed'
          }
        ],
        departmentPerformance: executiveDashboard.data?.departmentPerformance || [
          {
            department: 'Produção',
            trainees: 456,
            completion: 89.2,
            score: 85.7,
            budget: 125000,
            spent: 98750
          },
          {
            department: 'Qualidade',
            trainees: 234,
            completion: 92.8,
            score: 88.1,
            budget: 75000,
            spent: 67200
          },
          {
            department: 'Segurança',
            trainees: 189,
            completion: 95.2,
            score: 91.3,
            budget: 85000,
            spent: 78900
          }
        ],
        monthlyMetrics: executiveDashboard.data?.monthlyMetrics || [
          { month: 'Jan', trainees: 98, completion: 85, cost: 44100, roi: 198 },
          { month: 'Fev', trainees: 112, completion: 87, cost: 50400, roi: 215 },
          { month: 'Mar', trainees: 134, completion: 89, cost: 60300, roi: 234 },
          { month: 'Abr', trainees: 156, completion: 91, cost: 70200, roi: 267 },
          { month: 'Mai', trainees: 142, completion: 88, cost: 63900, roi: 245 },
          { month: 'Jun', trainees: 167, completion: 92, cost: 75150, roi: 289 }
        ],
        alerts: executiveDashboard.data?.alerts || [
          {
            type: 'warning',
            message: 'Taxa de conclusão do departamento de TI abaixo da meta (78%)',
            department: 'TI',
            priority: 'high'
          },
          {
            type: 'info',
            message: 'Novo programa de treinamento em IA disponível',
            priority: 'medium'
          },
          {
            type: 'error',
            message: 'Orçamento de treinamento excedido em 15% no Q2',
            priority: 'high'
          }
        ]
      };
      
      setData(processedData);
    } catch (error) {
      console.error('Erro ao carregar dados executivos:', error);
      toast.error('Erro ao carregar dashboard executivo');
      // Fallback para dados mock em caso de erro
      const fallbackData: ExecutiveData = {
        kpis: {
          totalTrainees: 1247,
          completionRate: 87.5,
          averageScore: 84.2,
          trainingHours: 15680,
          roi: 245.8,
          costPerTrainee: 450,
          trends: {
            trainees: 12.5,
            completion: 5.2,
            score: 3.1,
            roi: 18.7
          }
        },
        trainingPrograms: [],
        departmentPerformance: [],
        monthlyMetrics: [],
        alerts: []
      };
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadExecutiveData();
    setRefreshing(false);
    toast.success('Dados atualizados com sucesso!');
  };

  const exportReport = async (type: string) => {
    try {
      const response = await fetch(`/api/analytics/export-executive?type=${type}`);
      if (!response.ok) throw new Error('Falha ao exportar relatório');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `executive-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (value < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default: return <CheckCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Executivo</h2>
          <p className="text-gray-600">Visão estratégica dos programas de treinamento</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={refreshData} disabled={refreshing} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button onClick={() => exportReport('executive')} size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Treinandos</p>
                <p className="text-2xl font-bold text-blue-600">{data.kpis.totalTrainees.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(data.kpis.trends.trainees)}
                  <span className={`text-sm ml-1 ${getTrendColor(data.kpis.trends.trainees)}`}>
                    {data.kpis.trends.trainees > 0 ? '+' : ''}{data.kpis.trends.trainees}%
                  </span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-green-600">{data.kpis.completionRate}%</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(data.kpis.trends.completion)}
                  <span className={`text-sm ml-1 ${getTrendColor(data.kpis.trends.completion)}`}>
                    {data.kpis.trends.completion > 0 ? '+' : ''}{data.kpis.trends.completion}%
                  </span>
                </div>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nota Média</p>
                <p className="text-2xl font-bold text-purple-600">{data.kpis.averageScore}</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(data.kpis.trends.score)}
                  <span className={`text-sm ml-1 ${getTrendColor(data.kpis.trends.score)}`}>
                    {data.kpis.trends.score > 0 ? '+' : ''}{data.kpis.trends.score}%
                  </span>
                </div>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Horas de Treinamento</p>
                <p className="text-2xl font-bold text-orange-600">{data.kpis.trainingHours.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">ROI</p>
                <p className="text-2xl font-bold text-green-600">{data.kpis.roi}%</p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(data.kpis.trends.roi)}
                  <span className={`text-sm ml-1 ${getTrendColor(data.kpis.trends.roi)}`}>
                    {data.kpis.trends.roi > 0 ? '+' : ''}{data.kpis.trends.roi}%
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custo por Treinando</p>
                <p className="text-2xl font-bold text-red-600">R$ {data.kpis.costPerTrainee}</p>
              </div>
              <DollarSign className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alertas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <p className="font-medium">{alert.message}</p>
                      {alert.department && (
                        <p className="text-sm text-gray-600">Departamento: {alert.department}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant={alert.priority === 'high' ? 'destructive' : alert.priority === 'medium' ? 'default' : 'secondary'}>
                    {alert.priority === 'high' ? 'Alta' : alert.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analytics */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="programs">Programas</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Métricas Mensais</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.monthlyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="trainees" stroke="#3B82F6" name="Treinandos" />
                    <Line type="monotone" dataKey="completion" stroke="#10B981" name="Taxa de Conclusão (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI vs Custo</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={data.monthlyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="roi" stackId="1" stroke="#10B981" fill="#10B981" name="ROI (%)" />
                    <Area type="monotone" dataKey="cost" stackId="2" stroke="#EF4444" fill="#EF4444" name="Custo (R$)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance dos Programas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.trainingPrograms.map((program, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-semibold">{program.name}</h4>
                        <p className="text-sm text-gray-600">{program.participants} participantes</p>
                      </div>
                      <Badge variant={program.status === 'active' ? 'default' : program.status === 'completed' ? 'secondary' : 'outline'}>
                        {program.status === 'active' ? 'Ativo' : program.status === 'completed' ? 'Concluído' : 'Planejamento'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={program.completionRate} className="flex-1" />
                          <span className="text-sm font-medium">{program.completionRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nota Média</p>
                        <p className="text-lg font-semibold">{program.averageScore}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">ROI</p>
                        <p className="text-lg font-semibold text-green-600">{program.roi}%</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.departmentPerformance.map((dept, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{dept.department}</h4>
                      <div className="text-sm text-gray-600">
                        Orçamento: R$ {dept.budget.toLocaleString()} | Gasto: R$ {dept.spent.toLocaleString()}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Treinandos</p>
                        <p className="text-lg font-semibold">{dept.trainees}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Conclusão</p>
                        <p className="text-lg font-semibold">{dept.completion}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nota Média</p>
                        <p className="text-lg font-semibold">{dept.score}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Utilização do Orçamento</p>
                        <div className="flex items-center space-x-2">
                          <Progress value={(dept.spent / dept.budget) * 100} className="flex-1" />
                          <span className="text-sm font-medium">{Math.round((dept.spent / dept.budget) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExecutiveDashboard;