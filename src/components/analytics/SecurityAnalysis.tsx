import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Shield, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, Eye, Lock } from 'lucide-react';
import analyticsAPI from '@/services/analyticsApi';

interface SecurityData {
  overallScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  totalIncidents: number;
  resolvedIncidents: number;
  pendingIncidents: number;
  averageResponseTime: number;
  complianceRate: number;
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  incidentTrends: Array<{
    month: string;
    incidents: number;
    resolved: number;
    responseTime: number;
  }>;
  riskCategories: Array<{
    category: string;
    score: number;
    incidents: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  departmentRisks: Array<{
    department: string;
    riskScore: number;
    incidents: number;
    compliance: number;
    training: number;
  }>;
  threatTypes: Array<{
    type: string;
    count: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    trend: number;
  }>;
  securityMetrics: {
    phishingTests: {
      sent: number;
      clicked: number;
      reported: number;
      rate: number;
    };
    accessControl: {
      violations: number;
      unauthorized: number;
      privileged: number;
    };
    dataProtection: {
      breaches: number;
      exposures: number;
      encrypted: number;
    };
  };
}

const SecurityAnalysis: React.FC = () => {
  const [securityData, setSecurityData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [autoRefresh, setAutoRefresh] = useState(false);

  useEffect(() => {
    loadSecurityData();
    
    if (autoRefresh) {
      const interval = setInterval(loadSecurityData, 30000); // Refresh a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [selectedPeriod, autoRefresh]);

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      // Carregar dados de segurança da API
      const [securityAnalysis, incidentAnalysis] = await Promise.all([
        analyticsAPI.getSecurityAnalysis(),
        analyticsAPI.getIncidentAnalysis()
      ]);
      
      // Processar dados da API
      const processedData: SecurityData = {
        overallScore: securityAnalysis.data?.overallScore || 78,
        riskLevel: securityAnalysis.data?.riskLevel || 'medium',
        totalIncidents: incidentAnalysis.data?.totalIncidents || 45,
        resolvedIncidents: incidentAnalysis.data?.resolvedIncidents || 38,
        pendingIncidents: incidentAnalysis.data?.pendingIncidents || 7,
        averageResponseTime: incidentAnalysis.data?.averageResponseTime || 4.2,
        complianceRate: securityAnalysis.data?.complianceRate || 92,
        vulnerabilities: securityAnalysis.data?.vulnerabilities || {
          critical: 2,
          high: 8,
          medium: 15,
          low: 23
        },
        incidentTrends: incidentAnalysis.data?.incidentTrends || [
          { month: 'Jan', incidents: 12, resolved: 10, responseTime: 5.1 },
          { month: 'Fev', incidents: 8, resolved: 8, responseTime: 4.8 },
          { month: 'Mar', incidents: 15, resolved: 13, responseTime: 4.2 },
          { month: 'Abr', incidents: 6, resolved: 6, responseTime: 3.9 },
          { month: 'Mai', incidents: 11, resolved: 9, responseTime: 4.5 },
          { month: 'Jun', incidents: 9, resolved: 8, responseTime: 4.1 }
        ],
        riskCategories: securityAnalysis.data?.riskCategories || [
          { category: 'Phishing', score: 85, incidents: 12, trend: 'down' },
          { category: 'Malware', score: 72, incidents: 8, trend: 'stable' },
          { category: 'Acesso Não Autorizado', score: 68, incidents: 15, trend: 'up' },
          { category: 'Vazamento de Dados', score: 90, incidents: 3, trend: 'down' },
          { category: 'Engenharia Social', score: 75, incidents: 7, trend: 'stable' }
        ],
        departmentRisks: securityAnalysis.data?.departmentRisks || [
          { department: 'TI', riskScore: 85, incidents: 8, compliance: 95, training: 88 },
          { department: 'RH', riskScore: 72, incidents: 12, compliance: 89, training: 92 },
          { department: 'Financeiro', riskScore: 78, incidents: 6, compliance: 94, training: 85 },
          { department: 'Operações', riskScore: 65, incidents: 15, compliance: 87, training: 78 },
          { department: 'Vendas', riskScore: 70, incidents: 4, compliance: 91, training: 82 }
        ],
        threatTypes: securityAnalysis.data?.threatTypes || [
          { type: 'Email Phishing', count: 18, severity: 'high', trend: -15 },
          { type: 'Malware', count: 12, severity: 'critical', trend: -8 },
          { type: 'Ransomware', count: 3, severity: 'critical', trend: -25 },
          { type: 'Insider Threat', count: 7, severity: 'medium', trend: 12 },
          { type: 'DDoS', count: 5, severity: 'medium', trend: -5 }
        ],
        securityMetrics: securityAnalysis.data?.securityMetrics || {
          phishingTests: {
            sent: 500,
            clicked: 45,
            reported: 380,
            rate: 9
          },
          accessControl: {
            violations: 23,
            unauthorized: 8,
            privileged: 156
          },
          dataProtection: {
            breaches: 2,
            exposures: 5,
            encrypted: 98
          }
        }
      };
      setSecurityData(processedData);
    } catch (error) {
      console.error('Erro ao carregar dados de segurança:', error);
      // Fallback para dados mock em caso de erro
      const fallbackData: SecurityData = {
        overallScore: 78,
        riskLevel: 'medium',
        totalIncidents: 45,
        resolvedIncidents: 38,
        pendingIncidents: 7,
        averageResponseTime: 4.2,
        complianceRate: 92,
        vulnerabilities: { critical: 2, high: 8, medium: 15, low: 23 },
        incidentTrends: [],
        riskCategories: [],
        departmentRisks: [],
        threatTypes: [],
        securityMetrics: {
          phishingTests: { sent: 0, clicked: 0, reported: 0, rate: 0 },
          accessControl: { violations: 0, unauthorized: 0, privileged: 0 },
          dataProtection: { breaches: 0, exposures: 0, encrypted: 0 }
        }
      };
      setSecurityData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const exportSecurityReport = () => {
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'low': return <CheckCircle className="h-5 w-5" />;
      case 'medium': return <AlertTriangle className="h-5 w-5" />;
      case 'high': return <AlertTriangle className="h-5 w-5" />;
      case 'critical': return <XCircle className="h-5 w-5" />;
      default: return <Shield className="h-5 w-5" />;
    }
  };

  const getTrendIcon = (trend: string | number) => {
    if (typeof trend === 'string') {
      switch (trend) {
        case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />;
        case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />;
        default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
      }
    }
    return trend > 0 ? 
      <TrendingUp className="h-4 w-4 text-red-500" /> : 
      <TrendingDown className="h-4 w-4 text-green-500" />;
  };

  const chartColors = {
    primary: '#3b82f6',
    secondary: '#10b981',
    accent: '#f59e0b',
    danger: '#ef4444',
    warning: '#f97316'
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
      {/* Header com controles */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Análise de Segurança</h2>
          <p className="text-gray-600">Monitoramento de riscos e incidentes de segurança</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="7days">Últimos 7 dias</option>
            <option value="30days">Últimos 30 dias</option>
            <option value="90days">Últimos 90 dias</option>
          </select>
          <Button 
            onClick={() => setAutoRefresh(!autoRefresh)} 
            variant={autoRefresh ? 'default' : 'outline'}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button onClick={exportSecurityReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Status geral de segurança */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score de Segurança</p>
                <p className="text-2xl font-bold text-blue-600">
                  {securityData?.overallScore}/100
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Nível de Risco</p>
                <Badge className={getRiskLevelColor(securityData?.riskLevel || 'low')}>
                  {getRiskLevelIcon(securityData?.riskLevel || 'low')}
                  <span className="ml-1 capitalize">{securityData?.riskLevel}</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Incidentes Ativos</p>
                <p className="text-2xl font-bold text-red-600">
                  {securityData?.pendingIncidents}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tempo de Resposta</p>
                <p className="text-2xl font-bold text-gray-900">
                  {securityData?.averageResponseTime}h
                </p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance</p>
                <p className="text-2xl font-bold text-green-600">
                  {securityData?.complianceRate}%
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de análise detalhada */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
          <TabsTrigger value="vulnerabilities">Vulnerabilidades</TabsTrigger>
          <TabsTrigger value="departments">Departamentos</TabsTrigger>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tendência de Incidentes</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={securityData?.incidentTrends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="incidents" 
                      stroke={chartColors.danger} 
                      strokeWidth={2}
                      name="Incidentes"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="resolved" 
                      stroke={chartColors.secondary} 
                      strokeWidth={2}
                      name="Resolvidos"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Categorias de Risco</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={securityData?.riskCategories || []}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="category" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar
                      name="Score de Segurança"
                      dataKey="score"
                      stroke={chartColors.primary}
                      fill={chartColors.primary}
                      fillOpacity={0.3}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tipos de Ameaças</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityData?.threatTypes.map((threat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getRiskLevelColor(threat.severity)}>
                        {threat.severity}
                      </Badge>
                      <span className="font-medium">{threat.type}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-lg font-bold">{threat.count}</span>
                      <div className="flex items-center space-x-1">
                        {getTrendIcon(threat.trend)}
                        <span className={`text-sm ${threat.trend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {Math.abs(threat.trend)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total de Incidentes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {securityData?.totalIncidents}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Resolvidos</p>
                    <p className="text-2xl font-bold text-green-600">
                      {securityData?.resolvedIncidents}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-red-600">
                      {securityData?.pendingIncidents}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tempo de Resposta por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={securityData?.incidentTrends || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value}h`, 'Tempo de Resposta']} />
                  <Bar dataKey="responseTime" fill={chartColors.accent} name="Tempo de Resposta (h)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vulnerabilities" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Críticas</p>
                    <p className="text-2xl font-bold text-red-600">
                      {securityData?.vulnerabilities.critical}
                    </p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Altas</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {securityData?.vulnerabilities.high}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Médias</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {securityData?.vulnerabilities.medium}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Baixas</p>
                    <p className="text-2xl font-bold text-green-600">
                      {securityData?.vulnerabilities.low}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Risco por Departamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityData?.departmentRisks.map((dept, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-900">{dept.department}</h4>
                      <Badge className={getRiskLevelColor(dept.riskScore >= 80 ? 'low' : dept.riskScore >= 60 ? 'medium' : 'high')}>
                        Score: {dept.riskScore}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Incidentes</p>
                        <p className="font-semibold text-red-600">{dept.incidents}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Compliance</p>
                        <p className="font-semibold text-green-600">{dept.compliance}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Treinamento</p>
                        <p className="font-semibold text-blue-600">{dept.training}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Status</p>
                        <div className="flex items-center">
                          {dept.riskScore >= 80 ? 
                            <CheckCircle className="h-4 w-4 text-green-500" /> :
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Testes de Phishing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Enviados:</span>
                  <span className="font-semibold">{securityData?.securityMetrics.phishingTests.sent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Clicados:</span>
                  <span className="font-semibold text-red-600">{securityData?.securityMetrics.phishingTests.clicked}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reportados:</span>
                  <span className="font-semibold text-green-600">{securityData?.securityMetrics.phishingTests.reported}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Sucesso:</span>
                  <span className="font-semibold text-blue-600">{securityData?.securityMetrics.phishingTests.rate}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Controle de Acesso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Violações:</span>
                  <span className="font-semibold text-red-600">{securityData?.securityMetrics.accessControl.violations}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Não Autorizados:</span>
                  <span className="font-semibold text-orange-600">{securityData?.securityMetrics.accessControl.unauthorized}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Acessos Privilegiados:</span>
                  <span className="font-semibold text-blue-600">{securityData?.securityMetrics.accessControl.privileged}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Proteção de Dados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Vazamentos:</span>
                  <span className="font-semibold text-red-600">{securityData?.securityMetrics.dataProtection.breaches}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Exposições:</span>
                  <span className="font-semibold text-orange-600">{securityData?.securityMetrics.dataProtection.exposures}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Dados Criptografados:</span>
                  <span className="font-semibold text-green-600">{securityData?.securityMetrics.dataProtection.encrypted}%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityAnalysis;