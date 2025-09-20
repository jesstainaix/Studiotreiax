import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Play, 
  Pause, 
  RefreshCw, 
  Settings, 
  AlertTriangle, 
  Shield, 
  Zap, 
  Package, 
  GitBranch, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Clock, 
  Users, 
  FileText, 
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronRight,
  Eye,
  Trash2,
  Edit
} from 'lucide-react';
import useDependencyAnalysis, { 
  Dependency, 
  AnalysisReport, 
  Recommendation, 
  Vulnerability,
  AnalysisConfig 
} from '../../hooks/useDependencyAnalysis';

const DependencyAnalysisManager: React.FC = () => {
  const {
    isAnalyzing,
    currentReport,
    reports,
    dependencies,
    graph,
    metrics,
    recommendations,
    security,
    performance,
    compliance,
    config,
    error,
    progress,
    lastAnalysis,
    actions
  } = useDependencyAnalysis();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [selectedDependency, setSelectedDependency] = useState<Dependency | null>(null);
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      if (!isAnalyzing) {
        actions.analyzeProject();
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, isAnalyzing, actions]);

  // Filter functions
  const filteredDependencies = dependencies.filter(dep => {
    const matchesSearch = dep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         dep.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || dep.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const filteredRecommendations = recommendations.filter(rec => {
    const matchesSearch = rec.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         rec.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || rec.severity === filterSeverity;
    
    return matchesSearch && matchesSeverity;
  });

  const filteredVulnerabilities = security?.vulnerabilities.filter(vuln => {
    const matchesSearch = vuln.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vuln.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = filterSeverity === 'all' || vuln.severity === filterSeverity;
    
    return matchesSearch && matchesSeverity;
  }) || [];

  // Helper functions
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'moderate': case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="w-4 h-4" />;
      case 'high': return <AlertTriangle className="w-4 h-4" />;
      case 'moderate': case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <Info className="w-4 h-4" />;
      default: return <CheckCircle className="w-4 h-4" />;
    }
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  // Render functions
  const renderStatusBar = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span className="font-medium">Dependency Analysis</span>
          </div>
          
          {isAnalyzing && (
            <div className="flex items-center space-x-2 text-blue-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing... {progress}%</span>
            </div>
          )}
          
          {lastAnalysis && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Last: {formatDate(lastAnalysis)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm text-gray-600">Auto Refresh</span>
          </label>
          
          <button
            onClick={() => actions.analyzeProject()}
            disabled={isAnalyzing}
            className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            <span>Analyze</span>
          </button>
          
          <button
            onClick={() => setShowConfig(true)}
            className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-1"
          >
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Error: {error}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderDashboard = () => (
    <div className="p-6 space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Dependencies</p>
              <p className="text-2xl font-bold text-gray-900">{metrics?.totalDependencies || 0}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vulnerabilities</p>
              <p className="text-2xl font-bold text-red-600">{security?.vulnerabilities.length || 0}</p>
            </div>
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Bundle Size</p>
              <p className="text-2xl font-bold text-orange-600">{formatBytes(metrics?.bundleSize || 0)}</p>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outdated</p>
              <p className="text-2xl font-bold text-yellow-600">{metrics?.outdated || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>
      
      {/* Security Overview */}
      {security && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Overview</span>
              </h3>
              <div className="text-sm text-gray-500">
                Risk Score: <span className="font-medium">{security.riskScore.toFixed(1)}/10</span>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{security.criticalCount}</div>
                <div className="text-sm text-gray-600">Critical</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{security.highCount}</div>
                <div className="text-sm text-gray-600">High</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{security.moderateCount}</div>
                <div className="text-sm text-gray-600">Moderate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{security.lowCount}</div>
                <div className="text-sm text-gray-600">Low</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Performance Overview */}
      {performance && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Performance Overview</span>
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{formatBytes(performance.bundleSize)}</div>
                <div className="text-sm text-gray-600">Bundle Size</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{formatBytes(performance.gzippedSize)}</div>
                <div className="text-sm text-gray-600">Gzipped</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{performance.loadTime.toFixed(1)}s</div>
                <div className="text-sm text-gray-600">Load Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{performance.treeshakingOpportunities.length}</div>
                <div className="text-sm text-gray-600">Optimizable</div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Recent Reports */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Recent Reports</span>
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {reports.slice(0, 5).map((report) => (
            <div key={report.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">{report.projectName}</div>
                  <div className="text-sm text-gray-500">{formatDate(report.timestamp)}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    {report.dependencies.length} deps
                  </span>
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderDependencies = () => (
    <div className="p-6">
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search dependencies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Types</option>
          <option value="production">Production</option>
          <option value="development">Development</option>
          <option value="peer">Peer</option>
          <option value="optional">Optional</option>
        </select>
      </div>
      
      {/* Dependencies List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Package
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDependencies.map((dep) => (
                <tr key={dep.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{dep.name}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">{dep.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dep.version}
                    {dep.outdated && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Outdated
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      dep.type === 'production' ? 'bg-green-100 text-green-800' :
                      dep.type === 'development' ? 'bg-blue-100 text-blue-800' :
                      dep.type === 'peer' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {dep.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatBytes(dep.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dep.license}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {dep.vulnerabilities.length > 0 && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {dep.vulnerabilities.length} vuln
                        </span>
                      )}
                      {!dep.treeshaking && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          No tree-shaking
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedDependency(dep)}
                      className="text-blue-600 hover:text-blue-700 mr-3"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {dep.homepage && (
                      <a
                        href={dep.homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-gray-700"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderVulnerabilities = () => (
    <div className="p-6">
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search vulnerabilities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="moderate">Moderate</option>
          <option value="low">Low</option>
        </select>
      </div>
      
      {/* Vulnerabilities List */}
      <div className="space-y-4">
        {filteredVulnerabilities.map((vuln) => (
          <div key={vuln.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                    {getSeverityIcon(vuln.severity)}
                    <span className="ml-1 capitalize">{vuln.severity}</span>
                  </span>
                  <span className="text-sm text-gray-500">CVSS: {vuln.cvss.toFixed(1)}</span>
                </div>
                
                <h4 className="text-lg font-medium text-gray-900 mb-2">{vuln.title}</h4>
                <p className="text-gray-600 mb-4">{vuln.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">CWE:</span>
                    <span className="ml-2 text-gray-600">{vuln.cwe.join(', ')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Range:</span>
                    <span className="ml-2 text-gray-600">{vuln.range}</span>
                  </div>
                  {vuln.fixedIn && (
                    <div>
                      <span className="font-medium text-gray-700">Fixed in:</span>
                      <span className="ml-2 text-green-600">{vuln.fixedIn}</span>
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Found:</span>
                    <span className="ml-2 text-gray-600">{formatDate(vuln.foundAt)}</span>
                  </div>
                </div>
                
                {vuln.recommendation && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Recommendation:</strong> {vuln.recommendation}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="p-6">
      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search recommendations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Severities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
      
      {/* Recommendations List */}
      <div className="space-y-4">
        {filteredRecommendations.map((rec) => (
          <div key={rec.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(rec.severity)}`}>
                    {getSeverityIcon(rec.severity)}
                    <span className="ml-1 capitalize">{rec.severity}</span>
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rec.type === 'security' ? 'bg-red-100 text-red-800' :
                    rec.type === 'performance' ? 'bg-orange-100 text-orange-800' :
                    rec.type === 'maintenance' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {rec.type}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    rec.effort === 'low' ? 'bg-green-100 text-green-800' :
                    rec.effort === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {rec.effort} effort
                  </span>
                </div>
                
                <h4 className="text-lg font-medium text-gray-900 mb-2">{rec.title}</h4>
                <p className="text-gray-600 mb-4">{rec.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="font-medium text-gray-700">Impact:</span>
                    <span className="ml-2 text-gray-600">{rec.impact}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Action:</span>
                    <span className="ml-2 text-gray-600">{rec.action}</span>
                  </div>
                </div>
                
                {rec.command && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <code className="text-sm text-gray-800">{rec.command}</code>
                  </div>
                )}
                
                {rec.dependencies.length > 0 && (
                  <div className="mb-4">
                    <span className="font-medium text-gray-700">Affected packages:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {rec.dependencies.map((dep, index) => (
                        <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {rec.links.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rec.links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Learn more
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => setSelectedRecommendation(rec)}
                className="ml-4 text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="p-6 space-y-6">
      {/* Metrics Overview */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Dependency Types</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Production</span>
                <span className="font-medium">{metrics.directDependencies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Development</span>
                <span className="font-medium">{metrics.devDependencies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Peer</span>
                <span className="font-medium">{metrics.peerDependencies}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Optional</span>
                <span className="font-medium">{metrics.optionalDependencies}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">License Distribution</h4>
            <div className="space-y-2">
              {Object.entries(metrics.licenses).map(([license, count]) => (
                <div key={license} className="flex justify-between">
                  <span className="text-gray-600">{license}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Package Ages</h4>
            <div className="space-y-2">
              {Object.entries(metrics.ages).map(([age, count]) => (
                <div key={age} className="flex justify-between">
                  <span className="text-gray-600 capitalize">{age}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Graph Metrics */}
      {graph && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <GitBranch className="w-5 h-5" />
              <span>Dependency Graph Metrics</span>
            </h3>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{graph.metrics.totalNodes}</div>
                <div className="text-sm text-gray-600">Total Nodes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{graph.metrics.totalEdges}</div>
                <div className="text-sm text-gray-600">Total Edges</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{graph.metrics.maxDepth}</div>
                <div className="text-sm text-gray-600">Max Depth</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{graph.metrics.circularDependencies}</div>
                <div className="text-sm text-gray-600">Circular Deps</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="p-6">
      <div className="max-w-2xl">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Analysis Configuration</h3>
        
        <div className="space-y-6">
          {/* General Settings */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">General</h4>
            
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => actions.updateConfig({ enabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable dependency analysis</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.autoAnalysis}
                  onChange={(e) => actions.updateConfig({ autoAnalysis: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Auto analysis</span>
              </label>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Analysis Interval (minutes)
                </label>
                <input
                  type="number"
                  value={config.analysisInterval / 60000}
                  onChange={(e) => actions.updateConfig({ analysisInterval: parseInt(e.target.value) * 60000 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="1"
                  max="1440"
                />
              </div>
            </div>
          </div>
          
          {/* Analysis Options */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">Analysis Options</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.includeDevDependencies}
                  onChange={(e) => actions.updateConfig({ includeDevDependencies: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Include dev dependencies</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.includePeerDependencies}
                  onChange={(e) => actions.updateConfig({ includePeerDependencies: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Include peer dependencies</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.vulnerabilityCheck}
                  onChange={(e) => actions.updateConfig({ vulnerabilityCheck: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Vulnerability check</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.licenseCheck}
                  onChange={(e) => actions.updateConfig({ licenseCheck: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">License check</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.bundleAnalysis}
                  onChange={(e) => actions.updateConfig({ bundleAnalysis: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Bundle analysis</span>
              </label>
              
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.performanceAnalysis}
                  onChange={(e) => actions.updateConfig({ performanceAnalysis: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Performance analysis</span>
              </label>
            </div>
          </div>
          
          {/* Import/Export */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">Data Management</h4>
            
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  const data = actions.exportData();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'dependency-analysis-config.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Config</span>
              </button>
              
              <label className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 flex items-center space-x-2 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Import Config</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const data = e.target?.result as string;
                        actions.importData(data);
                      };
                      reader.readAsText(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
              
              <button
                onClick={() => actions.clearReports()}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear Reports</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'dependencies', label: 'Dependencies', icon: Package },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Shield },
    { id: 'recommendations', label: 'Recommendations', icon: AlertTriangle },
    { id: 'analytics', label: 'Analytics', icon: PieChart },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {renderStatusBar()}
      
      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'dependencies' && renderDependencies()}
        {activeTab === 'vulnerabilities' && renderVulnerabilities()}
        {activeTab === 'recommendations' && renderRecommendations()}
        {activeTab === 'analytics' && renderAnalytics()}
        {activeTab === 'settings' && renderSettings()}
      </div>
      
      {/* Modals */}
      {selectedDependency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Dependency Details</h3>
                <button
                  onClick={() => setSelectedDependency(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Package Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedDependency.name}</div>
                    <div><span className="font-medium">Version:</span> {selectedDependency.version}</div>
                    <div><span className="font-medium">Type:</span> {selectedDependency.type}</div>
                    <div><span className="font-medium">License:</span> {selectedDependency.license}</div>
                    <div><span className="font-medium">Size:</span> {formatBytes(selectedDependency.size)}</div>
                    <div><span className="font-medium">Description:</span> {selectedDependency.description}</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Bundle Impact</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Gzipped:</span> {formatBytes(selectedDependency.bundleImpact.gzippedSize)}</div>
                    <div><span className="font-medium">Parsed:</span> {formatBytes(selectedDependency.bundleImpact.parsedSize)}</div>
                    <div><span className="font-medium">Stat:</span> {formatBytes(selectedDependency.bundleImpact.statSize)}</div>
                    <div><span className="font-medium">Tree-shaking:</span> {selectedDependency.treeshaking ? 'Yes' : 'No'}</div>
                    <div><span className="font-medium">Side Effects:</span> {selectedDependency.sideEffects ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
              
              {selectedDependency.vulnerabilities.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 mb-2">Vulnerabilities</h4>
                  <div className="space-y-2">
                    {selectedDependency.vulnerabilities.map((vuln) => (
                      <div key={vuln.id} className="p-3 bg-red-50 rounded-md">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getSeverityColor(vuln.severity)}`}>
                            {vuln.severity}
                          </span>
                          <span className="text-sm font-medium">{vuln.title}</span>
                        </div>
                        <p className="text-sm text-gray-600">{vuln.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DependencyAnalysisManager;