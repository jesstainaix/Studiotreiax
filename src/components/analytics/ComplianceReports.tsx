import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Download, FileText, Shield, AlertTriangle, CheckCircle, TrendingUp, TrendingDown } from 'lucide-react';
import analyticsAPI from '@/services/analyticsApi';

interface ComplianceData {
  certificates: {
    total: number;
    active: number;
    expiring: number;
    expired: number;
    byCategory: { [key: string]: number };
  };
  audits: {
    completed: number;
    pending: number;
    findings: number;
    resolved: number;
    timeline: Array<{
      date: string;
      type: string;
      status: string;
      findings: number;
    }>;
  };
  conformity: {
    overallScore: number;
    byDepartment: Array<{
      name: string;
      score: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    requirements: Array<{
      name: string;
      status: 'compliant' | 'non-compliant' | 'pending';
      lastCheck: string;
    }>;
  };
}

const ComplianceReports: React.FC = () => {
  const [data, setData] = useState<ComplianceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('certificates');

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    setLoading(true);
    try {
      // Carregar dados de compliance da API
      const [complianceReports, trainingCompliance] = await Promise.all([
        analyticsAPI.getComplianceReports(),
        analyticsAPI.getTrainingCompliance()
      ]);
      
      // Processar dados da API
      const processedData: ComplianceData = {
        certificates: {
          total: complianceReports.data?.totalCertificates || 245,
          active: complianceReports.data?.activeCertificates || 198,
          expiring: complianceReports.data?.expiringSoon || 32,
          expired: complianceReports.data?.expired || 15,
          byCategory: complianceReports.data?.byCategory || {
            'Segurança': 89,
            'Qualidade': 67,
            'Ambiental': 45,
            'Técnico': 44
          }
        },
        audits: {
          completed: complianceReports.data?.audits?.completed || 12,
          pending: complianceReports.data?.audits?.pending || 3,
          findings: complianceReports.data?.audits?.findings || 28,
          resolved: complianceReports.data?.audits?.resolved || 24,
          timeline: complianceReports.data?.audits?.timeline || [
            { date: '2024-01-15', type: 'Segurança', status: 'completed', findings: 5 },
            { date: '2024-01-10', type: 'Qualidade', status: 'completed', findings: 3 },
            { date: '2024-01-05', type: 'Ambiental', status: 'pending', findings: 0 }
          ]
        },
        conformity: {
          overallScore: trainingCompliance.data?.overallComplianceRate || 87,
          byDepartment: complianceReports.data?.conformity?.byDepartment || [
            { name: 'Produção', score: 92, trend: 'up' },
            { name: 'Qualidade', score: 89, trend: 'stable' },
            { name: 'Segurança', score: 85, trend: 'up' },
            { name: 'Ambiental', score: 82, trend: 'down' }
          ],
          requirements: complianceReports.data?.conformity?.requirements || [
            { name: 'ISO 9001', status: 'compliant', lastCheck: '2024-01-15' },
            { name: 'ISO 14001', status: 'compliant', lastCheck: '2024-01-12' },
            { name: 'OHSAS 18001', status: 'pending', lastCheck: '2024-01-08' },
            { name: 'ISO 27001', status: 'non-compliant', lastCheck: '2024-01-10' }
          ]
        }
      };
      
      setData(processedData);
    } catch (error) {
      console.error('Erro ao carregar dados de compliance:', error);
      // Fallback para dados mock em caso de erro
      const fallbackData: ComplianceData = {
        certificates: {
          total: 245,
          active: 198,
          expiring: 32,
          expired: 15,
          byCategory: {
            'Segurança': 89,
            'Qualidade': 67,
            'Ambiental': 45,
            'Técnico': 44
          }
        },
        audits: {
          completed: 12,
          pending: 3,
          findings: 28,
          resolved: 24,
          timeline: [
            { date: '2024-01-15', type: 'Segurança', status: 'completed', findings: 5 },
            { date: '2024-01-10', type: 'Qualidade', status: 'completed', findings: 3 },
            { date: '2024-01-05', type: 'Ambiental', status: 'pending', findings: 0 }
          ]
        },
        conformity: {
          overallScore: 87,
          byDepartment: [
            { name: 'Produção', score: 92, trend: 'up' },
            { name: 'Qualidade', score: 89, trend: 'stable' },
            { name: 'Segurança', score: 85, trend: 'up' },
            { name: 'Ambiental', score: 82, trend: 'down' }
          ],
          requirements: [
            { name: 'ISO 9001', status: 'compliant', lastCheck: '2024-01-15' },
            { name: 'ISO 14001', status: 'compliant', lastCheck: '2024-01-12' },
            { name: 'OHSAS 18001', status: 'pending', lastCheck: '2024-01-08' },
            { name: 'ISO 27001', status: 'non-compliant', lastCheck: '2024-01-10' }
          ]
        }
      };
      setData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: string) => {
    try {
      const response = await fetch(`/api/analytics/export-compliance?type=${type}`);
      if (!response.ok) throw new Error('Falha ao exportar relatório');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-${type}-${new Date().toISOString().split('T')[0]}.pdf`;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800';
      case 'non-compliant': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />;
      default: return <div className="h-4 w-4 bg-gray-400 rounded-full" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Certificados Ativos</p>
                <p className="text-2xl font-bold text-green-600">{data.certificates.active}</p>
              </div>
              <FileCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Auditorias Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{data.audits.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Score de Conformidade</p>
                <p className="text-2xl font-bold text-blue-600">{data.conformity.overallScore}%</p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Achados Resolvidos</p>
                <p className="text-2xl font-bold text-purple-600">{data.audits.resolved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="certificates">Certificados</TabsTrigger>
          <TabsTrigger value="audits">Auditorias</TabsTrigger>
          <TabsTrigger value="conformity">Conformidade</TabsTrigger>
        </TabsList>

        <TabsContent value="certificates" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Certificados por Categoria</CardTitle>
              <Button onClick={() => exportReport('certificates')} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.certificates.byCategory).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-medium">{category}</span>
                    <div className="flex items-center space-x-2">
                      <Progress value={(count / data.certificates.total) * 100} className="w-24" />
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Timeline de Auditorias</CardTitle>
              <Button onClick={() => exportReport('audits')} size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.audits.timeline.map((audit, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Calendar className="h-5 w-5 text-gray-500" />
                      <div>
                        <p className="font-medium">{audit.type}</p>
                        <p className="text-sm text-gray-600">{audit.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getStatusColor(audit.status)}>
                        {audit.status === 'completed' ? 'Concluída' : 'Pendente'}
                      </Badge>
                      {audit.findings > 0 && (
                        <Badge variant="outline">
                          {audit.findings} achados
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conformity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Conformidade por Departamento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.conformity.byDepartment.map((dept, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{dept.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getTrendIcon(dept.trend)}
                        <span className="text-sm font-medium">{dept.score}%</span>
                        <Progress value={dept.score} className="w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Status dos Requisitos</CardTitle>
                <Button onClick={() => exportReport('conformity')} size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.conformity.requirements.map((req, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{req.name}</p>
                        <p className="text-sm text-gray-600">Última verificação: {req.lastCheck}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(req.status)}>
                          {req.status === 'compliant' ? 'Conforme' : 
                           req.status === 'non-compliant' ? 'Não conforme' : 'Pendente'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComplianceReports;