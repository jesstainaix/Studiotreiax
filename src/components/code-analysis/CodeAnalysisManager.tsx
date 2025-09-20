import React, { useState, useEffect } from 'react';
import { 
  Code, 
  Play, 
  Pause, 
  RefreshCw, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Info, 
  Settings, 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Target, 
  Shield, 
  Zap, 
  Bug, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Eye, 
  Edit3, 
  Trash2, 
  Plus, 
  Layers, 
  Package, 
  GitBranch, 
  Database, 
  Lock, 
  Unlock, 
  AlertCircle, 
  HelpCircle, 
  ExternalLink, 
  Calendar, 
  Users, 
  Gauge, 
  PieChart, 
  BarChart, 
  LineChart
} from 'lucide-react';
import { useCodeAnalysis, AnalysisReport, CodeIssue, CodeSmell, CodeMetric, DependencyInfo } from '../../hooks/useCodeAnalysis';

const CodeAnalysisManager: React.FC = () => {
  const {
    isAnalyzing,
    currentReport,
    reports,
    metrics,
    issues,
    smells,
    dependencies,
    coverage,
    config,
    error,
    progress,
    actions
  } = useCodeAnalysis();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showIssueDetailsModal, setShowIssueDetailsModal] = useState(false);
  const [showSmellDetailsModal, setShowSmellDetailsModal] = useState(false);
  const [showReportDetailsModal, setShowReportDetailsModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState<CodeIssue | null>(null);
  const [selectedSmell, setSelectedSmell] = useState<CodeSmell | null>(null);
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);

  // Auto-refresh
  useEffect(() => {
    if (autoRefresh && !isAnalyzing) {
      const interval = setInterval(() => {
        actions.analyzeProject();
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isAnalyzing, actions]);

  // Filter functions
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.file.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;
    const matchesType = filterType === 'all' || issue.type === filterType;
    const matchesCategory = filterCategory === 'all' || issue.category === filterCategory;
    return matchesSearch && matchesSeverity && matchesType && matchesCategory;
  });

  const filteredSmells = smells.filter(smell => {
    const matchesSearch = smell.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         smell.file.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = filterSeverity === 'all' || smell.severity === filterSeverity;
    return matchesSearch && matchesSeverity;
  });

  // Helper functions
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info': return <Info className="w-4 h-4 text-blue-600" />;
      case 'suggestion': return <HelpCircle className="w-4 h-4 text-purple-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'complexity': return <Layers className="w-4 h-4" />;
      case 'maintainability': return <Edit3 className="w-4 h-4" />;
      case 'performance': return <Zap className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      case 'quality': return <Target className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  const getQualityGrade = (score: number) => {
    if (score >= 90) return { grade: 'A', color: 'text-green-600' };
    if (score >= 80) return { grade: 'B', color: 'text-blue-600' };
    if (score >= 70) return { grade: 'C', color: 'text-yellow-600' };
    if (score >= 60) return { grade: 'D', color: 'text-orange-600' };
    return { grade: 'F', color: 'text-red-600' };
  };

  // Render dashboard
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Analysis Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => actions.analyzeProject()}
              disabled={isAnalyzing}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                isAnalyzing 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isAnalyzing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              <span>{isAnalyzing ? 'Analyzing...' : 'Start Analysis'}</span>
            </button>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md border ${
                autoRefresh 
                  ? 'bg-green-50 text-green-600 border-green-200'
                  : 'bg-gray-50 text-gray-600 border-gray-200'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              <span>Auto Refresh</span>
            </button>
          </div>
          
          <div className="text-sm text-gray-600">
            {currentReport && (
              <span>Last analysis: {currentReport.timestamp.toLocaleString()}</span>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>{progress.stage}</span>
              <span>{progress.current.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.current}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quality Overview */}
      {currentReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {Object.entries(currentReport.summary).map(([key, value]) => {
            if (key === 'technicalDebt') {
              return (
                <div key={key} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 capitalize">
                        Technical Debt
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.floor(value / 60)}h {value % 60}m
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-red-600" />
                  </div>
                </div>
              );
            }
            
            const { grade, color } = getQualityGrade(value);
            return (
              <div key={key} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">{value}%</p>
                    <p className={`text-sm font-bold ${color}`}>Grade {grade}</p>
                  </div>
                  {getCategoryIcon(key)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Issues</p>
              <p className="text-2xl font-bold text-gray-900">{issues.length}</p>
            </div>
            <Bug className="w-8 h-8 text-red-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              {issues.filter(i => i.severity === 'critical' || i.severity === 'high').length} critical/high
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Code Smells</p>
              <p className="text-2xl font-bold text-gray-900">{smells.length}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              {smells.reduce((sum, smell) => sum + smell.debt, 0)} min debt
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Dependencies</p>
              <p className="text-2xl font-bold text-gray-900">{dependencies.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              {dependencies.filter(d => d.vulnerabilities > 0).length} with vulnerabilities
            </span>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Files Analyzed</p>
              <p className="text-2xl font-bold text-gray-900">
                {currentReport?.filesAnalyzed || 0}
              </p>
            </div>
            <FileText className="w-8 h-8 text-green-600" />
          </div>
          <div className="mt-2">
            <span className="text-sm text-gray-500">
              {currentReport?.linesOfCode || 0} lines of code
            </span>
          </div>
        </div>
      </div>

      {/* Recent Issues */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Recent Issues</h3>
            <button
              onClick={() => setActiveTab('issues')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
        </div>
        <div className="p-6">
          {issues.length > 0 ? (
            <div className="space-y-3">
              {issues.slice(0, 5).map(issue => (
                <div key={issue.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(issue.type)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{issue.message}</div>
                      <div className="text-xs text-gray-500">
                        {issue.file}:{issue.line}:{issue.column}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <button
                      onClick={() => {
                        setSelectedIssue(issue);
                        setShowIssueDetailsModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
              <p className="text-gray-600">Your code looks great!</p>
            </div>
          )}
        </div>
      </div>

      {/* Analysis History */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Analysis History</h3>
        </div>
        <div className="p-6">
          {reports.length > 0 ? (
            <div className="space-y-3">
              {reports.slice(0, 5).map(report => (
                <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {report.timestamp.toLocaleDateString()} {report.timestamp.toLocaleTimeString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.filesAnalyzed} files, {formatDuration(report.duration)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        Quality: {report.summary.quality}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {report.issues.length} issues
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setShowReportDetailsModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No analysis history</h3>
              <p className="text-gray-600">Run your first analysis to see results here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render issues
  const renderIssues = () => (
    <div className="space-y-6">
      {/* Issue Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Types</option>
              <option value="error">Errors</option>
              <option value="warning">Warnings</option>
              <option value="info">Info</option>
              <option value="suggestion">Suggestions</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Categories</option>
              <option value="complexity">Complexity</option>
              <option value="maintainability">Maintainability</option>
              <option value="performance">Performance</option>
              <option value="security">Security</option>
              <option value="quality">Quality</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Issues ({filteredIssues.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">File</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rule</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredIssues.map(issue => (
                <tr key={issue.id}>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      {getTypeIcon(issue.type)}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{issue.message}</div>
                        <div className="text-sm text-gray-500">{issue.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="capitalize text-sm text-gray-900">{issue.type}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {issue.file.split('/').pop()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {issue.line}:{issue.column}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {issue.rule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedIssue(issue);
                          setShowIssueDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {issue.fixable && (
                        <button className="text-green-600 hover:text-green-900">
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredIssues.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No issues found</h3>
            <p className="text-gray-600">Try adjusting your search or filters.</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render code smells
  const renderCodeSmells = () => (
    <div className="space-y-6">
      {/* Smell Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search code smells..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Code Smells Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSmells.map(smell => (
          <div key={smell.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{smell.name}</h3>
                  <p className="text-sm text-gray-600">{smell.type}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(smell.severity)}`}>
                  {smell.severity}
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">{smell.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">File:</span>
                  <span className="font-medium">{smell.file.split('/').pop()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lines:</span>
                  <span className="font-medium">{smell.startLine}-{smell.endLine}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Impact:</span>
                  <span className="font-medium">{smell.impact}/10</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Effort:</span>
                  <span className="font-medium">{smell.effort} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tech Debt:</span>
                  <span className="font-medium text-red-600">{smell.debt} min</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="flex flex-wrap gap-1">
                  {smell.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setSelectedSmell(smell);
                    setShowSmellDetailsModal(true);
                  }}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {filteredSmells.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No code smells found</h3>
          <p className="text-gray-600">Your code is clean!</p>
        </div>
      )}
    </div>
  );

  // Render dependencies
  const renderDependencies = () => (
    <div className="space-y-6">
      {/* Dependencies Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{dependencies.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vulnerabilities</p>
              <p className="text-2xl font-bold text-red-600">
                {dependencies.reduce((sum, dep) => sum + dep.vulnerabilities, 0)}
              </p>
            </div>
            <Shield className="w-8 h-8 text-red-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Outdated</p>
              <p className="text-2xl font-bold text-yellow-600">
                {dependencies.filter(dep => dep.outdated).length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Size</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatBytes(dependencies.reduce((sum, dep) => sum + dep.size, 0))}
              </p>
            </div>
            <Database className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Dependencies Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Dependencies</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vulnerabilities</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dependencies.map(dep => (
                <tr key={dep.name}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{dep.name}</div>
                      <div className="text-sm text-gray-500">{dep.description}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dep.version}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                      {dep.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatBytes(dep.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {dep.vulnerabilities > 0 ? (
                      <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                        {dep.vulnerabilities}
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        0
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {dep.outdated ? (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                        Outdated
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Current
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dep.license}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {dep.homepage && (
                        <a
                          href={dep.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render analytics
  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Trend Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Trends</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <LineChart className="w-12 h-12 mx-auto mb-2" />
              <p>Quality trend chart would be displayed here</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Issue Distribution</h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <PieChart className="w-12 h-12 mx-auto mb-2" />
              <p>Issue distribution chart would be displayed here</p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Metrics Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map(metric => (
            <div key={metric.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-900">{metric.name}</h4>
                {getCategoryIcon(metric.category)}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900">{metric.value}</span>
                <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getSeverityColor(metric.severity)}`}>
                  {metric.severity}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Threshold: {metric.threshold}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    metric.value > metric.threshold ? 'bg-red-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render settings
  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Analysis Configuration</h3>
        
        <div className="space-y-6">
          {/* General Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">General</h4>
            <div className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => actions.updateConfig({ enabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable code analysis</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.autoAnalysis}
                  onChange={(e) => actions.updateConfig({ autoAnalysis: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enable automatic analysis</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.includeTests}
                  onChange={(e) => actions.updateConfig({ includeTests: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Include test files</span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={config.includeDependencies}
                  onChange={(e) => actions.updateConfig({ includeDependencies: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Analyze dependencies</span>
              </label>
            </div>
          </div>

          {/* Analysis Settings */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Analysis Interval (ms)</label>
                <input
                  type="number"
                  min="60000"
                  max="3600000"
                  value={config.analysisInterval}
                  onChange={(e) => actions.updateConfig({ analysisInterval: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max File Size (bytes)</label>
                <input
                  type="number"
                  min="1024"
                  max="10485760"
                  value={config.maxFileSize}
                  onChange={(e) => actions.updateConfig({ maxFileSize: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timeout (ms)</label>
                <input
                  type="number"
                  min="5000"
                  max="300000"
                  value={config.timeout}
                  onChange={(e) => actions.updateConfig({ timeout: parseInt(e.target.value) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* File Patterns */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-4">File Patterns</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Include Patterns</label>
                <textarea
                  value={config.includePatterns.join('\n')}
                  onChange={(e) => actions.updateConfig({ includePatterns: e.target.value.split('\n').filter(p => p.trim()) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  placeholder="src/**/*.{ts,tsx,js,jsx}"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exclude Patterns</label>
                <textarea
                  value={config.excludePatterns.join('\n')}
                  onChange={(e) => actions.updateConfig({ excludePatterns: e.target.value.split('\n').filter(p => p.trim()) })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 h-24"
                  placeholder="node_modules/**"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Data Management</h3>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => {
              const data = actions.exportData();
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `code-analysis-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
          
          <label className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Import Data</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const data = event.target?.result as string;
                    actions.importData(data);
                  };
                  reader.readAsText(file);
                }
              }}
            />
          </label>
          
          <button
            onClick={actions.clearReports}
            className="flex items-center space-x-2 px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear Reports</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Code Analysis Manager</h1>
        <p className="text-gray-600">Analyze code quality, detect issues, and track technical debt</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <XCircle className="w-5 h-5 text-red-400 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
            <button
              onClick={actions.clearError}
              className="text-red-400 hover:text-red-600"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
            { id: 'issues', label: 'Issues', icon: Bug },
            { id: 'smells', label: 'Code Smells', icon: AlertTriangle },
            { id: 'dependencies', label: 'Dependencies', icon: Package },
            { id: 'analytics', label: 'Analytics', icon: TrendingUp },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
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

      {/* Tab Content */}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'issues' && renderIssues()}
      {activeTab === 'smells' && renderCodeSmells()}
      {activeTab === 'dependencies' && renderDependencies()}
      {activeTab === 'analytics' && renderAnalytics()}
      {activeTab === 'settings' && renderSettings()}

      {/* Modals would be implemented here */}
      {/* IssueDetailsModal, SmellDetailsModal, ReportDetailsModal, etc. */}
    </div>
  );
};

export default CodeAnalysisManager;