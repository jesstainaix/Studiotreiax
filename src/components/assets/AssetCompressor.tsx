// Componente de interface para compressão inteligente de assets
import React, { useState, useCallback, useRef } from 'react';
import {
  Upload,
  Image,
  Video,
  Download,
  Trash2,
  Zap,
  BarChart3,
  Settings,
  X,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAssetCompression } from '../../hooks/useAssetCompression';
import type { CompressionOptions } from '../../utils/assetCompression';

interface AssetCompressorProps {
  onCompressionComplete?: (results: any[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

const AssetCompressor: React.FC<AssetCompressorProps> = ({
  onCompressionComplete,
  maxFiles = 10,
  acceptedTypes = ['image/*', 'video/*']
}) => {
  const {
    compression,
    compressImages,
    compressVideoFile,
    cancelCompression,
    clearResults,
    downloadCompressed,
    downloadAllAsZip,
    getTotalSavings,
    isProcessing
  } = useAssetCompression();

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [compressionOptions, setCompressionOptions] = useState<CompressionOptions>({
    quality: 0.8,
    maxWidth: 1920,
    maxHeight: 1080,
    format: 'webp'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<Map<string, string>>(new Map());
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Manipular seleção de arquivos
  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files).slice(0, maxFiles);
    setSelectedFiles(fileArray);

    // Criar URLs de preview
    const newPreviewUrls = new Map();
    fileArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        newPreviewUrls.set(file.name, URL.createObjectURL(file));
      }
    });
    setPreviewUrls(newPreviewUrls);
  }, [maxFiles]);

  // Drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Iniciar compressão
  const handleCompress = useCallback(async () => {
    if (selectedFiles.length === 0) return;

    try {
      const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));
      const videoFiles = selectedFiles.filter(file => file.type.startsWith('video/'));

      const results = [];

      // Comprimir imagens
      if (imageFiles.length > 0) {
        const imageResults = await compressImages(imageFiles, compressionOptions);
        results.push(...imageResults);
      }

      // Comprimir vídeos
      for (const videoFile of videoFiles) {
        const videoResult = await compressVideoFile(videoFile, {
          quality: compressionOptions.quality
        });
        results.push(videoResult);
      }

      onCompressionComplete?.(results);
    } catch (error) {
      console.error('Erro na compressão:', error);
    }
  }, [selectedFiles, compressionOptions, compressImages, compressVideoFile, onCompressionComplete]);

  // Remover arquivo selecionado
  const removeFile = useCallback((index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);

    // Limpar preview URL
    const fileToRemove = selectedFiles[index];
    if (fileToRemove && previewUrls.has(fileToRemove.name)) {
      URL.revokeObjectURL(previewUrls.get(fileToRemove.name)!);
      const newPreviewUrls = new Map(previewUrls);
      newPreviewUrls.delete(fileToRemove.name);
      setPreviewUrls(newPreviewUrls);
    }
  }, [selectedFiles, previewUrls]);

  // Limpar tudo
  const handleClear = useCallback(() => {
    setSelectedFiles([]);
    clearResults();
    
    // Limpar URLs de preview
    previewUrls.forEach(url => URL.revokeObjectURL(url));
    setPreviewUrls(new Map());
  }, [clearResults, previewUrls]);

  // Calcular estatísticas
  const totalSavings = getTotalSavings();
  const hasResults = compression.results.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Zap className="w-6 h-6 text-blue-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Compressor Inteligente
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {(selectedFiles.length > 0 || hasResults) && (
            <button
              onClick={handleClear}
              className="p-2 text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Configurações */}
      {showSettings && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Configurações de Compressão
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Qualidade
              </label>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={compressionOptions.quality}
                onChange={(e) => setCompressionOptions(prev => ({
                  ...prev,
                  quality: parseFloat(e.target.value)
                }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">
                {Math.round((compressionOptions.quality || 0.8) * 100)}%
              </span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Largura Máxima
              </label>
              <input
                type="number"
                value={compressionOptions.maxWidth}
                onChange={(e) => setCompressionOptions(prev => ({
                  ...prev,
                  maxWidth: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Altura Máxima
              </label>
              <input
                type="number"
                value={compressionOptions.maxHeight}
                onChange={(e) => setCompressionOptions(prev => ({
                  ...prev,
                  maxHeight: parseInt(e.target.value)
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formato
              </label>
              <select
                value={compressionOptions.format}
                onChange={(e) => setCompressionOptions(prev => ({
                  ...prev,
                  format: e.target.value as any
                }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="webp">WebP</option>
                <option value="jpeg">JPEG</option>
                <option value="png">PNG</option>
                <option value="avif">AVIF</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Suporte para imagens e vídeos (máximo {maxFiles} arquivos)
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Arquivos Selecionados */}
      {selectedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Arquivos Selecionados ({selectedFiles.length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {selectedFiles.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-3">
                  {file.type.startsWith('image/') ? (
                    <div className="relative">
                      <Image className="w-8 h-8 text-blue-500" />
                      {previewUrls.has(file.name) && (
                        <img
                          src={previewUrls.get(file.name)}
                          alt={file.name}
                          className="absolute inset-0 w-8 h-8 object-cover rounded"
                        />
                      )}
                    </div>
                  ) : (
                    <Video className="w-8 h-8 text-green-500" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={handleCompress}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              {isProcessing ? 'Comprimindo...' : 'Comprimir Arquivos'}
            </button>
            
            {isProcessing && (
              <button
                onClick={cancelCompression}
                className="px-4 py-2 text-red-600 hover:text-red-800 transition-colors"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Progresso */}
      {isProcessing && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Progresso da Compressão
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(compression.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${compression.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Erro */}
      {compression.error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{compression.error}</p>
          </div>
        </div>
      )}

      {/* Resultados */}
      {hasResults && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Resultados da Compressão
            </h3>
            
            <button
              onClick={() => downloadAllAsZip(compression.results)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Baixar Tudo (ZIP)
            </button>
          </div>
          
          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Arquivos
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {compression.stats.totalFiles}
              </p>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Economia
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {totalSavings.humanReadable}
              </p>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Redução
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {totalSavings.percentage.toFixed(1)}%
              </p>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">
                  Média
                </span>
              </div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                {compression.stats.averageCompressionRatio.toFixed(1)}%
              </p>
            </div>
          </div>
          
          {/* Lista de resultados */}
          <div className="space-y-3">
            {compression.results.map((result, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  {result.format.startsWith('video') ? (
                    <Video className="w-6 h-6 text-green-500" />
                  ) : (
                    <Image className="w-6 h-6 text-blue-500" />
                  )}
                  
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Arquivo {index + 1} ({result.format.toUpperCase()})
                    </p>
                    <p className="text-sm text-gray-500">
                      {(result.originalSize / 1024 / 1024).toFixed(2)} MB → {(result.compressedSize / 1024 / 1024).toFixed(2)} MB
                      <span className="text-green-600 ml-2">
                        (-{result.compressionRatio.toFixed(1)}%)
                      </span>
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => downloadCompressed(result)}
                  className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:text-blue-800 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Baixar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetCompressor;