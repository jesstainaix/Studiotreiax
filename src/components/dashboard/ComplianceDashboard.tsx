import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Shield, Users, AlertTriangle, CheckCircle, TrendingUp, Filter, Download } from 'lucide-react';

interface ComplianceData {
  nr: string;
  nrName: string;
  totalEmployees: number;
  trainedEmployees: number;
  completionRate: number;
  status: 'critical' | 'warning' | 'good' | 'excellent';
  deadline: string;
  departments: DepartmentCompliance[];
}

interface DepartmentCompliance {
  department: string;
  totalEmployees: number;
  trainedEmployees: number;
  completionRate: number;
  status: 'critical' | 'warning' | 'good' | 'excellent';
}

interface ComplianceMetrics {
  overallCompliance: number;
  criticalNRs: number;
  employeesNeedingTraining: number;
  upcomingDeadlines: number;
}

const ComplianceDashboard: React.FC = () => {
  const [complianceData, setComplianceData] = useState<ComplianceData[]>([]);
  const [selectedNR, setSelectedNR] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock data - in real implementation, this would come from an API
  useEffect(() => {
    const mockData: ComplianceData[] = [
      {
        nr: 'NR-01',
        nrName: 'Disposições Gerais',
        totalEmployees: 150,
        trainedEmployees: 142,
        completionRate: 94.7,
        status: 'excellent',
        deadline: '2024-12-31',
        departments: [
          { department: 'Administração', totalEmployees: 25, trainedEmployees: 25, completionRate: 100, status: 'excellent' },
          { department: 'Produção', totalEmployees: 80, trainedEmployees: 75, completionRate: 93.8, status: 'good' },
          { department: 'Manutenção', totalEmployees: 30, trainedEmployees: 28, completionRate: 93.3, status: 'good' },
          { department: 'Qualidade', totalEmployees: 15, trainedEmployees: 14, completionRate: 93.3, status: 'good' }
        ]
      },
      {
        nr: 'NR-05',
        nrName: 'CIPA',
        totalEmployees: 150,
        trainedEmployees: 135,
        completionRate: 90.0,
        status: 'good',
        deadline: '2024-11-30',
        departments: [
          { department: 'Administração', totalEmployees: 25, trainedEmployees: 23, completionRate: 92.0, status: 'good' },
          { department: 'Produção', totalEmployees: 80, trainedEmployees: 70, completionRate: 87.5, status: 'warning' },
          { department: 'Manutenção', totalEmployees: 30, trainedEmployees: 27, completionRate: 90.0, status: 'good' },
          { department: 'Qualidade', totalEmployees: 15, trainedEmployees: 15, completionRate: 100, status: 'excellent' }
        ]
      },
      {
        nr: 'NR-06',
        nrName: 'EPI',
        totalEmployees: 150,
        trainedEmployees: 120,
        completionRate: 80.0,
        status: 'warning',
        deadline: '2024-10-15',
        departments: [
          { department: 'Administração', totalEmployees: 25, trainedEmployees: 22, completionRate: 88.0, status: 'warning' },
          { department: 'Produção', totalEmployees: 80, trainedEmployees: 60, completionRate: 75.0, status: 'critical' },
          { department: 'Manutenção', totalEmployees: 30, trainedEmployees: 25, completionRate: 83.3, status: 'warning' },
          { department: 'Qualidade', totalEmployees: 15, trainedEmployees: 13, completionRate: 86.7, status: 'warning' }
        ]
      },
      {
        nr: 'NR-10',
        nrName: 'Segurança em Instalações Elétricas',
        totalEmployees: 45,
        trainedEmployees: 30,
        completionRate: 66.7,
        status: 'critical',
        deadline: '2024-09-30',
        departments: [
          { department: 'Manutenção', totalEmployees: 30, trainedEmployees: 18, completionRate: 60.0, status: 'critical' },
          { department: 'Produção', totalEmployees: 15, trainedEmployees: 12, completionRate: 80.0, status: 'warning' }
        ]
      },
      {
        nr: 'NR-12',
        nrName: 'Segurança no Trabalho em Máquinas',
        totalEmployees: 110,
        trainedEmployees: 88,
        completionRate: 80.0,
        status: 'warning',
        deadline: '2024-11-15',
        departments: [
          { department: 'Produção', totalEmployees: 80, trainedEmployees: 62, completionRate: 77.5, status: 'warning' },
          { department: 'Manutenção', totalEmployees: 30, trainedEmployees: 26, completionRate: 86.7, status: 'warning' }
        ]
      }
    ];

    const mockMetrics: ComplianceMetrics = {
      overallCompliance: 82.3,
      criticalNRs: 1,
      employeesNeedingTraining: 127,
      upcomingDeadlines: 2
    };

    setTimeout(() => {
      setComplianceData(mockData);
      setMetrics(mockMetrics);
      setLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const filteredData = complianceData.filter(item => {
    if (selectedNR !== 'all' && item.nr !== selectedNR) return false;
    if (selectedDepartment !== 'all') {
      return item.departments.some(dept => dept.department === selectedDepartment);
    }
    return true;
  });

  const chartData = filteredData.map(item => ({
    nr: item.nr,
    nrName: item.nrName.substring(0, 20) + '...',
    completionRate: item.completionRate,
    trained: item.trainedEmployees,
    total: item.totalEmployees
  }));

  const pieData = [
    { name: 'Treinados', value: filteredData.reduce((acc, item) => acc + item.trainedEmployees, 0), color: '#10B981' },
    { name: 'Pendentes', value: filteredData.reduce((acc, item) => acc + (item.totalEmployees - item.trainedEmployees), 0), color: '#EF4444' }
  ];

  const departmentData = selectedNR !== 'all' 
    ? complianceData.find(item => item.nr === selectedNR)?.departments.map(dept => ({
        department: dept.department,
        completionRate: dept.completionRate,
        trained: dept.trainedEmployees,
        total: dept.totalEmployees
      })) || []
    : [];

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
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Dashboard de Compliance NR
          </h2>
          <p className="text-gray-600 mt-1">Acompanhe o status de treinamento por Norma Regulamentadora</p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Exportar Relatório
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Compliance Geral</p>
                <p className="text-2xl font-bold text-blue-600">{metrics.overallCompliance}%</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">NRs Críticas</p>
                <p className="text-2xl font-bold text-red-600">{metrics.criticalNRs}</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Funcionários Pendentes</p>
                <p className="text-2xl font-bold text-orange-600">{metrics.employeesNeedingTraining}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Prazos Próximos</p>
                <p className="text-2xl font-bold text-purple-600">{metrics.upcomingDeadlines}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <AlertTriangle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <div className="flex gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Norma Regulamentadora</label>
              <select 
                value={selectedNR} 
                onChange={(e) => setSelectedNR(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todas as NRs</option>
                {complianceData.map(item => (
                  <option key={item.nr} value={item.nr}>{item.nr} - {item.nrName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Departamento</label>
              <select 
                value={selectedDepartment} 
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="all">Todos os Departamentos</option>
                <option value="Administração">Administração</option>
                <option value="Produção">Produção</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Qualidade">Qualidade</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Compliance by NR */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Taxa de Compliance por NR</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="nr" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'completionRate' ? `${value}%` : value,
                  name === 'completionRate' ? 'Taxa de Conclusão' : name
                ]}
              />
              <Legend />
              <Bar dataKey="completionRate" fill="#3B82F6" name="Taxa de Conclusão (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart - Overall Training Status */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Status Geral de Treinamento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Breakdown (when NR is selected) */}
      {selectedNR !== 'all' && departmentData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Breakdown por Departamento - {selectedNR}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis domain={[0, 100]} />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'completionRate' ? `${value}%` : value,
                  name === 'completionRate' ? 'Taxa de Conclusão' : name
                ]}
              />
              <Legend />
              <Bar dataKey="completionRate" fill="#10B981" name="Taxa de Conclusão (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Detailed Table */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Detalhamento por NR</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NR</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Funcionários</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treinados</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prazo</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.nr} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.nr}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.nrName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.totalEmployees}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.trainedEmployees}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.completionRate}%</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {item.status === 'excellent' ? 'Excelente' :
                       item.status === 'good' ? 'Bom' :
                       item.status === 'warning' ? 'Atenção' : 'Crítico'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(item.deadline).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComplianceDashboard;