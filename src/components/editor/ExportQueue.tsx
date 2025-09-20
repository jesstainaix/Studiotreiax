import React, { useState, useEffect } from 'react';
import { Play, Pause, X, RotateCcw, Trash2, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { exportQueue, QueueItem, QueueStats } from '../../services/exportQueue';
import { ExportProgress } from '../../types/export';

interface ExportQueueProps {
  isOpen: boolean;
  onClose: () => void;
}

interface JobProgressProps {
  item: QueueItem;
  progress?: ExportProgress;
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
}

const JobProgress: React.FC<JobProgressProps> = ({ item, progress, onCancel, onRetry }) => {
  const getStatusIcon = () => {
    if (progress) {
      switch (progress.status) {
        case 'processing':
          return <Loader className="w-4 h-4 animate-spin text-blue-500" />;
        case 'completed':
          return <CheckCircle className="w-4 h-4 text-green-500" />;
        case 'error':
        case 'cancelled':
          return <AlertCircle className="w-4 h-4 text-red-500" />;
        default:
          return <Clock className="w-4 h-4 text-gray-400" />;
      }
    }
    return <Clock className="w-4 h-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (progress) {
      switch (progress.status) {
        case 'processing':
          return `${progress.currentStep} (${Math.round(progress.progress)}%)`;
        case 'completed':
          return 'Concluído';
        case 'error':
          return 'Erro';
        case 'cancelled':
          return 'Cancelado';
        default:
          return 'Aguardando';
      }
    }
    return 'Aguardando';
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatFileSize = (bytes: number) => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h4 className="font-medium text-gray-900">{item.job.name}</h4>
            <p className="text-sm text-gray-500">
              {item.job.settings.format.toUpperCase()} • {item.job.settings.resolution.width}x{item.job.settings.resolution.height}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {progress?.status === 'processing' && (
            <button
              onClick={() => onCancel(item.id)}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Cancelar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {(progress?.status === 'error' || progress?.status === 'cancelled') && item.retryCount < item.maxRetries && (
            <button
              onClick={() => onRetry(item.id)}
              className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
              title="Tentar novamente"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="mb-2">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{getStatusText()}</span>
          {progress?.status === 'processing' && (
            <span>{formatTime(progress.estimatedTimeRemaining)} restante</span>
          )}
        </div>
        
        {progress && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                progress.status === 'completed' ? 'bg-green-500' :
                progress.status === 'error' || progress.status === 'cancelled' ? 'bg-red-500' :
                'bg-blue-500'
              }`}
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        )}
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>Prioridade: {item.priority}</span>
        <span>Adicionado: {item.addedAt.toLocaleTimeString()}</span>
        {progress?.outputSize > 0 && (
          <span>Tamanho: {formatFileSize(progress.outputSize)}</span>
        )}
      </div>
      
      {item.retryCount > 0 && (
        <div className="mt-2 text-xs text-orange-600">
          Tentativa {item.retryCount + 1} de {item.maxRetries + 1}
        </div>
      )}
    </div>
  );
};

const ExportQueue: React.FC<ExportQueueProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState<QueueStats>({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    estimatedTimeRemaining: 0,
    averageProcessingTime: 0
  });
  const [jobs, setJobs] = useState<{
    queue: QueueItem[];
    processing: QueueItem[];
    completed: QueueItem[];
    failed: QueueItem[];
  }>({ queue: [], processing: [], completed: [], failed: [] });
  const [progressMap, setProgressMap] = useState<Map<string, ExportProgress>>(new Map());
  const [isQueueRunning, setIsQueueRunning] = useState(true);
  const [activeTab, setActiveTab] = useState<'queue' | 'processing' | 'completed' | 'failed'>('queue');

  useEffect(() => {
    if (!isOpen) return;

    // Atualizar estatísticas e jobs
    const updateData = () => {
      setStats(exportQueue.getStats());
      setJobs(exportQueue.getAllJobs());
    };

    // Callback para atualizações da fila
    const handleQueueUpdate = (newStats: QueueStats) => {
      setStats(newStats);
      setJobs(exportQueue.getAllJobs());
    };

    // Registrar callbacks
    exportQueue.onQueueUpdate(handleQueueUpdate);

    // Atualização inicial
    updateData();

    // Cleanup
    return () => {
      exportQueue.offQueueUpdate(handleQueueUpdate);
    };
  }, [isOpen]);

  const handlePauseResume = () => {
    if (isQueueRunning) {
      exportQueue.pauseQueue();
      setIsQueueRunning(false);
    } else {
      exportQueue.resumeQueue();
      setIsQueueRunning(true);
    }
  };

  const handleClearQueue = () => {
    exportQueue.clearQueue();
  };

  const handleClearHistory = () => {
    exportQueue.clearHistory();
  };

  const handleCancelJob = (jobId: string) => {
    exportQueue.cancelJob(jobId);
  };

  const handleRetryJob = (jobId: string) => {
    exportQueue.retryJob(jobId);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getTabItems = () => {
    return [
      { key: 'queue', label: `Fila (${stats.pending})`, items: jobs.queue },
      { key: 'processing', label: `Processando (${stats.processing})`, items: jobs.processing },
      { key: 'completed', label: `Concluídos (${stats.completed})`, items: jobs.completed },
      { key: 'failed', label: `Falhados (${stats.failed})`, items: jobs.failed }
    ];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-3/4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Fila de Exportação</h2>
            <p className="text-sm text-gray-500 mt-1">
              {stats.total} jobs total • Tempo médio: {formatTime(stats.averageProcessingTime)}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePauseResume}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isQueueRunning 
                  ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              {isQueueRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isQueueRunning ? 'Pausar' : 'Retomar'}</span>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        {stats.estimatedTimeRemaining > 0 && (
          <div className="px-6 py-3 bg-blue-50 border-b border-gray-200">
            <p className="text-sm text-blue-700">
              Tempo estimado restante: {formatTime(stats.estimatedTimeRemaining)}
            </p>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {getTabItems().map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {getTabItems().find(tab => tab.key === activeTab)?.items.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-2">
                {activeTab === 'queue' && <Clock className="w-12 h-12 mx-auto" />}
                {activeTab === 'processing' && <Loader className="w-12 h-12 mx-auto" />}
                {activeTab === 'completed' && <CheckCircle className="w-12 h-12 mx-auto" />}
                {activeTab === 'failed' && <AlertCircle className="w-12 h-12 mx-auto" />}
              </div>
              <p className="text-gray-500">
                {activeTab === 'queue' && 'Nenhum job na fila'}
                {activeTab === 'processing' && 'Nenhum job sendo processado'}
                {activeTab === 'completed' && 'Nenhum job concluído'}
                {activeTab === 'failed' && 'Nenhum job falhado'}
              </p>
            </div>
          ) : (
            <div>
              {getTabItems().find(tab => tab.key === activeTab)?.items.map(item => (
                <JobProgress
                  key={item.id}
                  item={item}
                  progress={progressMap.get(item.id)}
                  onCancel={handleCancelJob}
                  onRetry={handleRetryJob}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            {stats.processing > 0 && (
              <span className="text-blue-600 font-medium">
                {stats.processing} job{stats.processing !== 1 ? 's' : ''} processando
              </span>
            )}
          </div>
          
          <div className="flex space-x-3">
            {activeTab === 'queue' && jobs.queue.length > 0 && (
              <button
                onClick={handleClearQueue}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Fila</span>
              </button>
            )}
            
            {(activeTab === 'completed' || activeTab === 'failed') && 
             (jobs.completed.length > 0 || jobs.failed.length > 0) && (
              <button
                onClick={handleClearHistory}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar Histórico</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportQueue;