import React, { useState, useEffect } from 'react';
import { Card } from '../../ui/card';
import { Progress } from '../../ui/progress';
import { Button } from '../../ui/button';
import { 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  X, 
  Pause, 
  Play, 
  RotateCcw,
  FileVideo,
  FileAudio,
  FileImage,
  File
} from 'lucide-react';
import { toast } from 'sonner';

export interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'paused';
  error?: string;
  result?: any;
  startTime?: number;
  endTime?: number;
  retryCount: number;
  estimatedTimeRemaining?: number;
}

interface MultiFileUploadProgressProps {
  uploads: UploadItem[];
  onCancel: (id: string) => void;
  onRetry: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onClearCompleted: () => void;
  className?: string;
}

export const MultiFileUploadProgress: React.FC<MultiFileUploadProgressProps> = ({
  uploads,
  onCancel,
  onRetry,
  onPause,
  onResume,
  onClearCompleted,
  className = ''
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [totalProgress, setTotalProgress] = useState(0);

  // Calculate overall progress
  useEffect(() => {
    if (uploads.length === 0) {
      setTotalProgress(0);
      return;
    }

    const totalProgress = uploads.reduce((sum, upload) => sum + upload.progress, 0);
    setTotalProgress(totalProgress / uploads.length);
  }, [uploads]);

  // Auto-minimize when all uploads are completed
  useEffect(() => {
    const allCompleted = uploads.length > 0 && uploads.every(upload => 
      ['completed', 'error'].includes(upload.status)
    );
    
    if (allCompleted && !isMinimized) {
      setTimeout(() => setIsMinimized(true), 2000);
    }
  }, [uploads, isMinimized]);

  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'pending':
        return <Upload className="w-4 h-4 text-gray-500" />;
      case 'uploading':
      case 'processing':
        return <Upload className="w-4 h-4 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'paused':
        return <Pause className="w-4 h-4 text-yellow-500" />;
      default:
        return <Upload className="w-4 h-4 text-gray-500" />;
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
      return <FileVideo className="w-5 h-5 text-blue-500" />;
    }
    if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension || '')) {
      return <FileAudio className="w-5 h-5 text-green-500" />;
    }
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <FileImage className="w-5 h-5 text-purple-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (seconds: number): string => {
    if (!seconds || !isFinite(seconds)) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = (upload: UploadItem): string => {
    switch (upload.status) {
      case 'pending':
        return 'Na fila';
      case 'uploading':
        return `Enviando... ${upload.progress}%`;
      case 'processing':
        return 'Processando...';
      case 'completed':
        return 'Concluído';
      case 'error':
        return `Erro: ${upload.error || 'Falha desconhecida'}`;
      case 'paused':
        return 'Pausado';
      default:
        return 'Desconhecido';
    }
  };

  const activeUploads = uploads.filter(u => !['completed', 'error'].includes(u.status));
  const completedUploads = uploads.filter(u => u.status === 'completed');
  const errorUploads = uploads.filter(u => u.status === 'error');

  if (uploads.length === 0) return null;

  return (
    <Card className={`fixed bottom-4 right-4 w-96 max-h-96 shadow-lg z-50 ${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between p-4 border-b cursor-pointer"
        onClick={() => setIsMinimized(!isMinimized)}
      >
        <div className="flex items-center space-x-3">
          <Upload className="w-5 h-5 text-blue-500" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">
              Upload de Arquivos
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {activeUploads.length} ativo • {completedUploads.length} concluído
              {errorUploads.length > 0 && ` • ${errorUploads.length} erro`}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {completedUploads.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onClearCompleted();
              }}
            >
              Limpar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsMinimized(!isMinimized);
            }}
          >
            {isMinimized ? '▲' : '▼'}
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      {!isMinimized && activeUploads.length > 0 && (
        <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Progresso Geral</span>
            <span>{Math.round(totalProgress)}%</span>
          </div>
          <Progress value={totalProgress} className="h-2" />
        </div>
      )}

      {/* Upload List */}
      {!isMinimized && (
        <div className="max-h-64 overflow-y-auto">
          {uploads.map((upload) => (
            <div
              key={upload.id}
              className="p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
            >
              <div className="flex items-start space-x-3">
                {/* File Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getFileIcon(upload.file.name)}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {upload.file.name}
                    </p>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(upload.status)}
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {formatFileSize(upload.file.size)}
                    {upload.estimatedTimeRemaining && upload.status === 'uploading' && (
                      <span> • {formatTime(upload.estimatedTimeRemaining)} restante</span>
                    )}
                  </p>

                  {/* Progress Bar */}
                  {['uploading', 'processing'].includes(upload.status) && (
                    <Progress value={upload.progress} className="h-1 mb-2" />
                  )}

                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <p className={`text-xs ${
                      upload.status === 'error' ? 'text-red-500' :
                      upload.status === 'completed' ? 'text-green-500' :
                      upload.status === 'paused' ? 'text-yellow-500' :
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {getStatusText(upload)}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center space-x-1">
                      {upload.status === 'uploading' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPause(upload.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Pause className="w-3 h-3" />
                        </Button>
                      )}

                      {upload.status === 'paused' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onResume(upload.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}

                      {upload.status === 'error' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRetry(upload.id)}
                          className="h-6 w-6 p-0"
                          title={`Tentativa ${upload.retryCount + 1}`}
                        >
                          <RotateCcw className="w-3 h-3" />
                        </Button>
                      )}

                      {!['completed'].includes(upload.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onCancel(upload.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Retry count indicator */}
                  {upload.retryCount > 0 && (
                    <div className="flex items-center mt-1">
                      <AlertTriangle className="w-3 h-3 text-yellow-500 mr-1" />
                      <p className="text-xs text-yellow-600">
                        Tentativa {upload.retryCount + 1}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Minimized Summary */}
      {isMinimized && (
        <div className="p-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {activeUploads.length > 0 ? (
                `${activeUploads.length} enviando...`
              ) : (
                `${completedUploads.length} concluído`
              )}
            </span>
            {activeUploads.length > 0 && (
              <span className="text-blue-600 font-medium">
                {Math.round(totalProgress)}%
              </span>
            )}
          </div>
          {activeUploads.length > 0 && (
            <Progress value={totalProgress} className="h-1 mt-2" />
          )}
        </div>
      )}
    </Card>
  );
};

export default MultiFileUploadProgress;