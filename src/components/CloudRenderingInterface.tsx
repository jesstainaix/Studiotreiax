import React, { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, 
  Server, 
  Activity, 
  Play, 
  Pause, 
  Square, 
  RotateCcw,
  Settings,
  Monitor,
  Cpu,
  HardDrive,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Eye,
  Download,
  Upload,
  BarChart3,
  PieChart,
  TrendingUp,
  Users,
  Globe
} from 'lucide-react';
import {
  cloudRenderingSystem,
  RenderCluster,
  RenderNode,
  RenderJob,
  RenderTask,
  NodeStatus,
  JobStatus,
  TaskStatus,
  TaskPriority,
  TaskType,
  LoadBalancingAlgorithm,
  QualityPreference
} from './CloudRenderingSystem';

// Interfaces
interface ClusterStats {
  totalNodes: number;
  activeNodes: number;
  totalCapacity: number;
  currentLoad: number;
  queueLength: number;
  completedJobs: number;
}

interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  gpuUsage: number;
  networkUsage: number;
  storageUsage: number;
  throughput: number;
  latency: number;
  uptime: number;
}

interface JobFormData {
  name: string;
  priority: TaskPriority;
  qualityPreference: QualityPreference;
  deadline?: string;
  budget?: number;
  description: string;
}

interface NodeFormData {
  name: string;
  location: string;
  cpuCores: number;
  gpuCount: number;
  gpuMemory: number;
  ramMemory: number;
  storageSpace: number;
  specializations: string[];
}

// Component Props
interface NodeCardProps {
  node: RenderNode;
  onEdit: (node: RenderNode) => void;
  onRemove: (nodeId: string) => void;
  onViewDetails: (node: RenderNode) => void;
}

interface JobCardProps {
  job: RenderJob;
  onCancel: (jobId: string) => void;
  onViewDetails: (job: RenderJob) => void;
  onDownload: (job: RenderJob) => void;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
}

interface ClusterOverviewProps {
  cluster: RenderCluster;
  stats: ClusterStats;
  onAddNode: () => void;
  onEditCluster: () => void;
}

// Helper Components
const NodeCard: React.FC<NodeCardProps> = ({ node, onEdit, onRemove, onViewDetails }) => {
  const getStatusColor = (status: NodeStatus) => {
    switch (status) {
      case NodeStatus.ONLINE: return 'text-green-500';
      case NodeStatus.BUSY: return 'text-yellow-500';
      case NodeStatus.OFFLINE: return 'text-red-500';
      case NodeStatus.MAINTENANCE: return 'text-blue-500';
      case NodeStatus.ERROR: return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: NodeStatus) => {
    switch (status) {
      case NodeStatus.ONLINE: return <CheckCircle className="w-4 h-4" />;
      case NodeStatus.BUSY: return <Activity className="w-4 h-4" />;
      case NodeStatus.OFFLINE: return <XCircle className="w-4 h-4" />;
      case NodeStatus.MAINTENANCE: return <Settings className="w-4 h-4" />;
      case NodeStatus.ERROR: return <AlertTriangle className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const loadPercentage = (node.currentLoad / node.maxLoad) * 100;

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Server className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-800">{node.name}</h3>
        </div>
        <div className={`flex items-center space-x-1 ${getStatusColor(node.status)}`}>
          {getStatusIcon(node.status)}
          <span className="text-sm font-medium">{node.status}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Localização:</span>
          <span className="font-medium">{node.location}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">CPU Cores:</span>
          <span className="font-medium">{node.capabilities.cpuCores}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">GPU Memory:</span>
          <span className="font-medium">{node.capabilities.gpuMemory} MB</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">RAM:</span>
          <span className="font-medium">{node.capabilities.ramMemory} MB</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Carga:</span>
          <span className="font-medium">{loadPercentage.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${
              loadPercentage > 90 ? 'bg-red-500' :
              loadPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(loadPercentage, 100)}%` }}
          />
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onViewDetails(node)}
          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center justify-center space-x-1"
        >
          <Eye className="w-4 h-4" />
          <span>Detalhes</span>
        </button>
        <button
          onClick={() => onEdit(node)}
          className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRemove(node.id)}
          className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const JobCard: React.FC<JobCardProps> = ({ job, onCancel, onViewDetails, onDownload }) => {
  const getStatusColor = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED: return 'text-green-500';
      case JobStatus.PROCESSING: return 'text-blue-500';
      case JobStatus.QUEUED: return 'text-yellow-500';
      case JobStatus.FAILED: return 'text-red-500';
      case JobStatus.CANCELLED: return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: JobStatus) => {
    switch (status) {
      case JobStatus.COMPLETED: return <CheckCircle className="w-4 h-4" />;
      case JobStatus.PROCESSING: return <Activity className="w-4 h-4" />;
      case JobStatus.QUEUED: return <Clock className="w-4 h-4" />;
      case JobStatus.FAILED: return <XCircle className="w-4 h-4" />;
      case JobStatus.CANCELLED: return <Square className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Cloud className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-800">{job.name}</h3>
        </div>
        <div className={`flex items-center space-x-1 ${getStatusColor(job.status)}`}>
          {getStatusIcon(job.status)}
          <span className="text-sm font-medium">{job.status}</span>
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progresso:</span>
          <span className="font-medium">{job.progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="h-2 bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${job.progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Frames:</span>
          <span className="font-medium">{job.completedFrames}/{job.totalFrames}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Custo:</span>
          <span className="font-medium">${job.cost.actual.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={() => onViewDetails(job)}
          className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm flex items-center justify-center space-x-1"
        >
          <Eye className="w-4 h-4" />
          <span>Detalhes</span>
        </button>
        {job.status === JobStatus.COMPLETED && (
          <button
            onClick={() => onDownload(job)}
            className="px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
        {(job.status === JobStatus.PROCESSING || job.status === JobStatus.QUEUED) && (
          <button
            onClick={() => onCancel(job.id)}
            className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, icon, trend, color = 'blue' }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          <div className={`text-${color}-600`}>{icon}</div>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 ${
            trend > 0 ? 'text-green-500' : trend < 0 ? 'text-red-500' : 'text-gray-500'
          }`}>
            <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span className="text-sm font-medium">{Math.abs(trend).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className="flex items-baseline space-x-1">
          <span className="text-2xl font-bold text-gray-900">{value}</span>
          {unit && <span className="text-sm text-gray-500">{unit}</span>}
        </div>
      </div>
    </div>
  );
};

const ClusterOverview: React.FC<ClusterOverviewProps> = ({ cluster, stats, onAddNode, onEditCluster }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{cluster.name}</h2>
            <p className="text-sm text-gray-600">{cluster.region}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onAddNode}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nó</span>
          </button>
          <button
            onClick={onEditCluster}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.activeNodes}</div>
          <div className="text-sm text-gray-600">Nós Ativos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
          <div className="text-sm text-gray-600">Jobs Concluídos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.queueLength}</div>
          <div className="text-sm text-gray-600">Na Fila</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{((stats.currentLoad / stats.totalCapacity) * 100).toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Carga do Sistema</div>
        </div>
      </div>
    </div>
  );
};

// Main Component
const CloudRenderingInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [clusters, setClusters] = useState<RenderCluster[]>([]);
  const [jobs, setJobs] = useState<RenderJob[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    gpuUsage: 0,
    networkUsage: 0,
    storageUsage: 0,
    throughput: 0,
    latency: 0,
    uptime: 0
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showNodeForm, setShowNodeForm] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<string>('');
  const [jobForm, setJobForm] = useState<JobFormData>({
    name: '',
    priority: TaskPriority.NORMAL,
    qualityPreference: QualityPreference.BALANCED,
    description: ''
  });
  const [nodeForm, setNodeForm] = useState<NodeFormData>({
    name: '',
    location: '',
    cpuCores: 4,
    gpuCount: 1,
    gpuMemory: 8192,
    ramMemory: 16384,
    storageSpace: 1000000,
    specializations: []
  });

  // Initialize system
  useEffect(() => {
    const initializeSystem = async () => {
      try {
        await cloudRenderingSystem.initialize();
        setIsInitialized(true);
        loadData();
      } catch (error) {
        console.error('Erro ao inicializar sistema de renderização cloud:', error);
      }
    };

    initializeSystem();
  }, []);

  // Load data
  const loadData = useCallback(() => {
    setClusters(cloudRenderingSystem.getAllClusters());
    setJobs(cloudRenderingSystem.getAllJobs());
    
    // Mock metrics - in real app would come from monitoring system
    setSystemMetrics({
      cpuUsage: Math.random() * 100,
      memoryUsage: Math.random() * 100,
      gpuUsage: Math.random() * 100,
      networkUsage: Math.random() * 100,
      storageUsage: Math.random() * 100,
      throughput: Math.random() * 1000,
      latency: Math.random() * 100,
      uptime: 99.9
    });
  }, []);

  // Refresh data periodically
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [isInitialized, loadData]);

  // Job management
  const handleSubmitJob = async () => {
    try {
      await cloudRenderingSystem.submitJob({
        name: jobForm.name,
        priority: jobForm.priority,
        tasks: [] // Would be populated based on job requirements
      });
      setShowJobForm(false);
      setJobForm({
        name: '',
        priority: TaskPriority.NORMAL,
        qualityPreference: QualityPreference.BALANCED,
        description: ''
      });
      loadData();
    } catch (error) {
      console.error('Erro ao submeter job:', error);
    }
  };

  const handleCancelJob = (jobId: string) => {
    cloudRenderingSystem.cancelJob(jobId);
    loadData();
  };

  const handleDownloadJob = (job: RenderJob) => {
    // Implementation for downloading job results
  };

  const handleViewJobDetails = (job: RenderJob) => {
    // Implementation for viewing job details
  };

  // Node management
  const handleAddNode = async () => {
    if (!selectedCluster) return;

    try {
      const newNode = {
        id: Math.random().toString(36).substr(2, 9),
        name: nodeForm.name,
        status: NodeStatus.ONLINE,
        capabilities: {
          cpuCores: nodeForm.cpuCores,
          gpuCount: nodeForm.gpuCount,
          gpuMemory: nodeForm.gpuMemory,
          ramMemory: nodeForm.ramMemory,
          storageSpace: nodeForm.storageSpace,
          supportedCodecs: ['h264', 'h265', 'vp9'],
          maxResolution: { width: 4096, height: 2160 },
          specializations: nodeForm.specializations as any[]
        },
        currentLoad: 0,
        maxLoad: 100,
        location: nodeForm.location,
        lastHeartbeat: Date.now(),
        performance: {
          averageRenderSpeed: 30,
          reliability: 0.99,
          uptime: 99.9,
          completedTasks: 0,
          failedTasks: 0,
          totalRenderTime: 0
        },
        queue: []
      };

      await cloudRenderingSystem.addNode(selectedCluster, newNode);
      setShowNodeForm(false);
      setNodeForm({
        name: '',
        location: '',
        cpuCores: 4,
        gpuCount: 1,
        gpuMemory: 8192,
        ramMemory: 16384,
        storageSpace: 1000000,
        specializations: []
      });
      loadData();
    } catch (error) {
      console.error('Erro ao adicionar nó:', error);
    }
  };

  const handleRemoveNode = (clusterId: string, nodeId: string) => {
    cloudRenderingSystem.removeNode(clusterId, nodeId);
    loadData();
  };

  const handleViewNodeDetails = (node: RenderNode) => {
    // Implementation for viewing node details
  };

  const handleEditNode = (node: RenderNode) => {
    // Implementation for editing node
  };

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Inicializando sistema de renderização cloud...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'clusters', name: 'Clusters', icon: Globe },
    { id: 'jobs', name: 'Jobs', icon: Cloud },
    { id: 'monitoring', name: 'Monitoramento', icon: Monitor },
    { id: 'settings', name: 'Configurações', icon: Settings }
  ];

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Cloud className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cloud Rendering</h1>
              <p className="text-sm text-gray-600">Sistema de renderização distribuída</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Sistema Online</span>
            </div>
            <button
              onClick={() => setShowJobForm(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Job</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="CPU Usage"
                value={systemMetrics.cpuUsage.toFixed(1)}
                unit="%"
                icon={<Cpu className="w-5 h-5" />}
                trend={2.5}
                color="blue"
              />
              <MetricCard
                title="Memory Usage"
                value={systemMetrics.memoryUsage.toFixed(1)}
                unit="%"
                icon={<HardDrive className="w-5 h-5" />}
                trend={-1.2}
                color="green"
              />
              <MetricCard
                title="GPU Usage"
                value={systemMetrics.gpuUsage.toFixed(1)}
                unit="%"
                icon={<Zap className="w-5 h-5" />}
                trend={5.8}
                color="yellow"
              />
              <MetricCard
                title="Throughput"
                value={systemMetrics.throughput.toFixed(0)}
                unit="fps"
                icon={<TrendingUp className="w-5 h-5" />}
                trend={3.2}
                color="purple"
              />
            </div>

            {/* Active Jobs */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Jobs Ativos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.filter(job => job.status === JobStatus.PROCESSING || job.status === JobStatus.QUEUED).map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onCancel={handleCancelJob}
                    onViewDetails={handleViewJobDetails}
                    onDownload={handleDownloadJob}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'clusters' && (
          <div className="space-y-6">
            {clusters.map((cluster) => {
              const stats: ClusterStats = {
                totalNodes: cluster.nodes.length,
                activeNodes: cluster.nodes.filter(n => n.status === NodeStatus.ONLINE).length,
                totalCapacity: cluster.nodes.reduce((sum, n) => sum + n.maxLoad, 0),
                currentLoad: cluster.nodes.reduce((sum, n) => sum + n.currentLoad, 0),
                queueLength: cluster.nodes.reduce((sum, n) => sum + n.queue.length, 0),
                completedJobs: 0 // Would be calculated from historical data
              };

              return (
                <div key={cluster.id} className="space-y-4">
                  <ClusterOverview
                    cluster={cluster}
                    stats={stats}
                    onAddNode={() => {
                      setSelectedCluster(cluster.id);
                      setShowNodeForm(true);
                    }}
                    onEditCluster={() => {
                      // Implementar edição de cluster
                    }}
                  />
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Todos os Jobs</h2>
              <div className="flex space-x-2">
                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm">
                  <option value="all">Todos os Status</option>
                  <option value="processing">Processando</option>
                  <option value="completed">Concluídos</option>
                  <option value="failed">Falharam</option>
                </select>
                <button
                  onClick={() => setShowJobForm(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Job</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onCancel={handleCancelJob}
                  onViewDetails={handleViewJobDetails}
                  onDownload={handleDownloadJob}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Monitoramento do Sistema</h2>
            
            {/* Real-time metrics would go here */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas em Tempo Real</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard
                  title="Latência Média"
                  value={systemMetrics.latency.toFixed(1)}
                  unit="ms"
                  icon={<Clock className="w-5 h-5" />}
                  color="blue"
                />
                <MetricCard
                  title="Uptime"
                  value={systemMetrics.uptime.toFixed(2)}
                  unit="%"
                  icon={<CheckCircle className="w-5 h-5" />}
                  color="green"
                />
                <MetricCard
                  title="Uso de Rede"
                  value={systemMetrics.networkUsage.toFixed(1)}
                  unit="Mbps"
                  icon={<Activity className="w-5 h-5" />}
                  color="purple"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Configurações do Sistema</h2>
            
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações Gerais</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Algoritmo de Load Balancing
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value={LoadBalancingAlgorithm.PERFORMANCE_BASED}>Baseado em Performance</option>
                    <option value={LoadBalancingAlgorithm.ROUND_ROBIN}>Round Robin</option>
                    <option value={LoadBalancingAlgorithm.LEAST_CONNECTIONS}>Menos Conexões</option>
                    <option value={LoadBalancingAlgorithm.GEOGRAPHIC}>Geográfico</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto Scaling
                  </label>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm text-gray-600">Habilitar auto scaling automático</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Form Modal */}
      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Job de Renderização</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Job</label>
                <input
                  type="text"
                  value={jobForm.name}
                  onChange={(e) => setJobForm({ ...jobForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Digite o nome do job"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prioridade</label>
                <select
                  value={jobForm.priority}
                  onChange={(e) => setJobForm({ ...jobForm, priority: e.target.value as TaskPriority })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={TaskPriority.LOW}>Baixa</option>
                  <option value={TaskPriority.NORMAL}>Normal</option>
                  <option value={TaskPriority.HIGH}>Alta</option>
                  <option value={TaskPriority.URGENT}>Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferência de Qualidade</label>
                <select
                  value={jobForm.qualityPreference}
                  onChange={(e) => setJobForm({ ...jobForm, qualityPreference: e.target.value as QualityPreference })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={QualityPreference.SPEED}>Velocidade</option>
                  <option value={QualityPreference.BALANCED}>Balanceado</option>
                  <option value={QualityPreference.QUALITY}>Qualidade</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <textarea
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={3}
                  placeholder="Descrição opcional do job"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowJobForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitJob}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Criar Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Node Form Modal */}
      {showNodeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Novo Nó</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Nó</label>
                <input
                  type="text"
                  value={nodeForm.name}
                  onChange={(e) => setNodeForm({ ...nodeForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Digite o nome do nó"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Localização</label>
                <input
                  type="text"
                  value={nodeForm.location}
                  onChange={(e) => setNodeForm({ ...nodeForm, location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="ex: us-east-1, brasil-sp"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">CPU Cores</label>
                  <input
                    type="number"
                    value={nodeForm.cpuCores}
                    onChange={(e) => setNodeForm({ ...nodeForm, cpuCores: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GPU Count</label>
                  <input
                    type="number"
                    value={nodeForm.gpuCount}
                    onChange={(e) => setNodeForm({ ...nodeForm, gpuCount: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">GPU Memory (MB)</label>
                  <input
                    type="number"
                    value={nodeForm.gpuMemory}
                    onChange={(e) => setNodeForm({ ...nodeForm, gpuMemory: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">RAM (MB)</label>
                  <input
                    type="number"
                    value={nodeForm.ramMemory}
                    onChange={(e) => setNodeForm({ ...nodeForm, ramMemory: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    min="1024"
                  />
                </div>
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowNodeForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddNode}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
              >
                Adicionar Nó
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudRenderingInterface;