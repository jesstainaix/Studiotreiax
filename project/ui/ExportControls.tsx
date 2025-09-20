// FASE 5 - Export Controls UI Component
// React component for export controls with progress display and download buttons

import React, { useState, useEffect } from 'react';

interface ExportControlsProps {
  projectPath: string;
  className?: string;
}

interface ExportSettings {
  quality: '1080p' | '4K';
  format: 'mp4' | 'webm' | 'both';
  bitrate: string;
  fps: number;
  enableLipSync: boolean;
  enableSubtitles: boolean;
}

interface ProgressState {
  jobId?: string;
  phase: string;
  percentage: number;
  message: string;
  eta?: string;
  throughput?: string;
}

interface RenderJob {
  id: string;
  name: string;
  status: string;
  progress: {
    phase: string;
    percentage: number;
    message: string;
    eta?: number;
  };
  outputs?: {
    mp4Path?: string;
    webmPath?: string;
    srtPath?: string;
  };
  error?: string;
}

const ExportControls: React.FC<ExportControlsProps> = ({ 
  projectPath, 
  className = '' 
}) => {
  const [settings, setSettings] = useState<ExportSettings>({
    quality: '1080p',
    format: 'both',
    bitrate: '8M',
    fps: 30,
    enableLipSync: true,
    enableSubtitles: true
  });

  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ProgressState>({
    phase: '',
    percentage: 0,
    message: '',
  });
  
  const [exportedFiles, setExportedFiles] = useState<{
    mp4Path?: string;
    webmPath?: string;
    srtPath?: string;
  }>({});
  
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

  useEffect(() => {
    // Cleanup event source on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const connectToProgressStream = (jobId: string) => {
    // Close existing connection
    if (eventSource) {
      eventSource.close();
    }

    // Connect to Server-Sent Events for real-time progress
    const es = new EventSource(`/api/render/${jobId}/stream`);
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        setProgress({
          jobId: data.jobId,
          phase: data.progress?.phase || 'processing',
          percentage: data.progress?.percentage || 0,
          message: data.progress?.message || 'Processando...',
          eta: data.progress?.eta ? formatTime(data.progress.eta) : undefined
        });

        // Handle job completion
        if (data.status === 'completed') {
          setIsExporting(false);
          setProgress({
            jobId: data.jobId,
            phase: 'completed',
            percentage: 100,
            message: 'Exportação concluída com sucesso!'
          });
          
          if (data.outputs) {
            setExportedFiles(data.outputs);
          }
          
          es.close();
        } else if (data.status === 'failed') {
          setIsExporting(false);
          setErrorMessage(data.error || 'Erro na exportação');
          setProgress({
            jobId: data.jobId,
            phase: 'failed',
            percentage: data.progress?.percentage || 0,
            message: data.error || 'Exportação falhou'
          });
          
          es.close();
        }
      } catch (error) {
        console.error('Error parsing progress data:', error);
      }
    };

    es.onerror = (error) => {
      console.error('EventSource failed:', error);
      setErrorMessage('Conexão com servidor perdida');
      es.close();
    };

    setEventSource(es);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage('');
    setExportedFiles({});
    setProgress({
      phase: 'initialization',
      percentage: 0,
      message: 'Iniciando exportação...'
    });

    try {
      const requestBody = {
        jobName: 'Final Video Export',
        projectPath,
        outputPath: `${projectPath}/data/renders`,
        settings: {
          quality: settings.quality,
          fps: settings.fps,
          format: settings.format,
          bitrate: {
            video: settings.bitrate,
            audio: '128k'
          },
          enableLipSync: settings.enableLipSync,
          enableSubtitles: settings.enableSubtitles,
          enableMarkers: true
        }
      };

      const response = await fetch('/api/render', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown server error');
      }

      const jobId = result.jobId;
      setCurrentJobId(jobId);
      
      // Connect to progress stream
      connectToProgressStream(jobId);

      console.log(`[ExportControls] Export job started: ${jobId}`);
      
    } catch (error) {
      console.error('Export error:', error);
      setIsExporting(false);
      setErrorMessage(`Erro ao iniciar exportação: ${error.message}`);
    }
  };

  const handleDownload = (filePath: string, fileName: string) => {
    // Create download link
    const link = document.createElement('a');
    link.href = `/api/download?path=${encodeURIComponent(filePath)}`;
    link.download = fileName;
    link.click();
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getQualityDescription = (quality: '1080p' | '4K'): string => {
    return quality === '1080p' 
      ? 'Full HD (1920x1080) - Recomendado para a maioria dos usos'
      : '4K Ultra HD (3840x2160) - Máxima qualidade, arquivos maiores';
  };

  const getBitrateDescription = (bitrate: string): string => {
    const descriptions = {
      '4M': 'Qualidade padrão - arquivos menores',
      '8M': 'Alta qualidade - recomendado',
      '12M': 'Qualidade máxima - arquivos grandes',
      '16M': 'Qualidade premium - 4K apenas'
    };
    return descriptions[bitrate] || 'Personalizado';
  };

  return (
    <div className={`export-controls bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        Exportar Vídeo Final
      </h2>

      {/* Export Settings */}
      <div className="space-y-6 mb-8">
        {/* Quality Settings */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Qualidade de Vídeo
          </label>
          <div className="space-y-2">
            {(['1080p', '4K'] as const).map((quality) => (
              <label key={quality} className="flex items-center">
                <input
                  type="radio"
                  value={quality}
                  checked={settings.quality === quality}
                  onChange={(e) => setSettings({ ...settings, quality: e.target.value as '1080p' | '4K' })}
                  className="mr-3 text-blue-600"
                  disabled={isExporting}
                />
                <div>
                  <span className="font-medium">{quality}</span>
                  <p className="text-sm text-gray-600">{getQualityDescription(quality)}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Format Settings */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Formato de Saída
          </label>
          <div className="space-y-2">
            {(['mp4', 'webm', 'both'] as const).map((format) => (
              <label key={format} className="flex items-center">
                <input
                  type="radio"
                  value={format}
                  checked={settings.format === format}
                  onChange={(e) => setSettings({ ...settings, format: e.target.value as 'mp4' | 'webm' | 'both' })}
                  className="mr-3 text-blue-600"
                  disabled={isExporting}
                />
                <span className="font-medium">
                  {format === 'mp4' && 'MP4 apenas'}
                  {format === 'webm' && 'WebM apenas'}
                  {format === 'both' && 'MP4 + WebM (Recomendado)'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Bitrate Settings */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Taxa de Bits
          </label>
          <select
            value={settings.bitrate}
            onChange={(e) => setSettings({ ...settings, bitrate: e.target.value })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={isExporting}
          >
            <option value="4M">4 Mbps</option>
            <option value="8M">8 Mbps (Recomendado)</option>
            <option value="12M">12 Mbps</option>
            {settings.quality === '4K' && <option value="16M">16 Mbps</option>}
          </select>
          <p className="text-sm text-gray-600 mt-1">
            {getBitrateDescription(settings.bitrate)}
          </p>
        </div>

        {/* FPS Settings */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Taxa de Quadros (FPS)
          </label>
          <select
            value={settings.fps}
            onChange={(e) => setSettings({ ...settings, fps: parseInt(e.target.value) })}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={isExporting}
          >
            <option value={24}>24 FPS (Cinema)</option>
            <option value={30}>30 FPS (Padrão)</option>
            <option value={60}>60 FPS (Suave)</option>
          </select>
        </div>

        {/* Feature Toggles */}
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableLipSync}
              onChange={(e) => setSettings({ ...settings, enableLipSync: e.target.checked })}
              className="mr-3 text-blue-600"
              disabled={isExporting}
            />
            <span className="font-medium">Habilitar Sincronização Labial</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={settings.enableSubtitles}
              onChange={(e) => setSettings({ ...settings, enableSubtitles: e.target.checked })}
              className="mr-3 text-blue-600"
              disabled={isExporting}
            />
            <span className="font-medium">Gerar Legendas (.SRT)</span>
          </label>
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className={`w-full py-4 px-6 rounded-md font-semibold text-white transition-colors ${
          isExporting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
        }`}
      >
        {isExporting ? 'Exportando...' : 'Iniciar Exportação'}
      </button>

      {/* Progress Display */}
      {(isExporting || progress.percentage > 0) && (
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              {progress.phase && progress.phase.charAt(0).toUpperCase() + progress.phase.slice(1)}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {progress.percentage}%
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{progress.message}</p>
          
          {(progress.eta || progress.throughput) && (
            <div className="flex justify-between text-xs text-gray-500">
              {progress.eta && <span>ETA: {progress.eta}</span>}
              {progress.throughput && <span>{progress.throughput}</span>}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Erro na Exportação
              </h3>
              <div className="mt-2 text-sm text-red-700">
                {errorMessage}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Links */}
      {(exportedFiles.mp4Path || exportedFiles.webmPath || exportedFiles.srtPath) && (
        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-md">
          <h3 className="text-sm font-medium text-green-800 mb-3">
            ✅ Exportação Concluída - Downloads Disponíveis:
          </h3>
          
          <div className="space-y-2">
            {exportedFiles.mp4Path && (
              <button
                onClick={() => handleDownload(exportedFiles.mp4Path!, 'final_video.mp4')}
                className="flex items-center w-full p-3 text-left bg-white border border-green-200 rounded-md hover:bg-green-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-green-800">📹 MP4 Video</div>
                  <div className="text-sm text-green-600">Compatível com todos os players</div>
                </div>
                <div className="text-green-600">↓</div>
              </button>
            )}
            
            {exportedFiles.webmPath && (
              <button
                onClick={() => handleDownload(exportedFiles.webmPath!, 'final_video.webm')}
                className="flex items-center w-full p-3 text-left bg-white border border-green-200 rounded-md hover:bg-green-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-green-800">🌐 WebM Video</div>
                  <div className="text-sm text-green-600">Otimizado para web</div>
                </div>
                <div className="text-green-600">↓</div>
              </button>
            )}
            
            {exportedFiles.srtPath && (
              <button
                onClick={() => handleDownload(exportedFiles.srtPath!, 'captions.srt')}
                className="flex items-center w-full p-3 text-left bg-white border border-green-200 rounded-md hover:bg-green-50 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-green-800">📝 Legendas SRT</div>
                  <div className="text-sm text-green-600">Arquivo de legendas sincronizadas</div>
                </div>
                <div className="text-green-600">↓</div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportControls;