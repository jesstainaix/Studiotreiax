import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Download, X, Eye, Settings, Zap } from 'lucide-react';
import { ExportSettings, FileEstimate } from '../../types/export';
import { CompressionEngine } from '../../services/compressionEngine';

interface QualityPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ExportSettings;
  onExport: () => void;
  onSettingsChange: (settings: ExportSettings) => void;
}

interface PreviewSegment {
  startTime: number;
  duration: number;
  label: string;
}

const QualityPreview: React.FC<QualityPreviewProps> = ({
  isOpen,
  onClose,
  settings,
  onExport,
  onSettingsChange
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [estimate, setEstimate] = useState<FileEstimate | null>(null);
  const [selectedSegment, setSelectedSegment] = useState(0);
  const [qualityComparison, setQualityComparison] = useState<{
    original: string;
    compressed: string;
  } | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const compressionEngine = new CompressionEngine();
  
  // Segmentos de preview (início, meio, fim)
  const previewSegments: PreviewSegment[] = [
    { startTime: 0, duration: 5, label: 'Início' },
    { startTime: Math.max(0, (settings.duration / 2) - 2.5), duration: 5, label: 'Meio' },
    { startTime: Math.max(0, settings.duration - 5), duration: 5, label: 'Final' }
  ];

  useEffect(() => {
    if (isOpen) {
      generateEstimate();
    }
  }, [isOpen, settings]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, [previewUrl]);

  const generateEstimate = async () => {
    try {
      const fileEstimate = await compressionEngine.estimateFileSize(
        settings.resolution.width,
        settings.resolution.height,
        settings.duration,
        settings.frameRate,
        settings.quality
      );
      setEstimate(fileEstimate);
    } catch (error) {
      console.error('Erro ao gerar estimativa:', error);
    }
  };

  const generatePreview = async (segmentIndex: number) => {
    setIsGenerating(true);
    setSelectedSegment(segmentIndex);
    
    try {
      // Simular geração de preview
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Em uma implementação real, aqui seria gerado o preview do segmento
      const mockPreviewUrl = `data:video/mp4;base64,mock_preview_${segmentIndex}`;
      setPreviewUrl(mockPreviewUrl);
      
      // Gerar comparação de qualidade
      setQualityComparison({
        original: `data:image/jpeg;base64,mock_original_${segmentIndex}`,
        compressed: `data:image/jpeg;base64,mock_compressed_${segmentIndex}`
      });
      
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Boa';
    if (score >= 50) return 'Média';
    return 'Baixa';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Preview de Qualidade</h2>
            <p className="text-sm text-gray-500 mt-1">
              Visualize o resultado antes da exportação final
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 flex overflow-hidden">
          {/* Preview Area */}
          <div className="flex-1 flex flex-col p-6">
            {/* Segment Selection */}
            <div className="flex space-x-2 mb-4">
              {previewSegments.map((segment, index) => (
                <button
                  key={index}
                  onClick={() => generatePreview(index)}
                  disabled={isGenerating}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedSegment === index
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-transparent'
                  } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Eye className="w-4 h-4 inline mr-2" />
                  {segment.label}
                  <span className="block text-xs text-gray-500 mt-1">
                    {formatTime(segment.startTime)} - {formatTime(segment.startTime + segment.duration)}
                  </span>
                </button>
              ))}
            </div>
            
            {/* Video Preview */}
            <div className="flex-1 bg-black rounded-lg overflow-hidden relative">
              {isGenerating ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-white">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                    <p>Gerando preview...</p>
                  </div>
                </div>
              ) : previewUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={previewUrl}
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={togglePlayPause}
                        className="text-white hover:text-gray-300 transition-colors"
                      >
                        {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                      </button>
                      
                      <div className="flex-1 flex items-center space-x-2">
                        <span className="text-white text-sm">{formatTime(currentTime)}</span>
                        <input
                          type="range"
                          min="0"
                          max={duration || 0}
                          value={currentTime}
                          onChange={handleSeek}
                          className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-white text-sm">{formatTime(duration)}</span>
                      </div>
                      
                      <button
                        onClick={() => generatePreview(selectedSegment)}
                        className="text-white hover:text-gray-300 transition-colors"
                        title="Regenerar preview"
                      >
                        <RotateCcw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Eye className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Selecione um segmento para preview</p>
                    <p className="text-sm opacity-75">Escolha início, meio ou final do vídeo</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Settings Panel */}
          <div className="w-80 border-l border-gray-200 p-6 overflow-y-auto">
            {/* File Estimate */}
            {estimate && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Estimativa do Arquivo</h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tamanho estimado:</span>
                    <span className="font-medium">{formatFileSize(estimate.compressedSize)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Redução:</span>
                    <span className="font-medium text-green-600">
                      {estimate.sizeReductionPercentage.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Qualidade:</span>
                    <span className={`font-medium ${getQualityColor(estimate.qualityScore)}`}>
                      {getQualityLabel(estimate.qualityScore)} ({estimate.qualityScore}%)
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tempo de download:</span>
                    <span className="font-medium">{formatTime(estimate.downloadTime)}</span>
                  </div>
                </div>
                
                {/* Quality Bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Qualidade</span>
                    <span>{estimate.qualityScore}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        estimate.qualityScore >= 90 ? 'bg-green-500' :
                        estimate.qualityScore >= 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${estimate.qualityScore}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            
            {/* Quality Comparison */}
            {qualityComparison && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Comparação de Qualidade</h3>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Original</p>
                    <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Frame Original</span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Comprimido</p>
                    <div className="w-full h-24 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 text-sm">Frame Comprimido</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Quick Settings */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ajustes Rápidos</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Qualidade
                  </label>
                  <select
                    value={settings.quality}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      quality: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Baixa (Menor arquivo)</option>
                    <option value="medium">Média (Balanceado)</option>
                    <option value="high">Alta (Melhor qualidade)</option>
                    <option value="ultra">Ultra (Máxima qualidade)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa de Bits (kbps)
                  </label>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="100"
                    value={settings.bitrate}
                    onChange={(e) => onSettingsChange({
                      ...settings,
                      bitrate: parseInt(e.target.value)
                    })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>500</span>
                    <span>{settings.bitrate}</span>
                    <span>10000</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Export Button */}
            <button
              onClick={onExport}
              disabled={!previewUrl}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                previewUrl
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Download className="w-5 h-5" />
              <span>Exportar com estas configurações</span>
            </button>
            
            {!previewUrl && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Gere um preview primeiro para habilitar a exportação
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QualityPreview;