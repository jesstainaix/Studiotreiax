import { useState, useCallback, useEffect, useRef } from 'react';
import { 
  ExportSettings, 
  ExportJob, 
  ExportQueue, 
  ExportProgress, 
  ExportHistory,
  ExportPreview,
  BatchExportSettings,
  ExportError,
  ExportEvent,
  ExportEventType
} from '../types/export';

interface UseExportOptions {
  onProgress?: (progress: ExportProgress) => void;
  onComplete?: (job: ExportJob) => void;
  onError?: (error: ExportError) => void;
  maxConcurrentJobs?: number;
}

interface UseExportReturn {
  // State
  queue: ExportQueue;
  currentJob: ExportJob | null;
  isExporting: boolean;
  progress: ExportProgress | null;
  history: ExportHistory[];
  error: ExportError | null;
  
  // Actions
  startExport: (settings: ExportSettings, projectName?: string) => Promise<string>;
  startBatchExport: (batchSettings: BatchExportSettings) => Promise<string[]>;
  cancelExport: (jobId: string) => void;
  pauseExport: (jobId: string) => void;
  resumeExport: (jobId: string) => void;
  clearQueue: () => void;
  removeFromQueue: (jobId: string) => void;
  retryExport: (jobId: string) => void;
  
  // Preview
  generatePreview: (settings: ExportSettings) => Promise<ExportPreview>;
  estimateFileSize: (settings: ExportSettings, duration: number) => number;
  
  // History
  getExportHistory: () => ExportHistory[];
  clearHistory: () => void;
  reExport: (historyId: string) => Promise<string>;
  
  // Utilities
  validateSettings: (settings: ExportSettings) => { valid: boolean; errors: string[] };
  getOptimalSettings: (platform: string) => ExportSettings;
  calculateEstimatedTime: (settings: ExportSettings, duration: number) => number;
}

export const useExport = (options: UseExportOptions = {}): UseExportReturn => {
  const {
    onProgress,
    onComplete,
    onError,
    maxConcurrentJobs = 2
  } = options;

  // State
  const [queue, setQueue] = useState<ExportQueue>({
    jobs: [],
    totalJobs: 0,
    completedJobs: 0,
    failedJobs: 0
  });
  
  const [currentJob, setCurrentJob] = useState<ExportJob | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [history, setHistory] = useState<ExportHistory[]>([]);
  const [error, setError] = useState<ExportError | null>(null);
  
  // Refs
  const workersRef = useRef<Map<string, Worker>>(new Map());
  const eventListenersRef = useRef<Map<string, (event: ExportEvent) => void>>(new Map());

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('export_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Failed to load export history:', e);
      }
    }
  }, []);

  // Save history to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('export_history', JSON.stringify(history));
  }, [history]);

  // Generate unique job ID
  const generateJobId = useCallback((): string => {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Validate export settings
  const validateSettings = useCallback((settings: ExportSettings): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!settings.format) {
      errors.push('Formato de exportação é obrigatório');
    }
    
    if (!settings.resolution) {
      errors.push('Resolução é obrigatória');
    }
    
    if (settings.frameRate <= 0 || settings.frameRate > 120) {
      errors.push('Taxa de quadros deve estar entre 1 e 120 fps');
    }
    
    if (!settings.codec) {
      errors.push('Codec é obrigatório');
    }
    
    if (settings.includeWatermark && !settings.watermarkText.trim()) {
      errors.push('Texto da marca d\'água é obrigatório quando marca d\'água está habilitada');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  // Estimate file size based on settings
  const estimateFileSize = useCallback((settings: ExportSettings, duration: number): number => {
    // Basic estimation formula (in MB)
    const bitrateKbps = parseInt(settings.bitrate.replace('k', ''));
    const audioBitrateKbps = parseInt(settings.audioBitrate.replace('k', ''));
    const totalBitrateKbps = bitrateKbps + audioBitrateKbps;
    
    // Convert to MB: (bitrate in kbps * duration in seconds) / (8 * 1024)
    const estimatedSizeMB = (totalBitrateKbps * duration) / (8 * 1024);
    
    // Apply compression factor based on codec
    let compressionFactor = 1;
    switch (settings.codec) {
      case 'H.265':
        compressionFactor = 0.7; // H.265 is more efficient
        break;
      case 'VP9':
        compressionFactor = 0.75;
        break;
      case 'H.264':
      default:
        compressionFactor = 1;
        break;
    }
    
    return Math.round(estimatedSizeMB * compressionFactor);
  }, []);

  // Calculate estimated export time
  const calculateEstimatedTime = useCallback((settings: ExportSettings, duration: number): number => {
    // Base time factor (how many times longer than real-time)
    let timeFactor = 1;
    
    // Adjust based on resolution
    const [width, height] = settings.resolution.split('x').map(Number);
    const pixels = width * height;
    
    if (pixels >= 3840 * 2160) { // 4K
      timeFactor *= 4;
    } else if (pixels >= 2560 * 1440) { // 2K
      timeFactor *= 2.5;
    } else if (pixels >= 1920 * 1080) { // 1080p
      timeFactor *= 1.5;
    }
    
    // Adjust based on codec
    switch (settings.codec) {
      case 'H.265':
        timeFactor *= 2; // H.265 is slower to encode
        break;
      case 'VP9':
        timeFactor *= 1.8;
        break;
    }
    
    // Adjust based on frame rate
    if (settings.frameRate >= 60) {
      timeFactor *= 1.5;
    }
    
    return Math.round(duration * timeFactor);
  }, []);

  // Get optimal settings for platform
  const getOptimalSettings = useCallback((platform: string): ExportSettings => {
    const baseSettings: ExportSettings = {
      format: 'mp4',
      resolution: '1920x1080',
      frameRate: 30,
      quality: 'high',
      codec: 'H.264',
      bitrate: '8000k',
      audioFormat: 'AAC',
      audioBitrate: '320k',
      includeWatermark: false,
      watermarkText: '',
      watermarkPosition: 'bottom-right',
      watermarkOpacity: 0.8,
      includeSubtitles: false
    };

    switch (platform.toLowerCase()) {
      case 'youtube':
        return {
          ...baseSettings,
          resolution: '1920x1080',
          frameRate: 30,
          bitrate: '8000k'
        };
      
      case 'instagram':
        return {
          ...baseSettings,
          resolution: '1080x1080',
          frameRate: 30,
          bitrate: '3500k'
        };
      
      case 'tiktok':
        return {
          ...baseSettings,
          resolution: '1080x1920',
          frameRate: 30,
          bitrate: '2000k'
        };
      
      case 'facebook':
        return {
          ...baseSettings,
          resolution: '1920x1080',
          frameRate: 30,
          bitrate: '4000k'
        };
      
      case 'linkedin':
        return {
          ...baseSettings,
          resolution: '1920x1080',
          frameRate: 30,
          bitrate: '5000k'
        };
      
      default:
        return baseSettings;
    }
  }, []);

  // Generate preview
  const generatePreview = useCallback(async (settings: ExportSettings): Promise<ExportPreview> => {
    // Simulate preview generation
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          thumbnails: [], // Would contain actual thumbnail data
          duration: 0, // Would be calculated from project
          fileSize: estimateFileSize(settings, 60), // Assuming 60 seconds for preview
          bitrate: settings.bitrate,
          resolution: settings.resolution,
          frameRate: settings.frameRate,
          audioChannels: 2,
          audioSampleRate: 48000
        });
      }, 1000);
    });
  }, [estimateFileSize]);

  // Start export
  const startExport = useCallback(async (settings: ExportSettings, projectName = 'Untitled Project'): Promise<string> => {
    const validation = validateSettings(settings);
    if (!validation.valid) {
      const error: ExportError = {
        code: 'INVALID_SETTINGS',
        message: 'Configurações de exportação inválidas',
        details: validation.errors,
        timestamp: new Date(),
        recoverable: true,
        suggestions: ['Verifique as configurações e tente novamente']
      };
      setError(error);
      onError?.(error);
      throw error;
    }

    const jobId = generateJobId();
    const job: ExportJob = {
      id: jobId,
      name: projectName,
      settings,
      status: 'pending',
      progress: 0,
      startTime: new Date()
    };

    setQueue(prev => ({
      ...prev,
      jobs: [...prev.jobs, job],
      totalJobs: prev.totalJobs + 1
    }));

    // Start processing if not already exporting
    if (!isExporting) {
      processQueue();
    }

    return jobId;
  }, [validateSettings, generateJobId, isExporting, onError]);

  // Start batch export
  const startBatchExport = useCallback(async (batchSettings: BatchExportSettings): Promise<string[]> => {
    const jobIds: string[] = [];
    
    for (const projectId of batchSettings.projects) {
      const jobId = await startExport(batchSettings.settings, `Project ${projectId}`);
      jobIds.push(jobId);
    }
    
    return jobIds;
  }, [startExport]);

  // Process export queue
  const processQueue = useCallback(async () => {
    if (isExporting) return;
    
    const pendingJobs = queue.jobs.filter(job => job.status === 'pending');
    if (pendingJobs.length === 0) return;
    
    setIsExporting(true);
    const job = pendingJobs[0];
    setCurrentJob(job);
    
    // Update job status
    setQueue(prev => ({
      ...prev,
      jobs: prev.jobs.map(j => 
        j.id === job.id ? { ...j, status: 'processing' as const } : j
      )
    }));
    
    try {
      // Simulate export process
      await simulateExport(job);
      
      // Mark as completed
      const completedJob: ExportJob = {
        ...job,
        status: 'completed',
        progress: 100,
        endTime: new Date(),
        outputPath: `/exports/${job.name}_${job.id}.${job.settings.format}`
      };
      
      setQueue(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => j.id === job.id ? completedJob : j),
        completedJobs: prev.completedJobs + 1
      }));
      
      // Add to history
      const historyEntry: ExportHistory = {
        id: job.id,
        projectName: job.name,
        settings: job.settings,
        exportDate: new Date(),
        outputPath: completedJob.outputPath!,
        fileSize: estimateFileSize(job.settings, 60),
        duration: 60,
        success: true
      };
      
      setHistory(prev => [historyEntry, ...prev]);
      onComplete?.(completedJob);
      
    } catch (error) {
      // Mark as failed
      const failedJob: ExportJob = {
        ...job,
        status: 'failed',
        endTime: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Erro desconhecido'
      };
      
      setQueue(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => j.id === job.id ? failedJob : j),
        failedJobs: prev.failedJobs + 1
      }));
      
      const exportError: ExportError = {
        code: 'EXPORT_FAILED',
        message: 'Falha na exportação',
        details: error,
        timestamp: new Date(),
        jobId: job.id,
        recoverable: true,
        suggestions: ['Tente novamente', 'Verifique as configurações']
      };
      
      setError(exportError);
      onError?.(exportError);
    } finally {
      setIsExporting(false);
      setCurrentJob(null);
      setProgress(null);
      
      // Process next job in queue
      setTimeout(() => processQueue(), 100);
    }
  }, [isExporting, queue.jobs, estimateFileSize, onComplete, onError]);

  // Simulate export process
  const simulateExport = useCallback(async (job: ExportJob): Promise<void> => {
    const totalFrames = 1800; // 60 seconds at 30fps
    
    for (let frame = 0; frame <= totalFrames; frame++) {
      const progress = Math.round((frame / totalFrames) * 100);
      
      const progressData: ExportProgress = {
        jobId: job.id,
        progress,
        stage: frame < totalFrames * 0.1 ? 'preparing' : 
               frame < totalFrames * 0.9 ? 'encoding' : 'finalizing',
        currentFrame: frame,
        totalFrames,
        fps: 30,
        timeRemaining: Math.round((totalFrames - frame) / 30),
        fileSize: Math.round((frame / totalFrames) * estimateFileSize(job.settings, 60))
      };
      
      setProgress(progressData);
      onProgress?.(progressData);
      
      // Update job progress
      setQueue(prev => ({
        ...prev,
        jobs: prev.jobs.map(j => 
          j.id === job.id ? { ...j, progress } : j
        )
      }));
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }, [estimateFileSize, onProgress]);

  // Cancel export
  const cancelExport = useCallback((jobId: string) => {
    setQueue(prev => ({
      ...prev,
      jobs: prev.jobs.map(job => 
        job.id === jobId ? { ...job, status: 'cancelled' as const } : job
      )
    }));
    
    // Stop worker if exists
    const worker = workersRef.current.get(jobId);
    if (worker) {
      worker.terminate();
      workersRef.current.delete(jobId);
    }
  }, []);

  // Pause export
  const pauseExport = useCallback((jobId: string) => {
    // Implementation would pause the actual export process
  }, []);

  // Resume export
  const resumeExport = useCallback((jobId: string) => {
    // Implementation would resume the actual export process
  }, []);

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue({
      jobs: [],
      totalJobs: 0,
      completedJobs: 0,
      failedJobs: 0
    });
  }, []);

  // Remove from queue
  const removeFromQueue = useCallback((jobId: string) => {
    setQueue(prev => ({
      ...prev,
      jobs: prev.jobs.filter(job => job.id !== jobId)
    }));
  }, []);

  // Retry export
  const retryExport = useCallback((jobId: string) => {
    setQueue(prev => ({
      ...prev,
      jobs: prev.jobs.map(job => 
        job.id === jobId 
          ? { ...job, status: 'pending' as const, progress: 0, errorMessage: undefined }
          : job
      )
    }));
    
    if (!isExporting) {
      processQueue();
    }
  }, [isExporting, processQueue]);

  // Get export history
  const getExportHistory = useCallback((): ExportHistory[] => {
    return history;
  }, [history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('export_history');
  }, []);

  // Re-export from history
  const reExport = useCallback(async (historyId: string): Promise<string> => {
    const historyEntry = history.find(h => h.id === historyId);
    if (!historyEntry) {
      throw new Error('Entrada do histórico não encontrada');
    }
    
    return startExport(historyEntry.settings, historyEntry.projectName);
  }, [history, startExport]);

  // Start processing queue when jobs are added
  useEffect(() => {
    if (!isExporting && queue.jobs.some(job => job.status === 'pending')) {
      processQueue();
    }
  }, [queue.jobs, isExporting, processQueue]);

  return {
    // State
    queue,
    currentJob,
    isExporting,
    progress,
    history,
    error,
    
    // Actions
    startExport,
    startBatchExport,
    cancelExport,
    pauseExport,
    resumeExport,
    clearQueue,
    removeFromQueue,
    retryExport,
    
    // Preview
    generatePreview,
    estimateFileSize,
    
    // History
    getExportHistory,
    clearHistory,
    reExport,
    
    // Utilities
    validateSettings,
    getOptimalSettings,
    calculateEstimatedTime
  };
};

export default useExport;